// === 可调参数 ===
// DURATION: 180（总帧数，可调；弹性段随 DURATION 等比缩放）
// 色彩: 走纸墨 G 色板（src/_fixtures/Fixtures.tsx）——文字 G.ink / 背景 G.bg / 强调 G.accent
// 功能: 展开
// props: card（残像卡片内容：标题 + 数值）
// === 时间特性 ===
// 策略: 口播锚点（固定帧 + revealAtSec 单事件）
// 刚性（不可压缩）: 无（固定帧节奏；提供 revealAtSec 时横移锚定口播时刻）
// 弹性（可伸缩）: 无（残像分身依赖相邻帧速度，不随段长伸缩；锚点外尾部静止）
// === 适配注意 ===
// 不做弹刚：分身速度由帧差计算，弹性缩放会改变速度语义；口播对齐用 revealAtSec。
// 残像分身（smear-multiples）——smear frame 多重残像。
// 卡片高速横移时身后拖 4 个"可数"的半透明完整分身（各取当前帧减 k*2 帧
// 时刻的位置，同一条插值函数换帧号求值，天然帧确定），与运动模糊的连续糊
// 相区别。分身仅在本体速度 >25px/f 时可见（速度 = 相邻帧位置差）。
// 关键帧：0–25 左槽 hold → 25–37 横移 900px（inOut cubic，带 3% 过冲）→
// 35–38 分身延迟收缩至 0 合拢进本体 + opacity 归零 → 37–43 过冲回弹 → 43–130 全静止。
import React from 'react';
import { useCurrentFrame, interpolate, Easing } from 'remotion';
import { G } from '../../_fixtures/Fixtures';
import { FONT_STACK } from '../../_system/typography';

const X0 = 240; // 左槽卡片左边缘
const X1 = 1140; // 右槽卡片左边缘（横移 900px）
const OVER = 27; // 3% 过冲
const Y = 380; // 卡片顶边（垂直居中 1080-320）

// 本体位置：25–37 高速横移到过冲点，37–43 回弹落座，之后恒定 → 帧确定
const posAt = (f: number, moveStart: number): number =>
  f < moveStart + 12
    ? interpolate(f, [moveStart, moveStart + 12], [X0, X1 + OVER], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
        easing: Easing.inOut(Easing.cubic),
      })
    : interpolate(f, [moveStart + 12, moveStart + 18], [X1 + OVER, X1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
        easing: Easing.out(Easing.cubic),
      });

const Slot: React.FC<{ x: number }> = ({ x }) => (
  <div
    style={{
      position: 'absolute',
      left: x - 20,
      top: Y - 20,
      width: 520,
      height: 360,
      border: `3px dashed ${G.bar}`,
      borderRadius: 20,
      boxSizing: 'border-box',
    }}
  />
);

const SmearCard: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div
    style={{
      width: 480,
      height: 320,
      background: G.card,
      border: `2px solid ${G.border}`,
      borderRadius: 16,
      padding: 28,
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      gap: 14,
      boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
    }}
  >
    <div style={{ fontFamily: FONT_STACK, fontSize: 34, fontWeight: 800, color: G.ink, overflowWrap: 'break-word' }}>
      {label}
    </div>
    <div style={{ fontFamily: FONT_STACK, fontSize: 56, fontWeight: 800, color: G.accent }}>
      {value}
    </div>
  </div>
);

export interface SmearMultiplesProps {
  cardA?: { label: string; value: string }; // 运动前（左槽）
  cardB?: { label: string; value: string }; // 运动后（右槽）
  revealAtSec?: number; // 口播对齐：卡片开始横移（A→B）的段内秒；提供后前段左槽 hold 到该时刻
}

export const SmearMultiples: React.FC<SmearMultiplesProps> = ({
  cardA = { label: '指标一', value: '+18%' },
  cardB = { label: '节点', value: '4/4' },
  revealAtSec,
}) => {
  const frame = useCurrentFrame();
  const MOVE_START = revealAtSec !== undefined ? Math.round(revealAtSec * 30) : 25;
  const bodyX = posAt(frame, MOVE_START);
  // 本体速度 = 相邻帧位置差；>25px/f 才渲染分身
  const speed = Math.abs(posAt(frame, MOVE_START) - posAt(frame - 1, MOVE_START));
  const speedGate = interpolate(speed, [25, 60], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  // 落位合拢：35–38 三帧内分身延迟收缩到 0（位置滑向本体）+ 不透明度归零
  const cv = interpolate(frame, [MOVE_START + 10, MOVE_START + 13], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad),
  });
  const convergeFade = frame >= MOVE_START + 10 ? 1 - cv : 0;

  const ghostOps = [0.45, 0.3, 0.18, 0.09];

  return (
    <div style={{ width: 1920, height: 1080, background: G.bg, position: 'relative', overflow: 'hidden' }}>
      <Slot x={X0} />
      <Slot x={X1} />
      {/* 4 个分身：第 k 个取 frame - k*2 帧时刻的位置；合拢期延迟×(1-cv) 收缩到 0 */}
      {ghostOps.map((baseOp, i) => {
        const k = i + 1;
        const gx = posAt(frame - k * 2 * (1 - cv), MOVE_START);
        const op = baseOp * Math.max(speedGate, convergeFade);
        if (op <= 0.001) return null;
        return (
          <div key={k} style={{ position: 'absolute', left: gx, top: Y, opacity: op }}>
            <SmearCard label={cardA.label} value={cardA.value} />
          </div>
        );
      })}
      <div style={{ position: 'absolute', left: bodyX, top: Y }}>
        <SmearCard
          label={frame >= MOVE_START + 13 ? cardB.label : cardA.label}
          value={frame >= MOVE_START + 13 ? cardB.value : cardA.value}
        />
      </div>
    </div>
  );
};
