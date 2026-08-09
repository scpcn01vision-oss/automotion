// M2 校验：registry 一致性 + 数据模型 schema 校验（013B 真实文案 / 最小示例 / 负面测试）
// 用法：node scripts/validate-m2.mjs
// 通过输出 0 退出；失败输出 1
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  isStoryboard,
  isTranscript,
  isSubtitles,
} from '../shared/types.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const ISOLATED_DIR = 'E:\\桌面\\打破信息差\\视频文件\\013B';

let failed = 0;
const fail = (msg) => {
  failed++;
  console.log(`  ✗ ${msg}`);
};
const ok = (msg) => console.log(`  ✓ ${msg}`);

// ---------- 1. registry 与 Root.preview 一致性 ----------
console.log('[1] registry 与 Root.preview 注册一致');
const registry = JSON.parse(readFileSync(path.join(ROOT, 'shared', 'registry.json'), 'utf8'));
const rootSrc = readFileSync(path.join(ROOT, 'lenses', 'Root.preview.tsx'), 'utf8');
const compIds = [...rootSrc.matchAll(/<Composition\s+id="([A-Za-z0-9]+)"/g)].map((m) => m[1]);
const regIds = registry.entries.map((e) => e.id);
const onlyComp = compIds.filter((id) => !regIds.includes(id));
const onlyReg = regIds.filter((id) => !compIds.includes(id));
if (registry.meta.count !== compIds.length) fail(`registry 数量 ${registry.meta.count} != Root.preview ${compIds.length}`);
else ok(`数量一致：${registry.meta.count}`);
if (onlyComp.length || onlyReg.length) fail(`id 不一致：仅注册 ${onlyComp.join(',')}；仅 registry ${onlyReg.join(',')}`);
else ok('id 集合一致');
const badEntry = registry.entries.filter((e) => !e.name || !e.file || !e.group || !Array.isArray(e.props));
if (badEntry.length) fail(`缺字段条目：${badEntry.map((e) => e.id).join(',')}`);
else ok('每条目含 name/file/group/props');
const badDur = registry.entries.filter((e) => !Number.isFinite(e.durationInFrames) || e.durationInFrames <= 0);
if (badDur.length) fail(`时长缺失/非法：${badDur.map((e) => `${e.id}=${e.durationInFrames}`).join(',')}`);
else ok('每条目 durationInFrames 为正数');
const badProp = registry.entries.flatMap((e) =>
  e.props.filter((p) => !p.name || typeof p.type !== 'string' || typeof p.optional !== 'boolean').map((p) => `${e.id}.${p.name}`),
);
if (badProp.length) fail(`props 结构异常：${badProp.join(',')}`);
else ok('props 字段结构正确');
const badNested = registry.entries.flatMap((e) =>
  e.props
    .filter((p) => p.fields !== undefined && !Array.isArray(p.fields))
    .map((p) => `${e.id}.${p.name}`),
);
if (badNested.length) fail(`嵌套 fields 结构异常：${badNested.join(',')}`);
else ok('嵌套 fields 结构正确');

// ---------- 2. storyboard：013B 真实文案 ----------
console.log('[2] storyboard schema 校验（013B 真实文案）');
const scriptPath = path.join(ISOLATED_DIR, '北京智能体新政-视频文案.md');
if (!existsSync(scriptPath)) {
  fail(`013B 文案不存在：${scriptPath}`);
} else {
  const script = readFileSync(scriptPath, 'utf8');
  const rawSegments = script
    .split(/\n\s*\n|\n---\s*\n/)
    .map((s) => s.trim())
    .filter((s) => s && !s.startsWith('#'));
  const storyboard = {
    meta: {
      title: '北京智能体新政（校验样本）',
      created: new Date().toISOString(),
      subtitleStyle: { fontSize: 48, color: '#2c2416', position: 'bottom' },
    },
    segments: rawSegments.map((text, i) => ({
      id: `seg-${String(i + 1).padStart(2, '0')}`,
      text,
      keywords: [],
      phraseRange: [i, i],
      durationSec: Math.max(1, Math.round(text.length / 4)), // 按 4 字/秒粗估，真实时长由转录确定
      lensId: '', // 待 M3 匹配
      params: {},
    })),
  };
  if (!isStoryboard(storyboard)) fail('013B 文案构造的 storyboard 未通过校验');
  else ok(`013B 文案 → ${storyboard.segments.length} 个段，校验通过`);
}

// ---------- 3. 转录 / 字幕最小示例 ----------
console.log('[3] 转录 / 字幕 schema 校验（最小示例）');
const transcript = {
  words: [
    { text: '中国', startSec: 0, endSec: 0.6, segmentId: 'seg-01', indexInSegment: 0 },
    { text: '有句', startSec: 0.6, endSec: 1.1, segmentId: 'seg-01', indexInSegment: 1 },
    { text: '古话', startSec: 1.1, endSec: 1.6, segmentId: 'seg-01', indexInSegment: 2 },
  ],
  segments: [{ id: 'seg-01', startWord: 0, endWord: 2 }],
};
const subtitles = {
  entries: [
    { index: 1, text: '中国有句古话', startSec: 0, endSec: 1.6, segmentId: 'seg-01' },
    { index: 2, text: '叫时势造英雄', startSec: 1.6, endSec: 3.0, segmentId: 'seg-01' },
  ],
  style: { fontSize: 48, position: 'bottom', align: 'center' },
};
if (!isTranscript(transcript)) fail('转录最小示例未通过');
else ok('转录 schema 校验通过');
if (!isSubtitles(subtitles)) fail('字幕最小示例未通过');
else ok('字幕 schema 校验通过');

// ---------- 4. 负面测试（校验函数必须能拒绝坏数据） ----------
console.log('[4] 负面测试：校验函数拒绝坏数据');
const badSb = { meta: { title: 'x', created: 'y', subtitleStyle: {} }, segments: [{ id: 's', text: 123 }] };
if (isStoryboard(badSb)) fail('坏 storyboard 未被拒绝');
else ok('坏 storyboard 被拒绝');
const badTr = { words: [{ text: 'x', startSec: 0, endSec: 0.5, segmentId: 's', indexInSegment: 'a' }], segments: [] };
if (isTranscript(badTr)) fail('坏转录未被拒绝');
else ok('坏转录被拒绝');

console.log(failed === 0 ? `\nM2 校验通过（${registry.meta.count} 条 registry，schema 全部有效）` : `\nM2 校验失败：${failed} 项`);
process.exit(failed === 0 ? 0 : 1);
