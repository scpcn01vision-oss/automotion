// === 可调参数 ===
// DURATION: 180（总帧数，可调；弹性段随 DURATION 等比缩放）
// 色彩: 走纸墨 G 色板（src/_fixtures/Fixtures.tsx）——文字 G.ink / 背景 G.bg / 强调 G.accent
// 功能: 钩子,展开
// === 时间特性 ===
// 刚性（不可压缩）: 刚性:bento first 20f,grid flip 14f+stagger 6f
// 弹性（可伸缩）: 其余段（入场/过渡/收尾/hold）可等比缩放
// === 适配注意 ===
// 调 DURATION 时只动弹性段 interpolate 关键帧，刚性核心帧区间保持固定帧数。
import React from 'react';
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';
import { G } from '../../_fixtures/Fixtures';

// bento-light-up：暗场里 3×2 bento 墙压暗待命，随节拍逐格点亮——
// 边框流光先描一圈（琥珀），格内内容随后提亮上浮弹出；六格全亮后整体微推收住。
// 节拍：0–20 建立(hold) → 每格间隔 12f 依次激活(描边 8f + 内容弹出 8f)
//       → ~96f 全亮 → 96–121 scale 1→1.04 缓推 → 121–150 静止收尾。

const BG = G.side;
const AMBER = G.accent;
const FIRST = 20; // 首格激活帧
const GAP = 12; // 格间节拍
const CELL_W = 480;
const CELL_H = 330;
const GUT = 44;
const LEFT = (1920 - (CELL_W * 3 + GUT * 2)) / 2;
const TOP = (1080 - (CELL_H * 2 + GUT)) / 2 + 30;

const Cell: React.FC<{ i: number; frame: number }> = ({ i, frame }) => {
  const start = FIRST + i * GAP;
  const col = i % 3;
  const row = Math.floor(i / 3);
  const x = LEFT + col * (CELL_W + GUT);
  const y = TOP + row * (CELL_H + GUT);

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
  const jitter = Math.abs(Math.sin(i * 127.3) * 43758.5453 % 1);
  const glow = lit * (1 - lit) * 4 * (14 + jitter * 6); // 点亮中段最亮的辉光脉冲

  return (
    <div style={{ position: 'absolute', left: x, top: y, width: CELL_W, height: CELL_H }}>
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
            width: CELL_W,
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
          <div style={{ fontFamily: 'Helvetica, Arial, sans-serif', fontSize: 22, fontWeight: 800, color: G.ink }}>
            功能 {i + 1}
          </div>
        </div>
      </div>
      {/* 边框流光：SVG rect 描边一圈 */}
      {draw > 0 && (
        <svg
          width={CELL_W}
          height={CELL_H}
          viewBox={`0 0 ${CELL_W} ${CELL_H}`}
          style={{ position: 'absolute', left: 0, top: ty, overflow: 'visible' }}
        >
          <rect
            x={2}
            y={2}
            width={CELL_W - 4}
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

export interface BentoLightUpProps {
  title?: string;
}

export const BentoLightUp: React.FC<BentoLightUpProps> = ({
  title = 'Features',
}) => {
  const frame = useCurrentFrame();

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
        <div style={{ position: 'absolute', left: LEFT, top: TOP - 110, opacity: titleLit, filter: 'invert(1)', fontFamily: 'Helvetica, Arial, sans-serif', fontWeight: 800, fontSize: 64, color: G.ink, letterSpacing: -1 }}>
          {title}
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <Cell key={i} i={i} frame={frame} />
        ))}
      </div>
    </AbsoluteFill>
  );
};
