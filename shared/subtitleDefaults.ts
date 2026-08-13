// 字幕样式全局默认：工作台表单回显与整片渲染共用同一份，杜绝两边默认值漂移
// （2026-08-13 排查：渲染端此前用 ?? 4 / ?? 700 等独立 fallback，与工作台 DEFAULT_STYLE 不一致，
//   导致"表单显示描边宽 0、整片渲染却是 4px 描边"等类问题）
import type { SubtitleStyle } from './types';

// 已解析字幕样式：所有字段必填（合并默认值后使用，避免 ?? 可选判断的漂移）
export type ResolvedSubtitleStyle = {
  [K in keyof SubtitleStyle]-?: SubtitleStyle[K];
};

export const DEFAULT_SUBTITLE_STYLE: ResolvedSubtitleStyle = {
  fontFamily: '', // 空 = 用系统 fallback（与工作台字体下拉"系统默认"一致）
  fontSize: 48,
  color: '#2c2416',
  strokeColor: '#000000',
  strokeWidth: 0,
  backgroundColor: '#000000',
  position: 'center',
  align: 'center',
  letterSpacing: 0,
  enabled: true,
  backgroundEnabled: true,
  fontWeight: 400,
  fontStyle: 'normal',
  lineHeight: 1.35,
  opacity: 100,
  strokeEnabled: true,
  backgroundOpacity: 100,
  backgroundRadius: 0,
  backgroundPadding: 0,
  shadowColor: '#000000',
  shadowBlur: 0,
  shadowOpacity: 0,
  shadowOffsetX: 0,
  shadowOffsetY: 0,
};

// '#rrggbb'（或 3 位简写）→ rgba 字符串（阴影/背景透明度用；非法值返回原样）
export function hexToRgba(hex: string, alpha: number): string {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  if (Number.isNaN(n)) return hex;
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}
