// === 可调参数 ===
// DURATION: 180（总帧数，可调；弹性段随 DURATION 等比缩放）
// 色彩: 走纸墨 G 色板（src/_fixtures/Fixtures.tsx）——文字 G.ink / 背景 G.bg / 强调 G.accent
// 功能: 展开,对比
// === 时间特性 ===
// 刚性（不可压缩）: 刚性:每卡翻转18f
// 弹性（可伸缩）: 其余段（入场/过渡/收尾/hold）可等比缩放
// === 适配注意 ===
// 调 DURATION 时只动弹性段 interpolate 关键帧，刚性核心帧区间保持固定帧数。
// 功能卡 3D 翻面揭示（card-flip-reveal）——Apple bento 翻转段。
// 横排 3 张占位卡逐张错峰沿 Y 轴翻 180°（perspective 1200px，双面结构
// backface-visibility hidden），背面白卡中央大号结论数字。翻转先加速后
// 弹性落定（末端过冲 +12° 回 180°）；翻到侧棱（90°）附近闪过一道随角度
// 移动的加深灰高光带（白底用加深而非提亮）。
// 关键帧（卡 i 起点 = 18 + i*10，i = 0/1/2）：
//   0–18 hold → 卡0: 18–36 翻至 192° → 36–44 回弹落 180° →
//   卡1: 28–46–54，卡2: 38–56–64 → 64–145 三卡全静止（81f ≥ 40f）。
import React, { useMemo } from 'react';
import { interpolate, Easing, useCurrentFrame } from 'remotion';
import { G } from '../../_fixtures/Fixtures';
import { useShotFrame } from '../../../engine/useShotFrame';
import type { ShotTime } from '../../../engine/time';
import { FONT_STACK } from '../../_system/typography';

const CH = 300;
const GAP = 60;
const Y = (1080 - CH) / 2; // 390
const FLIP_START = 18;
const STAGGER = 10;
const FLIP_DUR = 18;
const SETTLE = 8;
const OVERSHOOT = 12; // 末端过冲角度（原案 8°，肉眼存疑加码到 12°）

// 卡 i 在帧 f 的翻转角：0 → 192（先加速后减速）→ 180（弹性落定），帧确定
const angleAt = (f: number, s: number): number => {
  if (f < s + FLIP_DUR) {
    return interpolate(f, [s, s + FLIP_DUR], [0, 180 + OVERSHOOT], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.bezier(0.55, 0, 0.3, 1),
    });
  }
  return interpolate(f, [s + FLIP_DUR, s + FLIP_DUR + SETTLE], [180 + OVERSHOOT, 180], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.poly(5)),
  });
};

// 随角度移动的加深高光带：位置从卡左外扫到右外，强度在 90°（侧棱）达峰
const Sheen: React.FC<{ angle: number }> = ({ angle }) => {
  const pos = interpolate(angle, [35, 145], [-25, 115], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const op = Math.max(0, 1 - Math.abs(angle - 90) / 55);
  if (op <= 0.004) return null;
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        borderRadius: 14,
        pointerEvents: 'none',
        opacity: op,
        background: `linear-gradient(105deg, rgba(0,0,0,0) ${pos - 14}%, rgba(0,0,0,0.32) ${pos}%, rgba(0,0,0,0) ${pos + 14}%)`,
      }}
    />
  );
};

// 正面 label 字号自适应：按可用宽度 + 字符数估算，保证不溢出卡片
const labelFont = (len: number, availW: number): number => {
  const byWidth = Math.floor(availW / Math.max(1, len * 0.58));
  return Math.min(52, Math.max(18, byWidth));
};

export interface CardFlipRevealCard {
  label?: string;
  result?: string;
}

export interface CardFlipRevealProps {
  cards?: CardFlipRevealCard[];
  cueSec?: number[]; // 口播对齐：每张卡翻转开始的段内秒（与 cards 一一对应）；提供后忽略固定错峰
}

const FlipCard: React.FC<{ i: number; frame: number; start: number; card: CardFlipRevealCard; w: number }> = ({ i, frame, start, card, w }) => {
  const angle = angleAt(frame, start);
  const len = (card.label ?? '').length;
  const availW = w - 48;
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: Y,
        width: w,
        height: CH,
        perspective: 1200,
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          transformStyle: 'preserve-3d',
          transform: `rotateY(${angle}deg)`,
        }}
      >
        {/* 正面：label 自适应排版（短词大字居中 / 长句小字换行） */}
        <div
          style={{
            position: 'absolute', inset: 0, backfaceVisibility: 'hidden',
            background: G.card, border: `2px solid ${G.border}`, borderRadius: 14,
            boxSizing: 'border-box', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
          }}
        >
          <span
            style={{
              fontFamily: FONT_STACK,
              fontWeight: 700, fontSize: labelFont(len, availW), color: G.ink,
              textAlign: 'center', lineHeight: 1.2, letterSpacing: -0.5,
              maxWidth: '100%', overflowWrap: 'break-word', wordBreak: 'break-word',
            }}
          >
            {card.label}
          </span>
          <Sheen angle={angle} />
        </div>
        {/* 背面：白卡 + 大号结论数字（预先转 180°，翻满后正读） */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            background: G.card,
            border: `2px solid ${G.border}`,
            borderRadius: 14,
            boxSizing: 'border-box',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            style={{
              fontFamily: FONT_STACK,
              fontWeight: 800,
              fontSize: labelFont((card.result ?? '').length, availW), // 与正面同自适应规则，翻面后字号统一
              color: G.ink,
              letterSpacing: -0.5,
              textAlign: 'center',
              lineHeight: 1.2,
              maxWidth: '100%',
              overflowWrap: 'break-word',
              wordBreak: 'break-word',
            }}
          >
            {card.result}
          </span>
          <Sheen angle={angle} />
        </div>
      </div>
    </div>
  );
};

export const CardFlipReveal: React.FC<CardFlipRevealProps> = ({
  cards = [
    { label: '指标一', result: '+18%' },
    { label: '指标二', result: '2.4×' },
    { label: '指标三', result: '99%' },
  ],
  cueSec,
}) => {
  const n = cards.length;
  // 卡宽随数量自适应：总宽不超过 1920 - 左右边距 160
  const cardW = Math.min(440, (1920 - 160 - (n - 1) * GAP) / n);
  // 时序按卡数动态：刚性段 = 首卡起点到末卡落定
  const shotTime = useMemo<ShotTime>(() => {
    const flipEnd = FLIP_START + (n - 1) * STAGGER + FLIP_DUR + SETTLE;
    return {
      segments: [
        { from: 0, to: FLIP_START, mode: 'elastic', minFrames: 4 },
        { from: FLIP_START, to: flipEnd, mode: 'rigid' },
        { from: flipEnd, to: 180, mode: 'elastic', minFrames: 20 },
      ],
      minFrames: 88,
    };
  }, [n]);
  const frameShot = useShotFrame(shotTime);
  const realFrame = useCurrentFrame();
  const cueMode = !!cueSec && cueSec.length === n;
  const frame = cueMode ? realFrame : frameShot;
  const X0 = (1920 - (n * cardW + (n - 1) * GAP)) / 2;
  return (
    <div style={{ width: 1920, height: 1080, background: G.bg, position: 'relative', overflow: 'hidden' }}>
      {cards.map((card, i) => (
        <div key={i} style={{ position: 'absolute', left: X0 + i * (cardW + GAP), top: 0, width: cardW, height: CH }}>
          <FlipCard i={i} frame={frame} start={cueMode ? Math.round(cueSec[i] * 30) : FLIP_START + i * STAGGER} card={card} w={cardW} />
        </div>
      ))}
    </div>
  );
};
