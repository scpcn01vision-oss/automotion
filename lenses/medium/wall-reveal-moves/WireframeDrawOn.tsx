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
import { SceneContent, SceneContentData } from '../../_system/scene-content';

// wireframe-draw-on〔入场退场〕：界面先以蓝图细线描画成形（stroke-dashoffset
// 分组错峰），随后一条发光竖线从左向右扫过，扫过之处线框实体化为真实灰阶界面。
// 节拍：0–20 hold 空底 → 20–82 分组描线 → 88–118 光线扫描实体化 → 118–150 hold。

// FakeDashboard variant A 的几何（1920×1080）：
// 侧栏 220 宽；顶栏 x220–1920 h72；内容区 padding36 gap28，3×2 卡片
// 卡 w524 h454，x = 256/808/1360，y = 108/590。
const CARD_W = 524;
const CARD_H = 454;
const CARD_X = [256, 808, 1360];
const CARD_Y = [108, 590];

const seedFrac = (i: number) => {
  const v = Math.sin(i * 127.3) * 43758.5453;
  return v - Math.floor(v);
};

export interface WireframeDrawOnProps {
  scene?: SceneContentData;
}

export const WireframeDrawOn: React.FC<WireframeDrawOnProps> = ({
  scene = {
    title: '概览',
    type: 'rows',
    rows: [
      { label: '指标一', value: '+18%' },
      { label: '指标二', value: '2.1×' },
      { label: '指标三', value: '96.4%' },
    ],
  },
}) => {
  const frame = useCurrentFrame();

  // 描线进度：每组 30f 画完，start 错峰
  const draw = (start: number) =>
    interpolate(frame, [start, start + 30], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.bezier(0.4, 0, 0.3, 1),
    });

  const tSide = draw(20); // 侧栏
  const tTop = draw(30); // 顶栏
  const tCards = Array.from({ length: 6 }, (_, i) => draw(40 + i * 3)); // 卡片错峰
  const tChart = draw(52); // 折线图

  // 实体化扫描：88–118 从左向右
  const scan = interpolate(frame, [88, 118], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.55, 0, 0.25, 1),
  });
  const scanX = scan * 1920;
  const lineOpacity = interpolate(frame, [86, 92, 112, 120], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // 描线小工具：pathLength=1 + dashoffset 从 1 → 0
  const stroke = (t: number): React.SVGAttributes<SVGElement> => ({
    fill: 'none',
    stroke: G.mid,
    strokeWidth: 2.5,
    pathLength: 1,
    strokeDasharray: 1,
    strokeDashoffset: 1 - t,
    strokeLinecap: 'round',
    opacity: t > 0 ? 1 : 0,
  });

  // 折线图数据（seed 正弦哈希，落在卡 (1,1) 内部）
  const chartCardX = CARD_X[1];
  const chartCardY = CARD_Y[1];
  const chartPts = Array.from({ length: 8 }, (_, i) => {
    const px = chartCardX + 50 + (i * (CARD_W - 100)) / 7;
    const py = chartCardY + 130 + seedFrac(i + 3) * 230;
    return `${px},${py}`;
  }).join(' ');

  return (
    <AbsoluteFill style={{ background: G.bg, overflow: 'hidden' }}>
      {/* —— 线框层（蓝图描线） —— */}
      <svg
        width={1920}
        height={1080}
        viewBox="0 0 1920 1080"
        style={{ position: 'absolute', inset: 0 }}
      >
        {/* 侧栏 */}
        <rect x={4} y={4} width={216} height={1072} rx={2} {...stroke(tSide)} />
        <rect x={26} y={30} width={40} height={40} rx={10} {...stroke(draw(24))} />
        {Array.from({ length: 7 }).map((_, i) => {
          const w = (216 - 44) * (0.6 + ((i * 29) % 35) / 100);
          return (
            <line
              key={`s${i}`}
              x1={26}
              y1={94 + i * 30}
              x2={26 + w}
              y2={94 + i * 30}
              {...stroke(draw(26 + i * 2))}
            />
          );
        })}

        {/* 顶栏 */}
        <line x1={220} y1={72} x2={1916} y2={72} {...stroke(tTop)} />
        <rect x={252} y={27} width={180} height={18} rx={9} {...stroke(draw(34))} />
        <rect x={1476} y={18} width={320} height={36} rx={18} {...stroke(draw(36))} />
        <circle cx={1834} cy={36} r={18} {...stroke(draw(38))} />

        {/* 3×2 卡片：轮廓 + 内部占位线 */}
        {tCards.map((t, i) => {
          const cx = CARD_X[i % 3];
          const cy = CARD_Y[Math.floor(i / 3)];
          const titleW = (CARD_W - 36) * (0.45 + (((i + 1) * 37) % 40) / 100);
          return (
            <g key={`c${i}`}>
              <rect x={cx} y={cy} width={CARD_W} height={CARD_H} rx={14} {...stroke(t)} />
              <rect x={cx + 18} y={cy + 18} width={titleW} height={16} rx={8} {...stroke(draw(46 + i * 3))} />
              <line x1={cx + 18} y1={cy + 62} x2={cx + 18 + (CARD_W - 36) * 0.82} y2={cy + 62} {...stroke(draw(49 + i * 3))} />
              <line x1={cx + 18} y1={cy + 88} x2={cx + 18 + (CARD_W - 36) * 0.62} y2={cy + 88} {...stroke(draw(51 + i * 3))} />
              <circle cx={cx + 31} cy={cy + CARD_H - 31} r={13} {...stroke(draw(53 + i * 3))} />
            </g>
          );
        })}

        {/* 折线图（画在中列下排卡内） */}
        <polyline points={chartPts} {...stroke(tChart)} strokeWidth={3} />
      </svg>

      {/* —— 实体层：clip-path inset 从左向右展开 —— */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          clipPath: `inset(0 ${(1 - scan) * 100}% 0 0)`,
        }}
      >
        <SceneContent content={scene} />
      </div>

      {/* —— 4px 发光扫描竖线（琥珀微光） —— */}
      <div
        style={{
          position: 'absolute',
          left: scanX - 2,
          top: 0,
          width: 4,
          height: 1080,
          background: '#ffc46b',
          opacity: lineOpacity,
          boxShadow:
            '0 0 18px 6px rgba(232, 163, 61, 0.65), 0 0 60px 18px rgba(232, 163, 61, 0.28)',
        }}
      />
    </AbsoluteFill>
  );
};
