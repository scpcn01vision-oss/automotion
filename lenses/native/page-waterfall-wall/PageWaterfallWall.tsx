// === 可调参数 ===
// DURATION: 180（总帧数，可调；弹性段随 DURATION 等比缩放）
// 色彩: 走纸墨 G 色板（src/_fixtures/Fixtures.tsx）——文字 G.ink / 背景 G.bg / 强调 G.accent
// 功能: 全景
// props: columns（3 列瀑布素材/循环时长/方向）、columnWidth、gap、pushTo（缓推终点）
// === 时间特性 ===
// 刚性（不可压缩）: 无（全程弹性）
// 弹性（可伸缩）: 全程可等比缩放（时长适配语音）
// === 适配注意 ===
// 调 DURATION 时只动弹性段 interpolate 关键帧，刚性核心帧区间保持固定帧数。
import React from 'react';
import { AbsoluteFill, Img, interpolate, staticFile, useVideoConfig } from 'remotion';
import { VerticalTicker, TickerColumn } from './VerticalTicker';
import { G } from '../../_fixtures/Fixtures';

import { useShotFrame } from '../../../engine/useShotFrame';
import type { ShotTime } from '../../../engine/time';

// 时长画像（保守兜底：整段弹性；精修阶段按镜头关键帧画像刚弹分段）
const SHOT_TIME: ShotTime = {
  segments: [{ from: 0, to: 180, mode: 'elastic', minFrames: 0 }],
  minFrames: 0,
};

const BG = G.bg;

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

export interface WaterfallColumn {
  images: string[];
  loopSeconds: number;
  direction: 1 | -1;
}

export interface PageWaterfallWallProps {
  columns?: WaterfallColumn[];
  columnWidth?: number;
  gap?: number;
  pushTo?: number;
}

export const PageWaterfallWall: React.FC<PageWaterfallWallProps> = ({
  columns = [
    { images: ['card1.png', 'card2.png', 'card3.png', 'card10.png'], loopSeconds: 12, direction: -1 },
    { images: ['card4.png', 'card5.png', 'card6.png', 'projects-empty.png'], loopSeconds: 9, direction: 1 },
    { images: ['card7.png', 'card8.png', 'card9.png', 'float-search.png'], loopSeconds: 14, direction: -1 },
  ],
  columnWidth = 560,
  gap = 30,
  pushTo = 1.06,
}) => {
  const frame = useShotFrame(SHOT_TIME);
  const { durationInFrames } = useVideoConfig();
  // 镜头缓推寄生在外层，墙自身循环、镜头单向
  const push = interpolate(frame, [0, durationInFrames], [1, pushTo]);
  const tickerColumns: TickerColumn[] = columns.map((c) => ({
    items: c.images.map(shot),
    durationInSeconds: c.loopSeconds,
    direction: c.direction,
  }));

  return (
    <AbsoluteFill style={{ backgroundColor: BG }}>
      <AbsoluteFill style={{ transform: `scale(${push})` }}>
        <VerticalTicker
          columns={tickerColumns}
          backgroundColor={BG}
          columnWidth={columnWidth}
          gap={gap}
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
