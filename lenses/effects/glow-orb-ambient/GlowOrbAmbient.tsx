// === 可调参数 ===
// DURATION: 180（总帧数，可调；弹性段随 DURATION 等比缩放）
// 功能: 强调
// 描述: 暗场辉光球——环境光球漂浮
// 色彩: 走纸墨 G 色板（src/_fixtures/Fixtures.tsx）——文字 G.ink / 背景 G.bg / 强调 G.accent
// === 时间特性 ===
// 刚性（不可压缩）: 无（全程弹性）
// 弹性（可伸缩）: 全程可等比缩放（时长适配语音）
// === 适配注意 ===
// 调 DURATION 时只动弹性段 interpolate 关键帧，刚性核心帧区间保持固定帧数。
// glow-orb-ambient｜暗场光斑呼吸
// 近黑底上三团大光斑（radial-gradient 亮灰 + blur100）用 seed hash 驱动
// 多正弦叠加做有机漂移；中央深色描边卡的边缘辉光随最近光斑距离呼吸。
// 0–20f 光斑淡入，中段正常速度漂移，90–120f 缓动收敛到静止，末 30f 真静止。
import React from 'react';
import { G } from '../../_fixtures/Fixtures';
import { AbsoluteFill, interpolate, useCurrentFrame, Easing } from 'remotion';
import { FONT_STACK } from '../../_system/typography';

// 库内标准伪随机（帧确定）
const h = (n: number) => {
  const s = Math.sin(n * 127.3) * 43758.5453;
  return s - Math.floor(s);
};

const W = 1920;
const H = 1080;
const CX = W / 2;
const CY = H / 2;

type Orb = {
  size: number;      // 直径 500–700
  peak: number;      // 亮度峰值
  bx: number; by: number; // 基准中心
  p1: number; p2: number; // 两个正弦周期 90–140f
  ax1: number; ax2: number; ay1: number; ay2: number; // 振幅（合计 ≥240px）
  seed: number;
};

const ORBS: Orb[] = [
  { size: 680, peak: 0.32, bx: 600, by: 400, p1: 96, p2: 134, ax1: 170, ax2: 115, ay1: 160, ay2: 120, seed: 1 },
  { size: 580, peak: 0.22, bx: 1360, by: 560, p1: 110, p2: 92, ax1: 160, ax2: 120, ay1: 175, ay2: 105, seed: 2 },
  { size: 500, peak: 0.18, bx: 940, by: 860, p1: 128, p2: 98, ax1: 150, ax2: 125, ay1: 145, ay2: 118, seed: 3 },
];

const TAU = Math.PI * 2;

const orbPos = (o: Orb, t: number) => {
  const f1 = h(o.seed * 7 + 1) * TAU;
  const f2 = h(o.seed * 7 + 2) * TAU;
  const f3 = h(o.seed * 7 + 3) * TAU;
  const f4 = h(o.seed * 7 + 4) * TAU;
  const x = o.bx + o.ax1 * Math.sin((TAU * t) / o.p1 + f1) + o.ax2 * Math.sin((TAU * t) / o.p2 + f2);
  const y = o.by + o.ay1 * Math.sin((TAU * t) / o.p2 + f3) + o.ay2 * Math.sin((TAU * t) / o.p1 + f4);
  return { x, y };
};

export interface GlowOrbAmbientProps {
  cardTitle?: string; // 卡片标题
  rows?: string[]; // 卡片指标行
  avatarText?: string; // 卡片头像文字
}

export const GlowOrbAmbient: React.FC<GlowOrbAmbientProps> = ({
  cardTitle = '指标概览',
  rows = ['指标一 +18%', '指标二 24%', '指标三 9%'],
  avatarText = '我',
}) => {
  const f = useCurrentFrame();

  // 有效时间：0–90f 匀速，90–120f 用 out-sine 减速收敛（起始斜率≈0.94，近似连续），
  // f≥120 clamp 恒定 => 末 30f 所有位置/阴影完全静止。
  const t =
    f <= 90
      ? f
      : 90 +
        interpolate(f, [90, 120], [0, 18], {
          easing: Easing.out(Easing.sin),
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });

  // 淡入 0–20f（在末 30f 之前早已结束）
  const fadeIn = interpolate(f, [0, 20], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const positions = ORBS.map((o) => orbPos(o, t));

  // 卡缘呼吸：最近光斑距离 -> 辉光强度（按光斑峰值加权取最大）
  let glow = 0;
  ORBS.forEach((o, i) => {
    const d = Math.hypot(positions[i].x - CX, positions[i].y - CY);
    const p = interpolate(d, [180, 720], [1, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    glow = Math.max(glow, p * (o.peak / 0.32));
  });
  const shadowBlur = 28 * glow;
  const shadowSpread = 10 * glow;
  const shadowAlpha = 0.25 * glow;

  return (
    <AbsoluteFill style={{ background: G.ink, overflow: 'hidden' }}>
      {ORBS.map((o, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: positions[i].x - o.size / 2,
            top: positions[i].y - o.size / 2,
            width: o.size,
            height: o.size,
            borderRadius: '50%',
            background: `radial-gradient(circle, rgba(232,232,228,${o.peak}) 0%, rgba(232,232,228,${o.peak * 0.5}) 42%, rgba(232,232,228,0) 70%)`,
            filter: 'blur(100px)',
            opacity: fadeIn,
          }}
        />
      ))}
      {/* 中央深色描边卡 */}
      <div
        style={{
          position: 'absolute',
          left: CX - 280,
          top: CY - 165,
          width: 560,
          height: 330,
          boxSizing: 'border-box',
          background: G.side,
          border: `1.5px solid ${G.mid}`,
          borderRadius: 16,
          boxShadow: `0 0 ${shadowBlur}px ${shadowSpread}px rgba(255,255,255,${shadowAlpha})`,
          padding: 32,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div style={{ fontFamily: FONT_STACK, fontSize: 20, fontWeight: 700, color: G.panel }}>{cardTitle}</div>
        {rows.map((r, i) => (
          <div key={i} style={{ fontFamily: FONT_STACK, fontSize: 14, color: G.bar }}>{r}</div>
        ))}
        <div style={{ marginTop: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ width: 28, height: 28, borderRadius: 14, background: G.bar, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: G.side }}>{avatarText.charAt(0)}</div>
          <div style={{ fontFamily: FONT_STACK, fontSize: 13, color: G.mid }}>{avatarText}</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
