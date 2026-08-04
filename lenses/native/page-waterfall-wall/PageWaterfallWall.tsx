// === 可调参数 ===
// DURATION: 180（总帧数，可调；弹性段随 DURATION 等比缩放）
// 色彩: 走纸墨 G 色板（src/_fixtures/Fixtures.tsx）——文字 G.ink / 背景 G.bg / 强调 G.accent
// 功能: 全景
// === 时间特性 ===
// 刚性（不可压缩）: 无（全程弹性）
// 弹性（可伸缩）: 全程可等比缩放（时长适配语音）
// === 适配注意 ===
// 调 DURATION 时只动弹性段 interpolate 关键帧，刚性核心帧区间保持固定帧数。
import React from 'react';
import {
  AbsoluteFill,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { VerticalTicker, TickerColumn } from './VerticalTicker';

const BG = '#faf7f2';

const shot = (file: string) => (
  <div
    style={{
      borderRadius: 16,
      overflow: 'hidden',
      boxShadow: '0 12px 40px rgba(0,0,0,0.45)',
      background: '#fff',
    }}
  >
    <Img src={staticFile(`textures/${file}`)} style={{ width: '100%', display: 'block' }} />
  </div>
);

// 3 列差速反向（配方卡参数：loop 12/9/14s，中列反向）
export const buildColumns = (loops: [number, number, number]): TickerColumn[] => [
  {
    items: ['card1.png', 'card2.png', 'card3.png', 'card10.png'].map(shot),
    durationInSeconds: loops[0],
    direction: -1,
  },
  {
    items: ['card4.png', 'card5.png', 'card6.png', 'projects-empty.png'].map(shot),
    durationInSeconds: loops[1],
    direction: 1,
  },
  {
    items: ['card7.png', 'card8.png', 'card9.png', 'float-search.png'].map(shot),
    durationInSeconds: loops[2],
    direction: -1,
  },
];

export const PageWaterfallWall: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  // 镜头缓推寄生在外层，墙自身循环、镜头单向
  const push = interpolate(frame, [0, durationInFrames], [1, 1.06]);

  return (
    <AbsoluteFill style={{ backgroundColor: BG }}>
      <AbsoluteFill style={{ transform: `scale(${push})` }}>
        <VerticalTicker
          columns={buildColumns([12, 9, 14])}
          backgroundColor={BG}
          columnWidth={560}
          gap={30}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// 接缝自检用：短 loop（3s=90f）、无镜头推，f0 与 f90 应逐像素一致
export const SeamTest: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: BG }}>
    <VerticalTicker
      columns={buildColumns([3, 3, 3])}
      backgroundColor={BG}
      columnWidth={560}
      gap={30}
    />
  </AbsoluteFill>
);
