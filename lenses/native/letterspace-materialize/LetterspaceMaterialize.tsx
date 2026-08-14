// === 可调参数 ===
// DURATION: 180（总帧数，可调；弹性段随 DURATION 等比缩放）
// 色彩: 走纸墨 G 色板（src/_fixtures/Fixtures.tsx）——文字 G.ink / 背景 G.bg / 强调 G.accent
// 功能: 钩子,宣告
// props: word（字标内容，仅内置字形 S/U/P/E/R/H/M/A/N，未收录字母渲染为圆点）
// === 时间特性 ===
// 刚性（不可压缩）: 刚性:52f
// 弹性（可伸缩）: 其余段（入场/过渡/收尾/hold）可等比缩放
// === 适配注意 ===
// 调 DURATION 时只动弹性段 interpolate 关键帧，刚性核心帧区间保持固定帧数。
// letterspace-materialize v3 —— 按批次 11 用户意见修正（截图 superhuman，4 张）：
// ① 字形比例改宽：v2 竖长（60x100），对照终态截图字高≈50/字宽≈58（宽高比≈1.15），
//    v3 重绘全部骨架字形到 78x64 视框（字面 58x54），方正略宽 + 细笔画 + 大字距；
// ② 所有字母同时开始同时完成：去掉 v2 的逐字错峰（PER/jitter），全字符同一帧起笔、
//    pathLength 归一保证不同笔画长度的字母在同一帧齐收（截图 2/3 的全行并行半截态）。
import React from 'react';
import { AbsoluteFill, interpolate } from 'remotion';
import { G } from '../../_fixtures/Fixtures';

import { useShotFrame } from '../../../engine/useShotFrame';
import type { ShotTime } from '../../../engine/time';

// 时长画像（保守兜底：整段弹性；精修阶段按镜头关键帧画像刚弹分段）
const SHOT_TIME: ShotTime = {
  segments: [{ from: 0, to: 180, mode: 'elastic', minFrames: 0 }],
  minFrames: 0,
};

// 78x64 视框内的方正略宽细骨架字形（子笔画顺序=描画顺序）
const GLYPHS: Record<string, string> = {
  S: 'M 62 13 C 51 4, 18 3, 15 15 C 12 26, 29 29, 39 31 C 50 33, 66 37, 63 48 C 60 59, 21 61, 11 50',
  U: 'M 12 5 L 12 40 C 12 59, 66 59, 66 40 L 66 5',
  P: 'M 12 59 L 12 5 L 44 5 C 64 5, 64 32, 44 32 L 12 32',
  E: 'M 62 5 L 12 5 L 12 59 L 62 59 M 12 31 L 56 31',
  R: 'M 12 59 L 12 5 L 44 5 C 64 5, 64 31, 44 31 L 12 31 M 42 31 L 64 59',
  H: 'M 12 5 L 12 59 M 66 5 L 66 59 M 12 31 L 66 31',
  M: 'M 8 59 L 8 6 L 39 38 L 70 6 L 70 59',
  A: 'M 7 59 L 39 5 L 71 59 M 17 41 L 61 41',
  N: 'M 12 59 L 12 5 L 66 59 L 66 5',
};

const START = 16;   // 全字符统一起画帧（无错峰）
const DUR = 52;     // 全字符统一画完帧数（pathLength 归一→同帧齐收）

export interface LetterspaceMaterializeProps {
  word?: string;
}

export const LetterspaceMaterialize: React.FC<LetterspaceMaterializeProps> = ({
  word = 'SUPREME',
}) => {
  const frame = useShotFrame(SHOT_TIME);

  // 全字符共享同一进度：同时开始、同时完成
  const p = interpolate(frame, [START, START + DUR], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  // easeInOut：起笔缓→中段匀速→收笔缓（手写感）
  const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
  // 画完瞬间轻微提亮回落（结晶收束）——全字符同帧发生
  const doneGlow = interpolate(frame, [START + DUR, START + DUR + 8], [1, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const glowAmt = p >= 1 ? doneGlow : p > 0.7 ? (p - 0.7) / 0.3 : 0;

  const letters = word.split('').map((ch, li) => (
    <svg key={li} width={78} height={64} viewBox="0 0 78 64"
      style={{ overflow: 'visible', display: 'block' }}>
      {p > 0 && (
        GLYPHS[ch] ? (
          <path
            d={GLYPHS[ch]}
            fill="none"
            stroke={G.ink}
            strokeWidth={5.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - e}
            style={{
              filter: `drop-shadow(0 0 ${6 + glowAmt * 10}px rgba(211,146,60,${0.35 + glowAmt * 0.35}))`,
            }}
          />
        ) : (
          // 未收录字形兜底：中性圆点，保证任意词不空白
          <circle
            cx={39} cy={32} r={9}
            fill="none"
            stroke={G.ink}
            strokeWidth={5.5}
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - e}
          />
        )
      )}
    </svg>
  ));

  return (
    <AbsoluteFill style={{
      background: `linear-gradient(178deg, ${G.bg} 0%, ${G.panel} 30%, ${G.nav} 58%, ${G.line} 100%)`,
      alignItems: 'center', justifyContent: 'center',
    }}>
      {/* 暮色地平线光带（山影/晚霞近似） */}
      <div style={{
        position: 'absolute', left: 0, right: 0, top: 470, height: 170,
        background: 'linear-gradient(180deg, rgba(211,146,60,0) 0%, rgba(200,135,50,0.20) 45%, rgba(140,100,60,0.12) 75%, rgba(0,0,0,0) 100%)',
        filter: 'blur(20px)',
      }} />
      <div style={{
        position: 'absolute', right: 130, top: 330, width: 560, height: 200,
        background: 'radial-gradient(ellipse at center, rgba(211,146,60,0.16) 0%, rgba(0,0,0,0) 70%)',
        filter: 'blur(26px)',
      }} />
      {/* 大字距字标：全字符并行连续描画 */}
      <div style={{ display: 'flex', gap: 34, alignItems: 'center' }}>
        {letters}
      </div>
    </AbsoluteFill>
  );
};
