// === 可调参数 ===
// DURATION: 180（总帧数，可调；弹性段随 DURATION 等比缩放）
// 色彩: 走纸墨 G 色板（src/_fixtures/Fixtures.tsx）——文字 G.ink / 背景 G.bg / 强调 G.accent
// 功能: 全景
// === 时间特性 ===
// 刚性（不可压缩）: 无（全程弹性）
// 弹性（可伸缩）: 全程可等比缩放（时长适配语音）
// === 适配注意 ===
// 调 DURATION 时只动弹性段 interpolate 关键帧，刚性核心帧区间保持固定帧数。
import { VerticalTicker } from "./VerticalTicker";
import type { TickerColumn } from "./VerticalTicker";
import React from "react";
import { Img, staticFile } from "remotion";

const CARD_FILES = [
  ["card1.png", "card2.png", "card3.png", "card10.png"],
  ["card4.png", "card5.png", "card6.png", "projects-empty.png"],
  ["card7.png", "card8.png", "card9.png", "float-search.png"],
] as const;

const buildColumn = (files: readonly string[], duration: number, dir: -1 | 1): TickerColumn => ({
  items: files.map((file) => (
    <Img
      key={file}
      src={staticFile(`textures/${file}`)}
      style={{ width: "100%", display: "block" }}
    />
  )),
  durationInSeconds: duration,
  direction: dir,
});

const COLUMNS: TickerColumn[] = [
  buildColumn(CARD_FILES[0], 18, -1),
  buildColumn(CARD_FILES[1], 22, 1),
  buildColumn(CARD_FILES[2], 20, -1),
];

export const VerticalTickerWrapper: React.FC = () => (
  <VerticalTicker
    columns={COLUMNS}
    backgroundColor="#faf7f2"
    maskHeight={200}
    tiltDeg={20}
    perspective={1000}
    scale={1.2}
    columnWidth={400}
    gap={30}
  />
);
