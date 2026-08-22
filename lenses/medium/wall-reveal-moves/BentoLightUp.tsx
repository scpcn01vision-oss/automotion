// === 可调参数 ===
// DURATION: 180（总帧数，可调；弹性段随 DURATION 等比缩放）
// 色彩: 走纸墨 G 色板（src/_fixtures/Fixtures.tsx）——文字 G.ink / 背景 G.bg / 强调 G.accent
// 功能: 钩子,展开
// props: title（顶部标题）、cards（卡片数组，含 title/sub，缺省 DEFAULT_CARDS；每排最多 3 张、整排居中、数量自适应）
// === 时间特性 ===
// 策略: 弹刚 ShotTime（整段弹性）
// 刚性（不可压缩）: 无
// 弹性（可伸缩）: 全程可等比缩放（时长适配语音）
// === 适配注意 ===
// 段长不足 60f 时回退原始帧（动画按原速、可能被截断）。
import React from 'react';
import { AbsoluteFill, Easing, interpolate } from 'remotion';
import { G } from '../../_fixtures/Fixtures';
import { FONT_STACK } from '../../_system/typography';

import { useShotFrame } from '../../../engine/useShotFrame';
import type { ShotTime } from '../../../engine/time';

// 时长画像：整段弹性（2026-08-14 精修）
const SHOT_TIME: ShotTime = {
  segments: [{ from: 0, to: 180, mode: 'elastic', minFrames: 60 }],
  minFrames: 60,
};

// bento-light-up：暗场里 3×2 bento 墙压暗待命，随节拍逐格点亮——
// 边框流光先描一圈（琥珀），格内内容随后提亮上浮弹出；六格全亮后整体微推收住。
// 节拍：0–20 建立(hold) → 每格间隔 12f 依次激活(描边 8f + 内容弹出 8f)
//       → ~96f 全亮 → 96–121 scale 1→1.04 缓推 → 121–150 静止收尾。

const BG = G.side;
const AMBER = G.accent;
const FIRST = 20; // 首格激活帧
const CELL_H = 330;
const GUT = 44;
const MAX_CARD_W = 480;
const SIDE_MARGIN = 48;

export interface BentoCard {
  title?: string; // 卡片主标题
  sub?: string;   // 卡片副文案（可省略，仅一行时不占位）
}

export interface BentoLightUpProps {
  title?: string;
  cards?: BentoCard[];
}

// 缺省卡片示例（不传 cards 时的默认画面）
const DEFAULT_CARDS: BentoCard[] = [
  { title: '要点一', sub: '说明一' },
  { title: '要点二', sub: '说明二' },
  { title: '要点三', sub: '说明三' },
];

const Cell: React.FC<{ frame: number; idx: number; title?: string; sub?: string; left: number; top: number; cardW: number; start: number }> = ({ frame, idx, title, sub, left, top, cardW, start }) => {
  // ① 边框流光：pathLength=100 的 dashoffset 描边，8f 走完一圈
  const draw = interpolate(frame, [start, start + 8], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  // 描完后流光退火：琥珀亮边 → 弱化成常亮细边
  const strokeFade = interpolate(frame, [start + 12, start + 26], [1, 0.4], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad),
  });

  // ② 内容提亮 + 上浮弹出：描边过半后接力，8f 弹出（back-out 带一点过冲）
  const lit = interpolate(frame, [start + 6, start + 14], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const rise = interpolate(frame, [start + 6, start + 14], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.3, 1.4, 0.5, 1),
  });
  const opacity = 0.18 + 0.82 * lit;
  const ty = 20 * (1 - rise);
  // seed 正弦哈希做每格微差（点亮瞬间的辉光强度略有随机感）
  const jitter = Math.abs(Math.sin(idx * 127.3) * 43758.5453 % 1);
  const glow = lit * (1 - lit) * 4 * (14 + jitter * 6); // 点亮中段最亮的辉光脉冲

  return (
    <div style={{ position: 'absolute', left, top, width: cardW, height: CELL_H }}>
      {/* 暗态卡 + 点亮后的内容（同一张卡，靠 opacity/translateY 提亮浮出） */}
      <div
        style={{
          opacity,
          transform: `translateY(${ty}px)`,
          boxShadow: lit > 0.5 ? `0 0 ${glow}px rgba(232,180,94,${0.35 * lit * (1 - lit) * 4})` : 'none',
          borderRadius: 14,
        }}
      >
        <div
          style={{
            width: cardW,
            height: CELL_H,
            background: G.card,
            border: `2px solid ${G.border}`,
            borderRadius: 16,
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          {/* 卡片内容：字段各自独立可选——只填一个则单行垂直居中，不为缺省字段留占位 */}
          {title && (
            <div style={{ fontFamily: FONT_STACK, fontSize: 22, fontWeight: 800, color: G.ink, textAlign: 'center' }}>
              {title}
            </div>
          )}
          {sub && (
            <div style={{ fontFamily: FONT_STACK, fontSize: 16, fontWeight: 600, color: G.mid, textAlign: 'center' }}>
              {sub}
            </div>
          )}
        </div>
      </div>
      {/* 边框流光：SVG rect 描边一圈 */}
      {draw > 0 && (
        <svg
          width={cardW}
          height={CELL_H}
          viewBox={`0 0 ${cardW} ${CELL_H}`}
          style={{ position: 'absolute', left: 0, top: ty, overflow: 'visible' }}
        >
          <rect
            x={2}
            y={2}
            width={cardW - 4}
            height={CELL_H - 4}
            rx={14}
            fill="none"
            stroke={AMBER}
            strokeWidth={4}
            pathLength={100}
            strokeDasharray={100}
            strokeDashoffset={100 * (1 - draw)}
            opacity={strokeFade}
            style={{ filter: `drop-shadow(0 0 ${6 + jitter * 4}px ${AMBER})` }}
          />
        </svg>
      )}
    </div>
  );
};

export const BentoLightUp: React.FC<BentoLightUpProps> = ({
  title = 'Features',
  cards = DEFAULT_CARDS,
}) => {
  const frame = useShotFrame(SHOT_TIME);
  const n = cards.length;
  const colCount = Math.min(3, Math.max(1, n));
  const rowCount = Math.ceil(n / colCount);
  const cardW = Math.min(MAX_CARD_W, (1920 - SIDE_MARGIN * 2 - (colCount - 1) * GUT) / colCount);
  const gridW = colCount * cardW + (colCount - 1) * GUT;
  const gridH = rowCount * CELL_H + (rowCount - 1) * GUT;
  const topBase = (1080 - gridH) / 2 + 30;
  // 格间节拍随数量自适应，避免末格点亮超出时长
  const gap = Math.round(Math.max(4, Math.min(12, (180 - FIRST - 46) / Math.max(1, n - 1))));

  // 按行分组：每行最多 colCount 张，整行内居中（行的 x 随该行实际数量再居中）
  const placed: { idx: number; title?: string; sub?: string; left: number; top: number; start: number }[] = [];
  let gi = 0;
  for (let row = 0; row < rowCount; row++) {
    const chunk = cards.slice(row * colCount, (row + 1) * colCount);
    const m = chunk.length;
    const rowLeft = (1920 - (m * cardW + (m - 1) * GUT)) / 2;
    const y = topBase + row * (CELL_H + GUT);
    chunk.forEach((c, ci) => {
      placed.push({
        idx: gi,
        title: c.title,
        sub: c.sub,
        left: rowLeft + ci * (cardW + GUT),
        top: y,
        start: FIRST + gi * gap,
      });
      gi++;
    });
  }

  // ③ 六格全亮(~96f)后整体缓推 scale 1→1.04，25f 收住，之后真静止
  const push = interpolate(frame, [96, 121], [1, 1.04], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.33, 0, 0.2, 1),
  });

  // 标题随首格点亮微微提亮，交代场景
  const titleLit = interpolate(frame, [FIRST, FIRST + 20], [0.25, 0.75], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad),
  });

  return (
    <AbsoluteFill style={{ background: BG, overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: `scale(${push})`,
          transformOrigin: '960px 540px',
        }}
      >
        <div style={{ position: 'absolute', left: 0, width: '100%', top: topBase - 110, opacity: titleLit, filter: 'invert(1)', fontFamily: FONT_STACK, fontWeight: 800, fontSize: 64, color: G.ink, letterSpacing: -1, textAlign: 'center' }}>
          {title}
        </div>
        {placed.map((p) => (
          <Cell key={p.idx} frame={frame} idx={p.idx} title={p.title} sub={p.sub} left={p.left} top={p.top} cardW={cardW} start={p.start} />
        ))}
      </div>
    </AbsoluteFill>
  );
};
