// === 可调参数 ===
// DURATION: 10（总帧数，可调；弹性段随 DURATION 等比缩放）
// 功能: 转折
// 描述: 白闪盖硬切——暖白柔光一闪盖住切点
// 色彩: 走纸墨 G 色板（src/_fixtures/Fixtures.tsx）——文字 G.ink / 背景 G.bg / 强调 G.accent
// === 时间特性 ===
// 刚性（不可压缩）: 无（全程弹性）
// 弹性（可伸缩）: 全程可等比缩放（时长适配语音）
// === 适配注意 ===
// 调 DURATION 时只动弹性段 interpolate 关键帧，刚性核心帧区间保持固定帧数。
// origin: template/src/aifl/FlashCut.tsx（模板片同源组件）
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';

/** Bright-field cut: a warm-white bloom that flashes over the hard cut. */
export const FlashCut: React.FC<{ duration?: number }> = ({ duration = 10 }) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [0, duration * 0.4, duration], [0, 0.85, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <AbsoluteFill
      style={{
        pointerEvents: 'none',
        opacity: o,
        background: 'radial-gradient(ellipse at 50% 45%, rgba(255,248,235,0.98), rgba(255,244,224,0.55) 55%, transparent 80%)',
      }}
    />
  );
};
