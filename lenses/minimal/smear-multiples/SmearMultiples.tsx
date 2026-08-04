// === 可调参数 ===
// DURATION: 180（总帧数，可调；弹性段随 DURATION 等比缩放）
// 色彩: 走纸墨 G 色板（src/_fixtures/Fixtures.tsx）——文字 G.ink / 背景 G.bg / 强调 G.accent
// 功能: 展开
// === 时间特性 ===
// 刚性（不可压缩）: 刚性:过冲27f
// 弹性（可伸缩）: 其余段（入场/过渡/收尾/hold）可等比缩放
// === 适配注意 ===
// 调 DURATION 时只动弹性段 interpolate 关键帧，刚性核心帧区间保持固定帧数。
// 残像分身（smear-multiples）——smear frame 多重残像。
// 卡片高速横移时身后拖 4 个"可数"的半透明完整分身（各取当前帧减 k*2 帧
// 时刻的位置，同一条插值函数换帧号求值，天然帧确定），与运动模糊的连续糊
// 相区别。分身仅在本体速度 >25px/f 时可见（速度 = 相邻帧位置差）。
// 关键帧：0–25 左槽 hold → 25–37 横移 900px（inOut cubic，带 3% 过冲）→
// 35–38 分身延迟收缩至 0 合拢进本体 + opacity 归零 → 37–43 过冲回弹 → 43–130 全静止。
import React from 'react';
import { useCurrentFrame, interpolate, Easing } from 'remotion';
import { G, Card, TitleBlock } from '../../_fixtures/Fixtures';

const X0 = 240; // 左槽卡片左边缘
const X1 = 1140; // 右槽卡片左边缘（横移 900px）
const OVER = 27; // 3% 过冲
const Y = 380; // 卡片顶边（垂直居中 1080-320）

// 本体位置：25–37 高速横移到过冲点，37–43 回弹落座，之后恒定 → 帧确定
const posAt = (f: number): number =>
  f < 37
    ? interpolate(f, [25, 37], [X0, X1 + OVER], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
        easing: Easing.inOut(Easing.cubic),
      })
    : interpolate(f, [37, 43], [X1 + OVER, X1], {
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

export const SmearMultiples: React.FC = () => {
  const frame = useCurrentFrame();
  const bodyX = posAt(frame);
  // 本体速度 = 相邻帧位置差；>25px/f 才渲染分身
  const speed = Math.abs(posAt(frame) - posAt(frame - 1));
  const speedGate = interpolate(speed, [25, 60], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  // 落位合拢：35–38 三帧内分身延迟收缩到 0（位置滑向本体）+ 不透明度归零
  const cv = interpolate(frame, [35, 38], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad),
  });
  const convergeFade = frame >= 35 ? 1 - cv : 0;

  const ghostOps = [0.45, 0.3, 0.18, 0.09];

  return (
    <div style={{ width: 1920, height: 1080, background: G.bg, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: 120, top: 96 }}>
        <TitleBlock text="SMEAR MULTIPLES" size={54} />
      </div>
      <Slot x={X0} />
      <Slot x={X1} />
      {/* 4 个分身：第 k 个取 frame - k*2 帧时刻的位置；合拢期延迟×(1-cv) 收缩到 0 */}
      {ghostOps.map((baseOp, i) => {
        const k = i + 1;
        const gx = posAt(frame - k * 2 * (1 - cv));
        const op = baseOp * Math.max(speedGate, convergeFade);
        if (op <= 0.001) return null;
        return (
          <div key={k} style={{ position: 'absolute', left: gx, top: Y, opacity: op }}>
            <Card w={480} h={320} seed={5} />
          </div>
        );
      })}
      <div style={{ position: 'absolute', left: bodyX, top: Y }}>
        <Card w={480} h={320} seed={5} />
      </div>
    </div>
  );
};
