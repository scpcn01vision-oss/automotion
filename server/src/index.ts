// automotion-v7 工作台服务（M4）——数据 API
// 端口 3004；项目侧数据路径由环境变量 V7_PROJECT_DIR 指定（不进仓库）
import express from 'express';
import cors from 'cors';
import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isStoryboard } from '../../shared/types.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');
const PORT = Number(process.env.PORT ?? 3004);
const PROJECT_DIR = process.env.V7_PROJECT_DIR; // 项目侧数据目录，如 E:\桌面\打破信息差\视频文件\015
// 默认文件名按项目目录名推导（如目录 015 → out/match-015.json），显式环境变量优先
const PROJECT_NAME = PROJECT_DIR ? path.basename(PROJECT_DIR) : '';
const MATCH_FILE = process.env.MATCH_FILE; // 匹配结果文件（默认项目侧 out/match-<项目名>.json，与 storyboard 一致）
const DEFAULT_MATCH = PROJECT_DIR
  ? path.join(PROJECT_DIR, 'out', `match-${PROJECT_NAME}.json`)
  : path.join(ROOT, 'out', `match-${PROJECT_NAME}.json`);
const STORYBOARD_FILE = 'storyboard.json'; // 项目侧 storyboard 文件名
const PIC_DIR = PROJECT_DIR ? path.join(PROJECT_DIR, 'pic') : null; // 图片素材标准目录（项目侧 pic/）

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

// 段列表：从项目侧 storyboard.json 派生（段画像已并入 storyboard，不再有独立文件）
app.get('/api/project/segments', (_req, res) => {
  if (!PROJECT_DIR) {
    res.status(400).json({ error: '未设置 V7_PROJECT_DIR' });
    return;
  }
  const sbPath = path.join(PROJECT_DIR, STORYBOARD_FILE);
  if (!existsSync(sbPath)) {
    res.status(404).json({ error: 'storyboard.json 不存在（先完成分割定稿并派生）' });
    return;
  }
  const storyboard = JSON.parse(readFileSync(sbPath, 'utf8'));
  const segments = storyboard.segments.map((s: any, i: number) => ({
    id: s.id,
    index: Number(s.id.replace(/\D/g, '')) || i + 1,
    summary: s.summary ?? (typeof s.text === 'string' ? s.text.slice(0, 40) : ''),
    role: s.role ?? '',
    contentTags: Array.isArray(s.features) ? s.features : [],
  }));
  res.json({ file: STORYBOARD_FILE, segments });
});

// 匹配结果（MatchResult）：优先 MATCH_FILE，默认项目侧 out/match-<项目名>.json
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
  // storyboard 不存在：由派生步骤（定稿分割版 → storyboard.json）生成，server 不兜底
  res.json({ exists: false, storyboard: null });
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

// 项目图片上传：JSON body { filename, dataBase64 }，保存到项目侧 pic/，返回可访问 URL
// pic/ 为图片素材标准目录（不存在则自动创建）
app.post('/api/image', (req, res) => {
  if (!PROJECT_DIR) {
    res.status(400).json({ error: '未设置 V7_PROJECT_DIR' });
    return;
  }
  const { filename, dataBase64 } = req.body ?? {};
  if (typeof filename !== 'string' || typeof dataBase64 !== 'string') {
    res.status(400).json({ error: '需要 filename + dataBase64' });
    return;
  }
  const name = path.basename(filename); // 防目录穿越
  if (!name) {
    res.status(400).json({ error: '文件名无效' });
    return;
  }
  if (PIC_DIR) mkdirSync(PIC_DIR, { recursive: true });
  const p = PIC_DIR ? path.join(PIC_DIR, name) : '';
  writeFileSync(p, Buffer.from(dataBase64, 'base64'));
  res.json({ ok: true, url: `http://localhost:${PORT}/img/${encodeURIComponent(name)}` });
});

// 项目图片静态访问：serve 项目侧 pic/ 下文件（basename 防目录穿越）
app.get('/img/:file', (req, res) => {
  if (!PROJECT_DIR || !PIC_DIR) {
    res.status(400).json({ error: '未设置 V7_PROJECT_DIR' });
    return;
  }
  const name = path.basename(req.params.file);
  const p = path.join(PIC_DIR, name);
  if (!existsSync(p)) {
    res.status(404).json({ error: `图片不存在：${name}` });
    return;
  }
  res.type(path.extname(name) || 'image/png');
  res.sendFile(p);
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
