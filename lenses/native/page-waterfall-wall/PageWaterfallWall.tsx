// === 可调参数 ===
// DURATION: 180（总帧数，可调；弹性段随 DURATION 等比缩放）
// 色彩: 走纸墨 G 色板（src/_fixtures/Fixtures.tsx）——文字 G.ink / 背景 G.bg / 强调 G.accent
// 功能: 全景
// props: columns（3 列瀑布素材/循环时长/方向）、columnWidth、gap、pushTo（缓推终点）
// === 时间特性 ===
// 策略: 弹刚 ShotTime（整段弹性）+ 循环滚动墙固定帧
// 刚性（不可压缩）: 无（滚动墙内部按列 durationInSeconds 循环，不随段长伸缩）
// 弹性（可伸缩）: 整体缓推 push 随段长等比伸缩
// === 适配注意 ===
// push 插值端点用原始坐标 [0,180]（勿用 durationInFrames，否则接入后只推 27%）；段长不足 60f 时回退原始帧。
import React from 'react';
import { AbsoluteFill, Img, interpolate, staticFile } from 'remotion';
import { VerticalTicker, TickerColumn } from './VerticalTicker';
import { G } from '../../_fixtures/Fixtures';

import { useShotFrame } from '../../../engine/useShotFrame';
import type { ShotTime } from '../../../engine/time';

  // 时长画像：整段弹性（缓推随段长），滚动墙内部循环固定（2026-08-14 精修）
  const SHOT_TIME: ShotTime = {
    segments: [{ from: 0, to: 180, mode: 'elastic', minFrames: 60 }],
    minFrames: 60,
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
  // 镜头缓推寄生在外层，墙自身循环、镜头单向
  const push = interpolate(frame, [0, 180], [1, pushTo]);
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
