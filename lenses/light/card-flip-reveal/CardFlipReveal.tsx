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
import React from 'react';
import { interpolate, Easing } from 'remotion';
import { G, Card, TitleBlock } from '../../_fixtures/Fixtures';
import { useShotFrame } from '../../engine/useShotFrame';
import type { ShotTime } from '../../engine/time';

// 时间轴配置（来自 lens-timings.json）
const CARD_FLIP_TIME: ShotTime = {
  segments: [
    { from: 0, to: 18, mode: 'elastic', minFrames: 4 },   // 头部 hold
    { from: 18, to: 64, mode: 'rigid' },                  // 三卡翻转核心 46f
    { from: 64, to: 180, mode: 'elastic', minFrames: 20 }, // 尾部展示
  ],
  minFrames: 88,
};

const CW = 440;
const CH = 300;
const GAP = 60;
const X0 = (1920 - (CW * 3 + GAP * 2)) / 2; // 240
const Y = (1080 - CH) / 2; // 390
const FLIP_START = 18;
const STAGGER = 10;
const FLIP_DUR = 18;
const SETTLE = 8;
const OVERSHOOT = 12; // 末端过冲角度（原案 8°，肉眼存疑加码到 12°）

const RESULTS = ['4.9×', '−38%', '99.9%'];

// 卡 i 在帧 f 的翻转角：0 → 192（先加速后减速）→ 180（弹性落定），帧确定
const angleAt = (f: number, i: number): number => {
  const s = FLIP_START + i * STAGGER;
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

const FlipCard: React.FC<{ i: number; frame: number }> = ({ i, frame }) => {
  const angle = angleAt(frame, i);
  return (
    <div
      style={{
        position: 'absolute',
        left: X0 + i * (CW + GAP),
        top: Y,
        width: CW,
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
        {/* 正面：占位卡 */}
        <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden' }}>
          <Card w={CW} h={CH} seed={i + 1} />
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
              fontFamily: 'Helvetica, Arial, sans-serif',
              fontWeight: 800,
              fontSize: 96,
              color: G.ink,
              letterSpacing: -2,
            }}
          >
            {RESULTS[i]}
          </span>
          <Sheen angle={angle} />
        </div>
      </div>
    </div>
  );
};

export const CardFlipReveal: React.FC = () => {
  const frame = useShotFrame(CARD_FLIP_TIME);
  return (
    <div style={{ width: 1920, height: 1080, background: G.bg, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: 120, top: 96 }}>
        <TitleBlock text="CARD FLIP REVEAL" size={54} />
      </div>
      {[0, 1, 2].map((i) => (
        <FlipCard key={i} i={i} frame={frame} />
      ))}
    </div>
  );
};
