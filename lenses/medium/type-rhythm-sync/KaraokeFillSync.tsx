// === 可调参数 ===
// DURATION: 180（总帧数，可调；弹性段随 DURATION 等比缩放）
// 色彩: 走纸墨 G 色板（src/_fixtures/Fixtures.tsx）——文字 G.ink / 背景 G.bg / 强调 G.accent
// 功能: 宣告,举证
// props: lines（两行词表：text + 填充帧区间）
// === 时间特性 ===
// 策略: 弹刚 ShotTime（整段弹性）
// 刚性（不可压缩）: 无
// 弹性（可伸缩）: 全程可等比缩放（时长适配语音）
// === 适配注意 ===
// 段长不足 60f 时回退原始帧（动画按原速、可能被截断）。
// 卡拉OK填色随读（karaoke-fill-sync）——旁白读到哪个词，哪个词就被深色从左到右
// 点亮。两行标语 "SHIP FASTER / BREAK NOTHING"，每个词双层同文本叠放：底层 G.line
// 浅灰字，上层 G.ink 深字用 clip-path: inset(0 X% 0 0) 按词内进度线性填充（逐词独立
// 叠层，clip 百分比即词内进度，无需量测词在整行的像素占比）。词级时间表模拟语速：
// SHIP 20–38、FASTER 42–75（长词慢读）、BREAK 85–103、NOTHING 107–130，词间停顿。
// 正在填的词底下有 8px 深色下划线跟随填充右缘作读指。0–19f hold；130–149f 真静止。
import React from 'react';
import { interpolate } from 'remotion';
import { G } from '../../_fixtures/Fixtures';
import { FONT_STACK } from '../../_system/typography';

import { useShotFrame } from '../../../engine/useShotFrame';
import type { ShotTime } from '../../../engine/time';

// 时长画像：整段弹性（2026-08-14 精修）
const SHOT_TIME: ShotTime = {
  segments: [{ from: 0, to: 180, mode: 'elastic', minFrames: 0 }],
  minFrames: 0,
};

type Word = { text: string; start: number; end: number };

const KaraokeWord: React.FC<{ word: Word; frame: number }> = ({ word, frame }) => {
  // 词内 linear 填充进度，clamp 保证读完保持
  const p = interpolate(frame, [word.start, word.end], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const active = frame >= word.start && frame < word.end; // 正在读这个词
  return (
    <span style={{ position: 'relative', display: 'inline-block' }}>
      {/* 底层：浅灰未读字 */}
      <span style={{ color: G.line }}>{word.text}</span>
      {/* 上层：深字按进度从左到右揭开 */}
      <span
        style={{
          position: 'absolute',
          inset: 0,
          color: G.ink,
          clipPath: `inset(0 ${(1 - p) * 100}% 0 0)`,
        }}
      >
        {word.text}
      </span>
      {/* 读指下划线：只在正在填的词下出现，右缘跟随填充进度 */}
      {active && (
        <span
          style={{
            position: 'absolute',
            left: 0,
            bottom: -14,
            width: `${p * 100}%`,
            height: 8,
            background: G.ink,
          }}
        />
      )}
    </span>
  );
};

export interface KaraokeFillSyncProps {
  lines?: Word[][];
}

export const KaraokeFillSync: React.FC<KaraokeFillSyncProps> = ({
  lines = [
    [
      { text: 'READY', start: 20, end: 38 },
      { text: 'GO', start: 42, end: 75 },
    ],
    [
      { text: 'BUILD', start: 85, end: 103 },
      { text: 'FAST', start: 107, end: 130 },
    ],
  ],
}) => {
  const frame = useShotFrame(SHOT_TIME);
  return (
    <div
      style={{
        width: 1920,
        height: 1080,
        background: G.bg,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        paddingLeft: 240,
        boxSizing: 'border-box',
        fontFamily: FONT_STACK,
        fontSize: 130,
        fontWeight: 800,
        letterSpacing: 2,
        lineHeight: 1.45,
      }}
    >
      {lines.map((words, li) => (
        <div key={li} style={{ display: 'flex', gap: 48 }}>
          {words.map((w) => (
            <KaraokeWord key={w.text} word={w} frame={frame} />
          ))}
        </div>
      ))}
    </div>
  );
};
