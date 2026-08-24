// === 可调参数 ===
// DURATION: 180（总帧数，可调；弹性段随 DURATION 等比缩放）
// 功能: 宣告
// 描述: 大字跺入——词随节拍跺入 + 平涂底色闪换
// 色彩: 走纸墨 G 色板（src/_fixtures/Fixtures.tsx）——文字 G.ink / 背景 G.bg / 强调 G.accent
// === 时间特性 ===
// 策略: 弹刚 ShotTime（整段弹性）
// 刚性（不可压缩）: 无（全程弹性）
// 弹性（可伸缩）: 全程可等比缩放（时长适配语音）
// === 适配注意 ===
// 调 DURATION 时只动弹性段 interpolate 关键帧，刚性核心帧区间保持固定帧数。
// 底色闪砸字（cel-flash-stomp）——stomp-typography 逐词节拍砸字 ×
// background-cel-flash 纯色底闪的组合变异。三个大词逐拍硬切占满屏，
// 每词像图章一样歪着砸落（scale 1.18→0.98→1 弹落 + 交替 ±2.5° rotate）；
// 背景闪默认关闭（flashLen=0，2026-08-14 用户裁决：频闪影响观感）；
// 如需闪切，把对应词 flashLen 设为正帧数（每 2f 在 G.bg 与 flashDark 间交替）。
// 关键帧：0 "SHIP" 硬切入(rot+2.5°) → 0–6 弹落 → 6–11 背景闪(#cfcfca, 2f 交替×6f)
// → 30 "FASTER" 硬切(rot−2.5°) → 30–36 弹落 → 36–41 背景闪
// → 60 "TODAY" 硬切(rot 0°) → 60–66 弹落 → 66–73 背景闪加倍(8f, #c4c4c0)
// + 66–80 底部标签条淡入 → 80–144 全静止(≥45f, 无逐帧噪声层)。
import React from 'react';
import { interpolate, Easing, useCurrentFrame } from 'remotion';
import { G } from '../../_fixtures/Fixtures';
import { FONT_STACK } from '../../_system/typography';
import { useShotFrame } from '../../../engine/useShotFrame';
import type { ShotTime } from '../../../engine/time';

// 时长画像（lens-timings 无此镜头，按文件头注释「刚性:无，全程弹性」+ 源码关键帧 0-80 标）
const SHOT_TIME: ShotTime = {
  segments: [{ from: 0, to: 180, mode: 'elastic', minFrames: 60 }],
  minFrames: 60,
};

type Word = {
  text: string;
  start: number; // 硬切入场帧
  end: number; // 显示到此帧前（下一词硬切）
  rot: number; // 图章歪斜角
  flashLen: number; // 落定后背景闪总帧数
  flashDark: string; // 闪切的加深灰
};

const LAND = 6; // 入场弹落时长：start+6 落定，同帧起闪
export interface CelFlashStompFooter {
  icon?: string; // 中性图标（Unicode 符号）
  label?: string; // 主文字
  tag?: string; // 右侧副文字
}
export interface CelFlashStompProps {
  words?: Word[];
  footer?: CelFlashStompFooter;
  cueSec?: number[]; // 口播对齐：每词入场段内秒（与 words 一一对应）；提供后忽略 words 自带 start/end
}

export const CelFlashStomp: React.FC<CelFlashStompProps> = ({
  words = [
    { text: 'READY', start: 0, end: 30, rot: 2.5, flashLen: 0, flashDark: '#cfcfca' },
    { text: 'GO', start: 30, end: 60, rot: -2.5, flashLen: 0, flashDark: '#cfcfca' },
    { text: 'NOW', start: 60, end: 9999, rot: 0, flashLen: 0, flashDark: '#c4c4c0' },
  ],
  footer = { icon: '✦', label: 'GOAL', tag: 'READY' },
  cueSec,
}) => {
  const frameShot = useShotFrame(SHOT_TIME);
  const realFrame = useCurrentFrame();
  const cueMode = !!cueSec && cueSec.length === words.length;
  const frame = cueMode ? realFrame : frameShot;

  let word: Word;
  if (cueMode) {
    const sec = realFrame / 30;
    let idx = 0;
    while (idx < cueSec.length - 1 && sec >= cueSec[idx + 1]) idx++;
    const w = words[idx];
    const end = cueSec[idx + 1] !== undefined ? Math.round(cueSec[idx + 1] * 30) : 99999;
    word = { ...w, start: Math.round(cueSec[idx] * 30), end };
  } else {
    word = words.find((w) => frame >= w.start && frame < w.end)!;
  }
  const t = frame - word.start;

  // 弹落：scale 1.18 → 0.98(2% 过冲) → 1，6f 内完成，poly(5) 出缓
  const scale =
    t < 4
      ? interpolate(t, [0, 4], [1.18, 0.98], {
          extrapolateLeft: 'clamp', // 词未到 cue 时刻（t<0）时保持 1.18，禁止左端外推爆炸
          extrapolateRight: 'clamp',
          easing: Easing.out(Easing.poly(5)),
        })
      : interpolate(t, [4, LAND], [0.98, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
          easing: Easing.out(Easing.quad),
        });

  // 背景闪：落定帧(start+LAND)起，每 2f 在加深灰与 G.bg 间交替，共 flashLen 帧
  const ft = t - LAND;
  const flashing = ft >= 0 && ft < word.flashLen;
  const bg = flashing && Math.floor(ft / 2) % 2 === 0 ? word.flashDark : G.bg;

  // 第三词落定同帧起底部标签条淡入（66–80）
  const labelStart = cueMode ? Math.round(cueSec[cueSec.length - 1] * 30) + LAND : 66;
  const labelOp = interpolate(frame, [labelStart, labelStart + 14], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad),
  });

  return (
    <div style={{ width: 1920, height: 1080, background: bg, position: 'relative', overflow: 'hidden' }}>
      {/* 文字层独立在背景之上：背景闪切时它纹丝不动 */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            fontFamily: FONT_STACK,
            fontWeight: 800,
            fontSize: 210,
            color: G.ink,
            letterSpacing: -4,
            transform: `scale(${scale}) rotate(${word.rot}deg)`,
          }}
        >
          {word.text}
        </div>
      </div>
      {/* 底部标签条：第三词落定同帧淡入（icon + 文字，中性占位内容） */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 96,
          background: G.ink,
          opacity: labelOp,
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          padding: '0 120px',
          boxSizing: 'border-box',
          fontFamily: FONT_STACK,
        }}
      >
        <div style={{ width: 44, height: 44, borderRadius: 11, background: G.sideBar, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, color: G.bg }}>{footer.icon}</div>
        <div style={{ fontSize: 30, fontWeight: 700, color: G.bg, letterSpacing: 2 }}>{footer.label}</div>
        <div style={{ marginLeft: 'auto', fontSize: 24, fontWeight: 600, color: G.sideBar, letterSpacing: 2 }}>{footer.tag}</div>
      </div>
    </div>
  );
};
