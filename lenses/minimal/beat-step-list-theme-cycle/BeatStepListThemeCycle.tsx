// === 可调参数 ===
// DURATION: 铺垫 30f + 拍长 18f×拍数 + 收尾 hold（5 词 4 拍 = 102+hold；8 词 7 拍 = 156+hold）
// 色彩: 纸墨深场——墨色系场底 + 纸白/琥珀/灰褐/深棕胶囊（深浅对结构来自原版）
// 功能: 宣告（节奏）
// 描述: 拍点列词——深色场形容词列表逐拍上移一行，中央固定胶囊接住下一词并换色，
//       场底色同拍跟换；行、色、场三通道锁死同一拍点
// === 时间特性 ===
// 刚性（不可压缩）: 前 firstBeat 帧铺垫（未开拍不触发）
// 弹性（可伸缩）: 拍长 beatFrames / 拍数 beats 可调；拍内跳变窗固定 6f
// === 适配注意 ===
// 每个被轮到的词都对应一个主题对（THEMES 按 beat 索引取，超出钳制到最后一组）；
// 跳到最后一个词时下方无垫词，属已知观感。跳变窗固定 6f 不可调大，否则"跳"变"滑"。
// 长词（如 >14 字符）会溢出 900px 胶囊，用 fontSize 压缩。
// 还原自 video-shotcraft demos/rhythm/beat-step-list-theme-cycle/BeatStepListThemeCycle.tsx：
// 机制逐帧照搬（列表 translateY 步进 / 胶囊固定 / 三通道同源 / 6f 跳变窗 / squash / 上下羽化），
// 仅做纸墨换色 + 最小参数化（words/beats/beatFrames/firstBeat）。
import React from 'react';
import { AbsoluteFill, interpolate } from 'remotion';
import { G } from '../../_fixtures/Fixtures';
import { FONT_STACK } from '../../_system/typography';
import { useShotFrame } from '../../../engine/useShotFrame';
import type { ShotTime } from '../../../engine/time';

// 时长画像（迁移自 013 lens-timings.json；拍点列词刚性 30-84）
const SHOT_TIME: ShotTime = {
  segments: [
    { from: 0, to: 30, mode: 'elastic', minFrames: 8 },
    { from: 30, to: 84, mode: 'rigid' },
    { from: 84, to: 180, mode: 'elastic', minFrames: 12 },
  ],
  minFrames: 74,
};

const ROW_H = 150; // 行高（列表步进单位）
const SNAP_WINDOW = 6; // 跳变窗：拍头 6 帧内完成跳变，其余帧静置（配方卡命门，勿调大）

// 每拍的（胶囊色 / 场底色 / 选中词色）——起始态 + 7 拍，共 8 组纸墨深浅对
const THEMES = [
  { pill: G.card, bg: '#241a12', ink: G.ink }, // 纸白 / 深棕墨
  { pill: G.accent, bg: '#2a1d0d', ink: G.bg }, // 琥珀 / 深琥珀墨
  { pill: G.mid, bg: '#1f1d1a', ink: G.bg }, // 灰褐 / 墨灰
  { pill: G.side, bg: '#161310', ink: G.bg }, // 深棕墨 / 暖黑
  { pill: G.bar, bg: '#1c1813', ink: G.ink }, // 暖灰 / 深棕黑
  { pill: G.line, bg: '#1e1c19', ink: G.ink }, // 暖灰线 / 深暖灰
  { pill: G.panel, bg: '#201a13', ink: G.ink }, // 略深纸 / 墨棕
  { pill: G.bg, bg: '#141110', ink: G.ink }, // 暖白 / 深褐黑
];

// 拍内跳变：拍头 6 帧内完成，陡 ease-out（指数 3.2，原版曲线）
const snap = (t: number) =>
  interpolate(t, [0, 1], [0, 1], {
    easing: (x) => 1 - Math.pow(1 - x, 3.2),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

export interface BeatStepListThemeCycleProps {
  words?: string[];
  beats?: number;
  beatFrames?: number;
  firstBeat?: number;
  fontSize?: number;
}

export const BeatStepListThemeCycle: React.FC<BeatStepListThemeCycleProps> = ({
  words = ['modern', 'playful', 'expressive', 'seamless', 'intuitive'],
  beats = 4,
  beatFrames = 18,
  firstBeat = 30,
  fontSize = 92,
}) => {
  const frame = useShotFrame(SHOT_TIME);

  if (words.length === 0) {
    return <AbsoluteFill style={{ background: THEMES[0].bg }} />;
  }

  // 当前拍序号与拍内进度（跳变只占拍头 6 帧）
  const raw = (frame - firstBeat) / beatFrames;
  const beat = Math.min(beats, Math.max(0, Math.floor(raw) + 1)); // 已触发的拍数
  const beatStartFrame = firstBeat + (beat - 1) * beatFrames;
  const tInBeat = beat === 0 ? 1 : snap((frame - beatStartFrame) / SNAP_WINDOW);

  // 连续步进量：整数拍 + 拍头 6 帧内的插值
  const step = beat === 0 ? 0 : (beat - 1) + tInBeat;

  // 三通道 —— 1) 列表上移一行
  const listY = -step * ROW_H;

  // 2) 胶囊换色（拍头硬跳，带一点 cross-fade）
  const themePrev = THEMES[Math.max(0, Math.min(beat - 1, THEMES.length - 1))];
  const themeNow = THEMES[Math.min(beat, THEMES.length - 1)];
  const mixT = beat === 0 ? 1 : tInBeat;
  const mix = (a: string, b: string, t: number) => {
    const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
    const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
    return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * t)).join(',')})`;
  };
  const pillColor = mix(themePrev.pill, themeNow.pill, mixT);
  const bgColor = mix(themePrev.bg, themeNow.bg, mixT);

  // 3) 胶囊每拍落位时 squash 弹一下
  const pop = beat === 0 ? 1 : interpolate(tInBeat, [0, 0.6, 1], [1.12, 0.97, 1]);

  // 选中行文字反白判定：胶囊固定在视口中央行，选中词 = words[beat]
  const selectedIdx = beat;

  return (
    <AbsoluteFill style={{ background: bgColor, fontFamily: FONT_STACK, justifyContent: 'center' }}>
      {/* 中央固定胶囊（列表在其下滚动，视觉上"胶囊跳到下一行"） */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: 540 - ROW_H / 2 + 10,
          width: 900,
          height: ROW_H - 20,
          transform: `translateX(-50%) scale(${pop})`,
          background: pillColor,
          borderRadius: 999,
          boxShadow: '0 14px 40px rgba(44,36,22,0.35)',
        }}
      />
      {/* 词列表 */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 540 - ROW_H / 2,
          transform: `translateY(${listY}px)`,
        }}
      >
        {words.map((w, i) => {
          const isSel = i === selectedIdx;
          return (
            <div
              key={w}
              style={{
                height: ROW_H,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span
                style={{
                  fontSize,
                  fontWeight: 800,
                  letterSpacing: -1.5,
                  color: isSel ? themeNow.ink : 'rgba(250,247,242,0.34)',
                  position: 'relative',
                  zIndex: 2,
                }}
              >
                {w}
              </span>
            </div>
          );
        })}
      </div>
      {/* 视口上下羽化（颜色必须跟 bgColor 实时同步） */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          height: 300,
          background: `linear-gradient(${bgColor}, transparent)`,
          zIndex: 3,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 300,
          background: `linear-gradient(transparent, ${bgColor})`,
          zIndex: 3,
        }}
      />
    </AbsoluteFill>
  );
};
