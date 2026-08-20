// automotion-v7 工作台服务（M4）——数据 API
// 端口 3004；项目侧数据路径由环境变量 V7_PROJECT_DIR 指定（不进仓库）
import express from 'express';
import cors from 'cors';
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isStoryboard } from '../../shared/types.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');
const PORT = Number(process.env.PORT ?? 3004);
const PROJECT_DIR = process.env.V7_PROJECT_DIR; // 如 E:\桌面\打破信息差\视频文件\013B
const MATCH_FILE = process.env.MATCH_FILE; // 匹配结果文件（默认仓库 out/match-013B.json）
const DEFAULT_MATCH = path.join(ROOT, 'out', 'match-013B.json');
const SEGMENT_PROFILE_FILE =
  process.env.V7_PROFILE_FILE ?? '段画像-013B.md'; // 项目侧段画像文件名（可用 V7_PROFILE_FILE 覆盖）
const STORYBOARD_FILE = 'storyboard.json'; // 项目侧 storyboard 文件名

const app = express();
app.use(cors());
app.use(express.json({ limit: '20mb' }));

// 健康检查
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, projectDir: PROJECT_DIR ?? null });
});

// 镜头 registry（仓库内 shared/registry.json）
app.get('/api/registry', (_req, res) => {
  const registry = JSON.parse(
    readFileSync(path.join(ROOT, 'shared', 'registry.json'), 'utf8'),
  );
  res.json(registry);
});

// 项目侧信息：目录是否存在 + 文件清单
app.get('/api/project/info', (_req, res) => {
  if (!PROJECT_DIR) {
    res.json({ configured: false, message: '未设置 V7_PROJECT_DIR' });
    return;
  }
  if (!existsSync(PROJECT_DIR)) {
    res.json({ configured: true, exists: false, dir: PROJECT_DIR });
    return;
  }
  const files = readdirSync(PROJECT_DIR)
    .filter((f) => !f.startsWith('.'))
    .map((f) => ({ name: f, size: 0 }));
  res.json({ configured: true, exists: true, dir: PROJECT_DIR, files });
});

// 段画像解析：项目侧「段画像-013B.md」表格 → 段数组
app.get('/api/project/segments', (_req, res) => {
  if (!PROJECT_DIR) {
    res.status(400).json({ error: '未设置 V7_PROJECT_DIR' });
    return;
  }
  const profilePath = path.join(PROJECT_DIR, SEGMENT_PROFILE_FILE);
  if (!existsSync(profilePath)) {
    res.status(404).json({ error: `段画像不存在：${SEGMENT_PROFILE_FILE}` });
    return;
  }
  const md = readFileSync(profilePath, 'utf8');
  const segments = [];
  for (const line of md.split('\n')) {
    const m = line.match(/^\| (\d+) \| (.+?) \| (.+?) \| (.+?) \|\s*$/);
    if (!m) continue;
    const index = Number(m[1]);
    segments.push({
      id: `seg-${String(index).padStart(2, '0')}`,
      index,
      summary: m[2].trim(),
      role: m[3].trim(),
      contentTags: m[4]
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    });
  }
  res.json({ file: SEGMENT_PROFILE_FILE, segments });
});

// 匹配结果（MatchResult）：优先 MATCH_FILE，默认 out/match-013B.json
app.get('/api/match', (_req, res) => {
  const p = MATCH_FILE ?? DEFAULT_MATCH;
  if (!existsSync(p)) {
    res.status(404).json({ error: `匹配结果不存在：${p}` });
    return;
  }
  res.json(JSON.parse(readFileSync(p, 'utf8')));
});

// storyboard 读取：项目侧 storyboard.json；不存在时返回段画像生成的待定稿骨架（不落盘）
app.get('/api/storyboard', (_req, res) => {
  if (!PROJECT_DIR) {
    res.status(400).json({ error: '未设置 V7_PROJECT_DIR' });
    return;
  }
  const sbPath = path.join(PROJECT_DIR, STORYBOARD_FILE);
  if (existsSync(sbPath)) {
    const storyboard = JSON.parse(readFileSync(sbPath, 'utf8'));
    if (!isStoryboard(storyboard)) {
      res.status(500).json({ error: 'storyboard.json 校验失败（结构不合法）' });
      return;
    }
    res.json({ exists: true, storyboard });
    return;
  }
  // 生成待定稿骨架：段信息就位、镜头未定
  const profilePath = path.join(PROJECT_DIR, SEGMENT_PROFILE_FILE);
  if (!existsSync(profilePath)) {
    res.json({ exists: false, storyboard: null });
    return;
  }
  const md = readFileSync(profilePath, 'utf8');
  const segments = [];
  for (const line of md.split('\n')) {
    const m = line.match(/^\| (\d+) \| (.+?) \|/);
    if (!m) continue;
    const index = Number(m[1]);
    segments.push({
      id: `seg-${String(index).padStart(2, '0')}`,
      text: m[2].trim(),
      keywords: [],
      phraseRange: [0, 0],
      durationSec: 0, // 待转录填充真实时长
      lensId: '',
      params: {},
    });
  }
  res.json({
    exists: false,
    storyboard: {
      meta: { title: '待定稿项目', created: new Date().toISOString(), subtitleStyle: {} },
      segments,
    },
  });
});

// storyboard 写入（项目侧）
app.post('/api/storyboard', (req, res) => {
  if (!PROJECT_DIR) {
    res.status(400).json({ error: '未设置 V7_PROJECT_DIR' });
    return;
  }
  const sb = req.body;
  if (!isStoryboard(sb)) {
    res.status(400).json({ error: 'storyboard 结构不合法（meta.title/created/subtitleStyle 或 segments 字段不符合规范）' });
    return;
  }
  const sbPath = path.join(PROJECT_DIR, STORYBOARD_FILE);
  writeFileSync(sbPath, JSON.stringify(sb, null, 2), 'utf8');
  res.json({ ok: true, path: sbPath });
});

// 项目侧音频路由：预览/渲染共用一条 http 地址，音频只存项目目录一份（无快照）
// 浏览器无法加载本地绝对路径（E:\... 会被当未知协议），必须经 server 服务
app.get('/api/audio/:file', (req, res) => {
  if (!PROJECT_DIR) {
    res.status(400).json({ error: '未设置 V7_PROJECT_DIR' });
    return;
  }
  // basename 防目录穿越：只允许项目目录内的文件名
  const name = path.basename(req.params.file);
  const p = path.join(PROJECT_DIR, name);
  if (!existsSync(p)) {
    res.status(404).json({ error: `音频不存在：${name}` });
    return;
  }
  res.type(name.toLowerCase().endsWith('.wav') ? 'audio/wav' : 'application/octet-stream');
  res.sendFile(p);
});

app.listen(PORT, () => {
  console.log(`工作台服务已启动：http://localhost:${PORT}`);
  if (!PROJECT_DIR) console.log('提示：未设置 V7_PROJECT_DIR（项目侧数据目录）');
});
