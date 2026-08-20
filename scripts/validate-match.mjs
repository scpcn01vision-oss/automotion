// M3 匹配候选校验：MatchResult schema + 镜头存在 + Top5 数量 + 防重复（间隔 <5 段的同一镜头）
// 用法：node scripts/validate-match.mjs <候选JSON>
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isMatchResult } from '../shared/types.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const file = process.argv[2];
if (!file) {
  console.error('用法：node scripts/validate-match.mjs <候选JSON>');
  process.exit(1);
}
const registry = JSON.parse(readFileSync(path.join(ROOT, 'shared', 'registry.json'), 'utf8'));
const lensIds = new Set(registry.entries.map((e) => e.id));

const data = JSON.parse(readFileSync(file, 'utf8'));
let failed = 0;
const fail = (msg) => {
  failed++;
  console.log(`  ✗ ${msg}`);
};
const ok = (msg) => console.log(`  ✓ ${msg}`);

if (!isMatchResult(data)) {
  console.log('候选 JSON 结构不符合 MatchResult');
  process.exit(1);
}
ok(`结构校验通过：${data.segments.length} 段`);

const segIds = new Set();
data.segments.forEach((seg, i) => {
  if (segIds.has(seg.id)) fail(`段 ${i + 1}: id 重复 ${seg.id}`);
  segIds.add(seg.id);
  if (seg.top5.length === 0 || seg.top5.length > 5) fail(`段 ${seg.id}: top5 数量 ${seg.top5.length}（须 1-5）`);
  const seen = new Set();
  seg.top5.forEach((c) => {
    if (!lensIds.has(c.lensId)) fail(`段 ${seg.id}: 镜头不存在 ${c.lensId}`);
    if (seen.has(c.lensId)) fail(`段 ${seg.id}: 候选重复 ${c.lensId}`);
    seen.add(c.lensId);
    if (!c.reason || c.reason.length < 4) fail(`段 ${seg.id}: 理由过短 ${c.lensId}`);
  });
});

// 防重复（定稿后）：同一镜头在相邻 <5 段的 chosen 里重复 → 违规
// 匹配机制约束的是"按顺序匹配时前面已定稿的镜头"，候选列表内部不做互相排除。
const chosenBy = new Map();
data.segments.forEach((seg, i) => {
  if (!seg.chosen) return;
  const last = chosenBy.get(seg.chosen);
  if (last !== undefined && i - last < 5) {
    fail(`防重复：${seg.chosen} 在段 ${last + 1} 与段 ${i + 1} 间隔 ${i - last} 段（<5）`);
  }
  chosenBy.set(seg.chosen, i);
});

console.log(failed ? `校验完成：${failed} 个问题` : '校验全部通过');
process.exit(failed ? 1 : 0);
