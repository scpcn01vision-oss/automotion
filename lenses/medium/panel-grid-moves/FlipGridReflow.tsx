// === 可调参数 ===
// DURATION: 180（总帧数，可调；弹性段随 DURATION 等比缩放）
// 色彩: 走纸墨 G 色板（src/_fixtures/Fixtures.tsx）——文字 G.ink / 背景 G.bg / 强调 G.accent
// 功能: 展开
// === 时间特性 ===
// 策略: 弹刚 ShotTime（整段弹性）
// 刚性（不可压缩）: 无
// 弹性（可伸缩）: 全程可等比缩放（时长适配语音）
// === 适配注意 ===
// 段长不足 60f 时回退原始帧（动画按原速、可能被截断）。
// flip-grid-reflow —— 网格 FLIP 重排
// 6 张 Card 初始横排一行（marquee 式，屏心偏上）静止 30f，节拍点集体换位：
// 每卡沿直线飞向 3×2 网格目标位（预写两套坐标表），scale 1→1.28，
// delay = 卡索引×1.5f 微错峰，16f inOut(cubic) + 落定 3f 过冲 1.02。
// 全部落定后整体加深脉冲收束。收尾真静止 ≥40f。
import React from 'react';
import { interpolate, Easing } from 'remotion';
import { G } from '../../_fixtures/Fixtures';
import { FONT_STACK } from '../../_system/typography';

import { useShotFrame } from '../../../engine/useShotFrame';
import type { ShotTime } from '../../../engine/time';

// 时长画像：整段弹性（2026-08-14 精修）
const SHOT_TIME: ShotTime = {
  segments: [{ from: 0, to: 180, mode: 'elastic', minFrames: 0 }],
  minFrames: 0,
};

const CARD_W = 280;
const CARD_H = 170;
const N = 6;

// ---- 坐标表 A：横排一行（卡间 24px，屏心偏上）----
// 总宽 6*280 + 5*24 = 1800，x0 = 60；中心 y = 330
const ROW_Y = 330;
const ROW_CENTERS: Array<[number, number]> = Array.from({ length: N }, (_, i) => [
  60 + CARD_W / 2 + i * (CARD_W + 24),
  ROW_Y,
]); // x: 200, 504, 808, 1112, 1416, 1720

// ---- 坐标表 B：3×2 网格（卡放大 1.28 → 358.4×217.6，网格间距 30px）----
// 网格总宽 3*358.4 + 2*30 = 1135.2 → x0 = 392.4；总高 2*217.6 + 30 = 465.2 → y0 = 307.4
const GC = [571.6, 960, 1348.4]; // 列中心
const GR = [416.2, 663.8]; // 行中心
// 交错映射：偶数索引去上排、奇数去下排（每卡直线飞行、互不对穿）
const GRID_CENTERS: Array<[number, number]> = [
  [GC[0], GR[0]], // card0 → 上左
  [GC[0], GR[1]], // card1 → 下左
  [GC[1], GR[0]], // card2 → 上中
  [GC[1], GR[1]], // card3 → 下中
  [GC[2], GR[0]], // card4 → 上右
  [GC[2], GR[1]], // card5 → 下右
];

const BEAT = 30; // 节拍点
const STAGGER = 1.5; // 每卡延迟
const MOVE = 16; // 飞行帧数
const SETTLE = 3; // 落定过冲帧数
const SCALE_END = 1.28;
const OVERSHOOT = 1.02;
// 末卡完全落定：30 + 5*1.5 + 16 + 3 = 56.5

// 加深脉冲：f58 → f61 谷值 → f64 回正（谷值 brightness 0.78，spec 4f 放宽到 6f 保可感）
const PULSE_IN = 58;
const PULSE_MID = 61;
const PULSE_OUT = 64;

const moveEase = Easing.inOut(Easing.cubic);

const FlipCard: React.FC<{ i: number; frame: number }> = ({ i, frame }) => {
  const t0 = BEAT + i * STAGGER;
  const [x0, y0] = ROW_CENTERS[i];
  const [x1, y1] = GRID_CENTERS[i];

  const x = interpolate(frame, [t0, t0 + MOVE], [x0, x1], {
    easing: moveEase, extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const y = interpolate(frame, [t0, t0 + MOVE], [y0, y1], {
    easing: moveEase, extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  // scale：16f 冲到 1.28*1.02，随后 3f 回落到 1.28
  const sUp = interpolate(frame, [t0, t0 + MOVE], [1, SCALE_END * OVERSHOOT], {
    easing: moveEase, extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const sBack = interpolate(frame, [t0 + MOVE, t0 + MOVE + SETTLE], [SCALE_END * OVERSHOOT, SCALE_END], {
    easing: Easing.out(Easing.cubic), extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const s = frame < t0 + MOVE ? sUp : sBack;

  return (
    <div
      style={{
        position: 'absolute',
        left: x - CARD_W / 2,
        top: y - CARD_H / 2,
        width: CARD_W,
        height: CARD_H,
        transform: `scale(${s})`,
        transformOrigin: '50% 50%',
        zIndex: i,
      }}
    >
      <div
        style={{
          width: CARD_W,
          height: CARD_H,
          background: G.card,
          border: `2px solid ${G.border}`,
          borderRadius: 12,
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        <div style={{ fontFamily: FONT_STACK, fontSize: 20, fontWeight: 800, color: G.ink }}>
          指标 {i + 1}
        </div>
        <div style={{ fontFamily: FONT_STACK, fontSize: 28, fontWeight: 800, color: G.accent }}>
          +{(i + 1) * 7}%
        </div>
      </div>
    </div>
  );
};

export interface FlipGridReflowProps {
}

export const FlipGridReflow: React.FC<FlipGridReflowProps> = () => {
  const frame = useShotFrame(SHOT_TIME);

  // 加深脉冲：仅脉冲窗口内挂载 filter，窗口外完全不挂（摘罩）
  const pulsing = frame >= PULSE_IN && frame <= PULSE_OUT;
  const bright = pulsing
    ? interpolate(frame, [PULSE_IN, PULSE_MID, PULSE_OUT], [1, 0.78, 1], {
        extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
      })
    : 1;

  return (
    <div
      style={{
        width: 1920,
        height: 1080,
        background: G.bg,
        position: 'relative',
        overflow: 'hidden',
        ...(pulsing ? { filter: `brightness(${bright})` } : {}),
      }}
    >
      {Array.from({ length: N }).map((_, i) => (
        <FlipCard key={i} i={i} frame={frame} />
      ))}
    </div>
  );
};
