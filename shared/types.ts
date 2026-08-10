// ============ M2 数据模型（shared/types.ts） ============
// 四类数据模板：镜头注册 / storyboard / 转录 / 字幕
// 语义画像字段（匹配相关）留给 M3，不预设（无准入/排除/禁入概念）
// 项目数据（storyboard/转录/字幕）在项目侧，不进 v7 仓库

// ---------- 镜头注册 ----------

export interface PropField {
  name: string; // 参数名
  type: string; // 类型标注（原始文本）
  optional: boolean; // 是否可选（接口里带 ?）
  default?: unknown; // 组件签名中的默认值（generate-registry 从组件解构提取）
  fields?: PropField[]; // 嵌套对象/数组元素字段（递归提取，供列表行编辑）
}

export interface LensRegistryEntry {
  id: string; // 组件导出名（唯一）
  name: string; // 中文名（来自 docs/lens-names.md）
  file: string; // 组件相对路径（无单文件的共享导出记 wrappers.tsx）
  group: string; // 分组（light / native / ...）
  durationInFrames: number; // 镜头时长（帧，来自 Root.preview 注册）
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
  enabled?: boolean; // 字幕总开关（默认 true）
  backgroundEnabled?: boolean; // 字幕背景开关（默认 true）
  fontWeight?: number; // 字重 400/500/700
  fontStyle?: 'normal' | 'italic'; // 斜体
  lineHeight?: number; // 行距倍数
  opacity?: number; // 整体不透明度 0-100
  strokeEnabled?: boolean; // 描边开关（默认 true）
  backgroundOpacity?: number; // 背景透明度 0-100
  backgroundRadius?: number; // 背景圆角 px
  backgroundPadding?: number; // 背景内边距 px
  shadowColor?: string; // 阴影颜色
  shadowBlur?: number; // 阴影模糊 px
  shadowOpacity?: number; // 阴影透明度 0-100
  shadowOffsetX?: number; // 阴影 X 偏移 px
  shadowOffsetY?: number; // 阴影 Y 偏移 px
}

export interface StoryboardSegment {
  id: string;
  text: string;
  keywords: string[];
  phraseRange: [number, number]; // 词级转录中的起止词序号
  durationSec: number; // 段真实时长（转录确定）
  lensId: string; // 选定镜头
  params: Record<string, unknown>; // 镜头参数（项目侧）
  role?: string; // 角色牌：段在视频中的叙事作用（钩子/承接/转折/展开/宣告/举证/收束；与镜头场景标签同套）
  features?: string[]; // 内容牌：段的文本特征（数字/列举/对比/标题/提问/引用/举例/情绪/结论/因果）
}

export interface Storyboard {
  meta: {
    title: string;
    created: string;
    subtitleStyle: SubtitleStyle;
  };
  segments: StoryboardSegment[];
}

// ---------- 匹配候选（M3，机制见 docs/匹配机制-M3.md） ----------

export interface MatchCandidate {
  lensId: string; // 候选镜头 id
  reason: string; // 匹配理由（一句话：段的实质 → 镜头定位）
}

export interface MatchSegment {
  id: string; // 段 id（对应 StoryboardSegment.id）
  core: string; // AI 写出的段实质（一句话核心含义）
  top5: MatchCandidate[]; // 候选镜头（≤5，全部展示不折叠）
  chosen?: string; // 人工定稿镜头 id（工作台保存后写入）
}

export interface MatchResult {
  meta: {
    title: string;
    created: string;
    standard?: string; // 校准测试集参考答案文件（可选）
  };
  segments: MatchSegment[];
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
  const fs = x.fontStyle;
  if (fs !== undefined && !['normal', 'italic'].includes(fs as string)) return false;
  for (const k of [
    'fontSize', 'strokeWidth', 'letterSpacing', 'fontWeight', 'lineHeight',
    'opacity', 'backgroundOpacity', 'backgroundRadius', 'backgroundPadding',
    'shadowBlur', 'shadowOpacity', 'shadowOffsetX', 'shadowOffsetY',
  ] as const) {
    if (x[k] !== undefined && !isNum(x[k])) return false;
  }
  for (const k of ['opacity', 'backgroundOpacity', 'shadowOpacity'] as const) {
    const v: unknown = x[k];
    if (v !== undefined && (typeof v !== 'number' || v < 0 || v > 100)) return false;
  }
  for (const k of ['fontFamily', 'color', 'strokeColor', 'backgroundColor', 'shadowColor'] as const) {
    if (x[k] !== undefined && !isStr(x[k])) return false;
  }
  for (const k of ['enabled', 'strokeEnabled', 'backgroundEnabled'] as const) {
    if (x[k] !== undefined && typeof x[k] !== 'boolean') return false;
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

export function isMatchCandidate(x: unknown): x is MatchCandidate {
  return isObj(x) && isStr(x.lensId) && isStr(x.reason);
}

export function isMatchSegment(x: unknown): x is MatchSegment {
  if (!isObj(x)) return false;
  return (
    isStr(x.id) &&
    isStr(x.core) &&
    Array.isArray(x.top5) &&
    x.top5.every(isMatchCandidate) &&
    (x.chosen === undefined || isStr(x.chosen))
  );
}

export function isMatchResult(x: unknown): x is MatchResult {
  if (!isObj(x)) return false;
  const meta = x.meta;
  if (!isObj(meta) || !isStr(meta.title) || !isStr(meta.created)) return false;
  if (meta.standard !== undefined && !isStr(meta.standard)) return false;
  return Array.isArray(x.segments) && x.segments.every(isMatchSegment);
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
