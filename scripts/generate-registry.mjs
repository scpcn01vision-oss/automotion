// M2 注册表生成：从 Root.preview + lens-names + 组件 XxxProps 接口 + 镜头场景总表自动生成 shared/registry.json
// 用法：node scripts/generate-registry.mjs
// 输出：shared/registry.json（全量；scenes/usage 来自 docs/lens-scenes-draft.md 人写定义）
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'shared', 'registry.json');

// ---------- 1. Root.preview 注册 id ----------
const rootSrc = readFileSync(path.join(ROOT, 'lenses', 'Root.preview.tsx'), 'utf8');
const ids = [...rootSrc.matchAll(/<Composition\s+id="([A-Za-z0-9]+)"/g)].map((m) => m[1]);

// ---------- 2. lens-names：id → { name, group } ----------
const namesSrc = readFileSync(path.join(ROOT, 'docs', 'lens-names.md'), 'utf8');
const nameMap = new Map();
let currentGroup = '';
for (const line of namesSrc.split('\n')) {
  const gm = line.match(/^## ([^（(]+)/);
  if (gm) {
    currentGroup = gm[1];
    continue;
  }
  const em = line.match(/^\| ([A-Z][A-Za-z0-9]+) \| ([^|]+) \|/);
  if (em && em[1] !== 'id') {
    nameMap.set(em[1], { name: em[2].trim(), group: currentGroup });
  }
}

// ---------- 3. 镜头文件定位 ----------
function findLensFile(id) {
  const lensRoot = path.join(ROOT, 'lenses');
  const found = [];
  const walk = (dir) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (e.name === 'node_modules' || e.name === '_system' || e.name === '_fixtures') continue;
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name === `${id}.tsx`) found.push(path.relative(ROOT, p).replace(/\\/g, '/'));
    }
  };
  walk(lensRoot);
  return found;
}

// ---------- 4. Props 接口字段提取 ----------
function extractProps(src, id) {
  const re = new RegExp(`export interface ${id}Props\\s*\\{`);
  const m = src.match(re);
  if (!m) return null;
  const start = src.indexOf('{', m.index);
  let depth = 0;
  let j = start;
  for (; j < src.length; j++) {
    if (src[j] === '{') depth++;
    else if (src[j] === '}') {
      depth--;
      if (depth === 0) break;
    }
  }
  const body = src.slice(start + 1, j);
  const fields = [];
  for (const line of body.split('\n')) {
    const fm = line.match(/^\s*(\w+)(\??)\s*:\s*(.+?)\s*[;,]?\s*$/);
    if (!fm || fm[1] === 'id') continue;
    // 剥离行内注释与结尾分号（类型内可能含 { a; b } 分号，先剥 // 再取尾分号）
    let type = fm[3];
    const ci = type.indexOf('//');
    if (ci > -1) type = type.slice(0, ci);
    type = type.replace(/[;,]+\s*$/, '').trim();
    fields.push({ name: fm[1], type, optional: fm[2] === '?' });
  }
  return fields;
}

// ---------- 5. 镜头场景总表：id → { scenes, usage }（人写的场景定位） ----------
const scenesSrc = readFileSync(path.join(ROOT, 'docs', 'lens-scenes-draft.md'), 'utf8');
const sceneMap = new Map();
for (const line of scenesSrc.split('\n')) {
  const m = line.match(/^\| ([A-Z][A-Za-z0-9]+) \| ([^|]+) \| ([^|]*) \| ([^|]*) \|/);
  if (m && m[1] !== 'id') {
    const tags = m[3].trim();
    sceneMap.set(m[1], {
      scenes: tags ? tags.split(/[,，、\s]+/).filter(Boolean) : [],
      usage: m[4].trim(),
    });
  }
}

// ---------- 生成 ----------
const entries = ids.map((id) => {
  const meta = nameMap.get(id);
  const sc = sceneMap.get(id);
  const files = findLensFile(id);
  const file = files.length > 0 ? files[0] : 'lenses/tplshots/wrappers.tsx';
  const src = readFileSync(path.join(ROOT, file), 'utf8');
  const props = extractProps(src, id) ?? [];
  return {
    id,
    name: meta?.name ?? '',
    file,
    group: meta?.group ?? '',
    props,
    scenes: sc?.scenes ?? [],
    usage: sc?.usage ?? '',
  };
});

const registry = {
  meta: {
    generatedAt: new Date().toISOString(),
    count: entries.length,
    source: 'Root.preview.tsx + docs/lens-names.md + 组件 XxxProps 接口 + docs/lens-scenes-draft.md',
  },
  entries,
};

writeFileSync(OUT, JSON.stringify(registry, null, 2));

const missingName = entries.filter((e) => !e.name).length;
const missingGroup = entries.filter((e) => !e.group).length;
const noPropsFile = entries.filter((e) => e.props.length === 0).map((e) => e.id);
const noScenes = entries.filter((e) => e.scenes.length === 0).map((e) => e.id);
const noUsage = entries.filter((e) => !e.usage).map((e) => e.id);
console.log(`registry.json 已生成：${entries.length} 条`);
console.log(`缺中文名: ${missingName} | 缺分组: ${missingGroup}`);
console.log(`props 为空的镜头: ${noPropsFile.length}（${noPropsFile.join(', ') || '无'}）`);
console.log(`无场景标签: ${noScenes.length}（${noScenes.join(', ') || '无'}）| 无使用场景描述: ${noUsage.length}（${noUsage.join(', ') || '无'}）`);
