// M1 污染扫描：演示组件真实使用 / 品牌默认值 / 项目内容词
// 用法：node scripts/scan-pollution.mjs [--out <json 报告路径>]
// 默认报告：out/pollution-report.json（out/ 已被 gitignore）
// 退出码：0 = 0 命中（验收通过）；1 = 有命中（验收失败）
//
// 扫描原则：
// - 只扫「代码区」，剥离 // 行注释与 /* */ 块注释（来源注释保留策略，不误报）
// - 字符串内容保留（品牌默认值写在字符串里，必须能扫到）
// - 词表集中在下方数组，M2/M3 演进时直接改这里
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const LENSES = path.join(ROOT, 'lenses');
const DEFAULT_OUT = path.join(ROOT, 'out', 'pollution-report.json');

// ---------- 词表（可配置） ----------
// ① 演示组件真实使用（JSX 元素；<Card 后跟字母的合法镜头名/NeutralCard 自动排除）
const DEMO_COMPONENTS = [
  { kind: 'TitleBlock', re: /<TitleBlock\b/ },
  { kind: 'FakeDashboard', re: /<FakeDashboard\b/ },
  { kind: 'Card', re: /<Card(?![A-Za-z])/ },
];

// ② 品牌默认值/品牌词（大小写敏感，\b 单词边界）
const BRAND_TERMS = [
  'Notion',
  'perplexity',
  'ClickUp',
  'Slack',
  'GDrive',
  'Drive',
  'Figma',
  'GitHub',
  'Salesforce',
  'Dropbox',
];

// ③ 项目内容词（销售/业务数据形态的演示文案）
const PROJECT_TERMS = ['Enterprise', 'MQL', 'Q3 Quota', 'Q3'];

// ---------- 工具 ----------
const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function walk(dir, acc = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules') continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (/\.(tsx|ts)$/.test(e.name)) acc.push(p);
  }
  return acc;
}

// 剥离 // 行注释与 /* */ 块注释；字符串内容保留（状态机区分字符串与注释）
function stripComments(code) {
  const lines = code.split('\n');
  const out = [];
  let inBlock = false;
  for (const line of lines) {
    let res = '';
    let j = 0;
    let inStr = null;
    while (j < line.length) {
      const ch = line[j];
      const next = line[j + 1];
      if (inBlock) {
        if (ch === '*' && next === '/') {
          inBlock = false;
          j += 2;
          continue;
        }
        j++;
        continue;
      }
      if (inStr) {
        if (ch === '\\') {
          j += 2;
          continue;
        }
        if (ch === inStr) inStr = null;
        j++;
        continue;
      }
      if (ch === "'" || ch === '"' || ch === '`') {
        inStr = ch;
        j++;
        continue;
      }
      if (ch === '/' && next === '/') break;
      if (ch === '/' && next === '*') {
        inBlock = true;
        j += 2;
        continue;
      }
      res += ch;
      j++;
    }
    out.push(res);
  }
  return out;
}

// ---------- 主流程 ----------
const outArgIdx = process.argv.indexOf('--out');
const outPath = outArgIdx > -1 ? process.argv[outArgIdx + 1] : DEFAULT_OUT;

const files = walk(LENSES);
const hits = [];

for (const abs of files) {
  const rel = path.relative(ROOT, abs).replace(/\\/g, '/');
  const codeLines = stripComments(readFileSync(abs, 'utf8'));
  codeLines.forEach((line, i) => {
    const lineNo = i + 1;
    for (const { kind, re } of DEMO_COMPONENTS) {
      if (re.test(line)) hits.push({ file: rel, line: lineNo, kind: 'demo', term: kind });
    }
    for (const term of BRAND_TERMS) {
      if (new RegExp(`\\b${escapeRegExp(term)}\\b`).test(line)) {
        hits.push({ file: rel, line: lineNo, kind: 'brand', term });
      }
    }
    for (const term of PROJECT_TERMS) {
      if (new RegExp(`\\b${escapeRegExp(term)}\\b`).test(line)) {
        hits.push({ file: rel, line: lineNo, kind: 'project', term });
      }
    }
  });
}

const report = {
  scannedAt: new Date().toISOString(),
  scannedFiles: files.length,
  hitCount: hits.length,
  hits: hits.map((h) => ({ file: h.file, line: h.line, kind: h.kind, term: h.term })),
  pass: hits.length === 0,
};

writeFileSync(outPath, JSON.stringify(report, null, 2));

if (report.pass) {
  console.log(`污染扫描通过：${files.length} 个文件，0 命中。报告：${outPath}`);
} else {
  console.log(`污染扫描失败：${hits.length} 处命中（${files.length} 个文件）。报告：${outPath}`);
  for (const h of report.hits) {
    console.log(`  ${h.file}:${h.line} [${h.kind}] ${h.term}`);
  }
}
process.exit(report.pass ? 0 : 1);
