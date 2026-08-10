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
// 1b. 每个 Composition 的时长（工作台播放器需要）
const comps = [...rootSrc.matchAll(/<Composition\b([^>]*?)\/>/g)]
  .map((m) => {
    const tag = m[1];
    const id = tag.match(/id="([A-Za-z0-9]+)"/)?.[1];
    const dur = tag.match(/durationInFrames=\{(\d+)\}/)?.[1];
    return id && dur ? { id, durationInFrames: Number(dur) } : null;
  })
  .filter(Boolean);
const durMap = new Map(comps.map((c) => [c.id, c.durationInFrames]));

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

// ---------- 4. Props 接口字段提取（递归：自定义对象/数组类型 → fields 树） ----------
// 支持：同文件 interface / type 别名、跨文件导出类型（globalTypes）、内联对象字面量 { ... }
function stripComments(s) {
  return s.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/\/\/[^\n]*/g, ' ');
}

// 顶层字段片段拆分（深度感知，嵌套 {} 内的 ; / , 不拆分；支持多行 interface）
function splitTopLevel(body) {
  const parts = [];
  let depth = 0;
  let cur = '';
  for (const ch of body) {
    if (ch === '{') depth++;
    else if (ch === '}') depth--;
    if ((ch === ';' || ch === ',') && depth === 0) {
      parts.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  if (cur.trim()) parts.push(cur);
  return parts;
}

function parseFieldsBody(body) {
  const fields = [];
  for (const raw of splitTopLevel(stripComments(body))) {
    const fm = raw.match(/^\s*(\w+)(\??)\s*:\s*(.+?)\s*$/);
    if (!fm || fm[1] === 'id') continue;
    fields.push({ name: fm[1], type: fm[3].trim(), optional: fm[2] === '?' });
  }
  return fields;
}

// 解析「(export) interface X { ... }」或「(export) type X = { ... }」的对象体字段
function parseObjectTypeFields(src, name) {
  const re = new RegExp(`(?:export\\s+)?(?:interface\\s+${name}\\s*|type\\s+${name}\\s*=\\s*)\\{`);
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
  const fields = parseFieldsBody(src.slice(start + 1, j));
  return fields.length > 0 ? fields : null;
}

// 内联对象字面量 { ... }（可带数组后缀）：返回对象体
function splitInlineObject(type) {
  const t = type.trim();
  if (t[0] !== '{') return null;
  let depth = 0;
  for (let i = 0; i < t.length; i++) {
    if (t[i] === '{') depth++;
    else if (t[i] === '}') {
      depth--;
      if (depth === 0) return { body: t.slice(1, i), rest: t.slice(i + 1).trim() };
    }
  }
  return null;
}

// 跨文件导出类型索引（export interface / export type X = {...}；供不同文件间引用）
const globalTypes = new Map();
function buildGlobalTypeIndex() {
  const lensRoot = path.join(ROOT, 'lenses');
  const walk = (dir) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (e.name === 'node_modules') continue;
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith('.tsx')) {
        const src = readFileSync(p, 'utf8');
        for (const m of src.matchAll(/export\s+(?:interface|type)\s+(\w+)\s*(?:=\s*)?\{/g)) {
          if (globalTypes.has(m[1])) continue;
          const fields = parseObjectTypeFields(src, m[1]);
          if (fields) globalTypes.set(m[1], fields);
        }
      }
    }
  };
  walk(lensRoot);
}

// 解析嵌套：类型为自定义类型（大写开头，可带 []）或内联对象字面量时，递归提取字段
// 解析顺序：同文件 interface/type → 跨文件导出类型 → 内联对象字面量
function resolveNested(src, type, seen = new Set()) {
  let base = type.trim();
  while (base.endsWith('[]')) base = base.slice(0, -2).trim();
  if (!base) return undefined;

  let fields = null;
  if (base[0] === '{') {
    const inline = splitInlineObject(base);
    if (inline) fields = parseFieldsBody(inline.body);
  } else if (/^[A-Z]/.test(base)) {
    if (seen.has(base)) return undefined; // 防自引用/循环
    fields = parseObjectTypeFields(src, base) ?? globalTypes.get(base) ?? null;
  }
  if (!fields || fields.length === 0) return undefined;

  const next = new Set(seen);
  next.add(base);
  return fields.map((f) => ({ ...f, fields: resolveNested(src, f.type, next) }));
}

function extractProps(src, id) {
  const fields = parseObjectTypeFields(src, `${id}Props`);
  if (!fields) return null;
  const defaults = parseComponentDefaults(src, id);
  return fields.map((f) => ({
    ...f,
    default: defaults[f.name],
    fields: resolveNested(src, f.type),
  }));
}

// 从组件签名解构提取默认值：export const X = ({ a = 'x', b = 1, c = true, ... }) => ...
function parseComponentDefaults(src, id) {
  const re = new RegExp(
    `export const ${id}(?:\\s*:\\s*React\\.FC<[^>]*>)?\\s*=\\s*\\(\\{([\\s\\S]*?)\\}\\)`,
  );
  const m = src.match(re);
  if (!m) return {};
  const out = {};
  const fieldRe =
    /(\w+)\s*=\s*('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|-?\d+(?:\.\d+)?|true|false)/g;
  let fm;
  while ((fm = fieldRe.exec(m[1]))) {
    const raw = fm[2];
    let val;
    if (raw.startsWith("'") || raw.startsWith('"')) val = raw.slice(1, -1);
    else if (raw === 'true' || raw === 'false') val = raw === 'true';
    else val = Number(raw);
    out[fm[1]] = val;
  }
  return out;
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
buildGlobalTypeIndex();
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
    durationInFrames: durMap.get(id) ?? 0,
    props,
    scenes: sc?.scenes ?? [],
    usage: sc?.usage ?? '',
  };
});

const registry = {
  meta: {
    generatedAt: new Date().toISOString(),
    count: entries.length,
    source: 'Root.preview.tsx + docs/lens-names.md + 组件 XxxProps 接口（同文件/跨文件/内联对象字段）+ docs/lens-scenes-draft.md',
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
