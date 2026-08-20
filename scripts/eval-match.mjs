// M3 校准：候选 JSON vs 参考答案，算命中率（参考答案镜头 ∈ Top5 即命中）
// 用法：node scripts/eval-match.mjs <候选JSON> <参考答案md>
import { readFileSync } from 'node:fs';

const candFile = process.argv[2];
const stdFile = process.argv[3];
if (!candFile || !stdFile) {
  console.error('用法：node scripts/eval-match.mjs <候选JSON> <参考答案md>');
  process.exit(1);
}

const cand = JSON.parse(readFileSync(candFile, 'utf8'));
const stdSrc = readFileSync(stdFile, 'utf8');

// 参考答案解析：## 段 N → LensId
const std = new Map();
for (const m of stdSrc.matchAll(/##\s*段\s*(\d+)\s*→\s*([A-Za-z0-9]+)/g)) {
  std.set(Number(m[1]), m[2]);
}

let hit = 0;
const miss = [];
cand.segments.forEach((seg) => {
  const n = Number(seg.id.replace(/\D/g, ''));
  const expected = std.get(n);
  const ids = seg.top5.map((c) => c.lensId);
  if (expected && ids.includes(expected)) hit++;
  else miss.push({ seg: seg.id, expected, top5: ids });
});

const total = cand.segments.length;
console.log(`命中率：${hit}/${total} = ${((hit / total) * 100).toFixed(1)}%`);
if (miss.length) {
  console.log('未命中：');
  for (const m of miss) {
    console.log(`  段 ${m.seg}: 参考答案=${m.expected} top5=${m.top5.join(',')}`);
  }
}
