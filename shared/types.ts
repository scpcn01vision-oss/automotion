// ============ M2 数据模型（shared/types.ts） ============
// 四类数据模板：镜头注册 / storyboard / 转录 / 字幕
// 语义画像字段（匹配相关）留给 M3，不预设（无准入/排除/禁入概念）
// 项目数据（storyboard/转录/字幕）在项目侧，不进 v7 仓库

// ---------- 镜头注册 ----------

export interface PropField {
  name: string; // 参数名
  type: string; // 类型标注（原始文本）
  optional: boolean; // 是否可选（接口里带 ?）
}

export interface LensRegistryEntry {
  id: string; // 组件导出名（唯一）
  name: string; // 中文名（来自 docs/lens-names.md）
  file: string; // 组件相对路径（无单文件的共享导出记 wrappers.tsx）
  group: string; // 分组（light / native / ...）
  props: PropField[]; // 参数 schema（从 XxxProps 接口自动提取）
  scenes: string[]; // 场景标签（排序信号，不做排除；来自镜头场景总表）
  usage?: string; // 使用场景描述（匹配段的参考；总表人写定义）
}

export interface LensRegistry {
  meta: {
    generatedAt: string;
    count: number;
    source: 'Root.preview.tsx + docs/lens-names.md + 组件 XxxProps 接口';
  };
  entries: LensRegistryEntry[];
}

// ---------- storyboard（项目侧单一权威） ----------

export interface SubtitleStyle {
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  strokeColor?: string;
  strokeWidth?: number;
  backgroundColor?: string;
  position?: 'bottom' | 'top' | 'center';
  align?: 'left' | 'center' | 'right';
  letterSpacing?: number;
}

export interface StoryboardSegment {
  id: string;
  text: string;
  keywords: string[];
  phraseRange: [number, number]; // 词级转录中的起止词序号
  durationSec: number; // 段真实时长（转录确定）
  lensId: string; // 选定镜头
  params: Record<string, unknown>; // 镜头参数（项目侧）
}

export interface Storyboard {
  meta: {
    title: string;
    created: string;
    subtitleStyle: SubtitleStyle;
  };
  segments: StoryboardSegment[];
}

// ---------- 转录（第一步产物，时间基准） ----------

export interface TranscriptWord {
  text: string;
  startSec: number;
  endSec: number;
  segmentId: string; // 段归属
  indexInSegment: number; // 段内序号
}

export interface TranscriptSegmentRef {
  id: string;
  startWord: number; // 词级转录中的起止词序号（与 phraseRange 对应）
  endWord: number;
}

export interface Transcript {
  words: TranscriptWord[];
  segments: TranscriptSegmentRef[];
}

// ---------- 字幕 ----------

export interface SubtitleEntry {
  index: number;
  text: string;
  startSec: number;
  endSec: number;
  segmentId: string;
}

export interface Subtitles {
  entries: SubtitleEntry[];
  style: SubtitleStyle; // 项目级（全片统一）
}

// ---------- 运行时校验（手写 validator，不引依赖） ----------

const isObj = (x: unknown): x is Record<string, unknown> =>
  typeof x === 'object' && x !== null && !Array.isArray(x);

const isStr = (x: unknown): x is string => typeof x === 'string';
const isNum = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x);

export function isSubtitleStyle(x: unknown): x is SubtitleStyle {
  if (!isObj(x)) return false;
  const pos = x.position;
  if (pos !== undefined && !['bottom', 'top', 'center'].includes(pos as string)) return false;
  const al = x.align;
  if (al !== undefined && !['left', 'center', 'right'].includes(al as string)) return false;
  for (const k of ['fontSize', 'strokeWidth', 'letterSpacing'] as const) {
    if (x[k] !== undefined && !isNum(x[k])) return false;
  }
  for (const k of ['fontFamily', 'color', 'strokeColor', 'backgroundColor'] as const) {
    if (x[k] !== undefined && !isStr(x[k])) return false;
  }
  return true;
}

export function isStoryboardSegment(x: unknown): x is StoryboardSegment {
  if (!isObj(x)) return false;
  return (
    isStr(x.id) &&
    isStr(x.text) &&
    Array.isArray(x.keywords) &&
    x.keywords.every(isStr) &&
    Array.isArray(x.phraseRange) &&
    x.phraseRange.length === 2 &&
    x.phraseRange.every(isNum) &&
    isNum(x.durationSec) &&
    isStr(x.lensId) &&
    isObj(x.params)
  );
}

export function isStoryboard(x: unknown): x is Storyboard {
  if (!isObj(x)) return false;
  const meta = x.meta;
  if (!isObj(meta) || !isStr(meta.title) || !isStr(meta.created)) return false;
  if (!isSubtitleStyle(meta.subtitleStyle)) return false;
  return Array.isArray(x.segments) && x.segments.every(isStoryboardSegment);
}

export function isTranscript(x: unknown): x is Transcript {
  if (!isObj(x)) return false;
  return (
    Array.isArray(x.words) &&
    x.words.every(
      (w) =>
        isObj(w) &&
        isStr(w.text) &&
        isNum(w.startSec) &&
        isNum(w.endSec) &&
        isStr(w.segmentId) &&
        isNum(w.indexInSegment),
    ) &&
    Array.isArray(x.segments) &&
    x.segments.every(
      (s) => isObj(s) && isStr(s.id) && isNum(s.startWord) && isNum(s.endWord),
    )
  );
}

export function isSubtitles(x: unknown): x is Subtitles {
  if (!isObj(x)) return false;
  return (
    isSubtitleStyle(x.style) &&
    Array.isArray(x.entries) &&
    x.entries.every(
      (e) =>
        isObj(e) &&
        isNum(e.index) &&
        isStr(e.text) &&
        isNum(e.startSec) &&
        isNum(e.endSec) &&
        isStr(e.segmentId),
    )
  );
}
