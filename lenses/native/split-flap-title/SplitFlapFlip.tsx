// === 可调参数 ===
// DURATION: 180（总帧数，可调；弹性段随 DURATION 等比缩放）
// 色彩: 走纸墨 G 色板（src/_fixtures/Fixtures.tsx）——文字 G.ink / 背景 G.bg / 强调 G.accent
// 功能: 钩子,宣告
// props: text（翻牌文本，大写 A-Z/0-9/#$%&）、backdrop（背景压暗内容承载）
// === 时间特性 ===
// 策略: 弹刚 ShotTime（整段弹性）+ 口播锚点（revealAtSec 单事件）
// 刚性（不可压缩）: 无
// 弹性（可伸缩）: 全程可等比缩放（时长适配语音）；提供 revealAtSec 时整词翻完锚定口播时刻，其后静止
// === 适配注意 ===
// 段长不足 60f 时回退原始帧（动画按原速、可能被截断）。
import React from 'react';
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';
import { G } from '../../_fixtures/Fixtures';
import { FONT_STACK } from '../../_system/typography';

import { useShotFrame } from '../../../engine/useShotFrame';
import type { ShotTime } from '../../../engine/time';

// 时长画像：整段弹性（2026-08-14 精修）
const SHOT_TIME: ShotTime = {
  segments: [{ from: 0, to: 180, mode: 'elastic', minFrames: 22 }],
  minFrames: 22,
};

// split-flap-flip：机场翻牌字。每字符一个深底翻牌格（上下两半），
// 逐格翻过 3 个乱码中间态后咔哒停在目标字，左→右 4f 级联成波。
// 节拍：0–21 建立（整排乱码静止）→ 22 起级联翻牌 → 78 全部停定 → 静止到 140。

const CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&';
const START = 22; // 级联起始帧
const STAGGER = 4; // 字符间级联延迟
const FLIP = 5; // 单次翻牌时长
const NFLIP = 3; // 每字符翻 3 次（2 个乱码中间态 + 1 次落到目标字）
const CELL_W = 118;
const CELL_H = 156;

// seed 正弦哈希（禁 Math.random）
const rnd = (a: number) => {
  const x = Math.sin(a * 127.3) * 43758.5453;
  return x - Math.floor(x);
};
const garble = (i: number, k: number) =>
  CHARSET[Math.floor(rnd(i * 7.13 + k * 3.71 + 1) * CHARSET.length)];

const FLAP_BG = G.side;
const FLAP_INK = G.card;

// 半格：上/下半各自 overflow hidden，内部整字定位错半格露出对应一半
const Half: React.FC<{ ch: string; part: 'top' | 'bottom' }> = ({ ch, part }) => (
  <div
    style={{
      position: 'absolute',
      left: 0,
      top: part === 'top' ? 0 : CELL_H / 2,
      width: CELL_W,
      height: CELL_H / 2,
      overflow: 'hidden',
      background: FLAP_BG,
      borderRadius: part === 'top' ? '10px 10px 0 0' : '0 0 10px 10px',
    }}
  >
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: part === 'top' ? 0 : -CELL_H / 2,
        width: CELL_W,
        height: CELL_H,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: FONT_STACK,
        fontWeight: 800,
        fontSize: 100,
        color: FLAP_INK,
      }}
    >
      {ch}
    </div>
  </div>
);

const FlapCell: React.FC<{ target: string; i: number; frame: number; start: number }> = ({
  target,
  i,
  frame,
  start,
}) => {
  // 该格的字符序列：2 个乱码 → 1 个乱码 → 目标字（首态也是乱码，建立段可见）
  const seq = [garble(i, 0), garble(i, 1), garble(i, 2), target];
  const local = frame - (start + i * STAGGER);
  const done = local >= NFLIP * FLIP;

  // 停定咔哒：整格下沉回弹（1px 肉眼无感，放大到 6px 才有"咔哒"）
  const clickY = done
    ? interpolate(local, [15, 17, 19, 22], [0, 6, -1.5, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
        easing: Easing.out(Easing.quad),
      })
    : 0;

  let topCh = seq[0];
  let bottomCh = seq[0];
  let flap: React.ReactNode = null;

  if (done) {
    topCh = target;
    bottomCh = target;
  } else if (local > 0) {
    const k = Math.min(NFLIP - 1, Math.floor(local / FLIP));
    const from = seq[k];
    const to = seq[k + 1];
    const p = Easing.in(Easing.quad)((local - k * FLIP) / FLIP); // 重力感：越掉越快
    topCh = to; // 上半静态：翻开后露出下一字符的上半
    bottomCh = from; // 下半静态：保持旧字符直到活动叶盖下来
    if (p < 0.5) {
      // 前半程：旧字符上半叶 0→-90 掉下
      const deg = p * 2 * 90;
      flap = (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transform: `rotateX(${-deg}deg)`,
            transformOrigin: `center ${CELL_H / 2}px`,
            backfaceVisibility: 'hidden',
            filter: `brightness(${1 - p * 2 * 0.45})`,
            zIndex: 2,
          }}
        >
          <Half ch={from} part="top" />
        </div>
      );
    } else {
      // 后半程：新字符下半叶 90→0 拍下盖住旧下半
      const deg = 90 - (p - 0.5) * 2 * 90;
      flap = (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transform: `rotateX(${deg}deg)`,
            transformOrigin: `center ${CELL_H / 2}px`,
            backfaceVisibility: 'hidden',
            filter: `brightness(${0.55 + (p - 0.5) * 2 * 0.45})`,
            zIndex: 2,
          }}
        >
          <Half ch={to} part="bottom" />
        </div>
      );
    }
  }

  return (
    <div
      style={{
        position: 'relative',
        width: CELL_W,
        height: CELL_H,
        transform: `translateY(${clickY}px)`,
        perspective: 420,
        borderRadius: 10,
        boxShadow: '0 6px 18px rgba(0,0,0,0.3)',
      }}
    >
      <Half ch={topCh} part="top" />
      <Half ch={bottomCh} part="bottom" />
      {flap}
      {/* 中缝铰链线 */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: CELL_H / 2 - 2,
          width: CELL_W,
          height: 4,
          background: G.ink,
          zIndex: 3,
        }}
      />
    </div>
  );
};

export interface SplitFlapFlipProps {
  text?: string; // 翻牌文本（任意字符串）
  previewLabel?: string; // 翻牌板上方预览字样
  revealAtSec?: number; // 口播对齐：整词翻完（全部字符停定）的段内秒；提供后级联压缩到该时刻前完成
}

export const SplitFlapFlip: React.FC<SplitFlapFlipProps> = ({
  text = 'READY GO',
  previewLabel = '预览',
  revealAtSec,
}) => {
  const frameShot = useShotFrame(SHOT_TIME);
  const realFrame = useCurrentFrame();
  const cueMode = revealAtSec !== undefined;
  const frame = cueMode ? realFrame : frameShot;
  // 级联完成时长 = 首字符起翻到末字符停定（随文字长度）
  const nChars = text.split('').filter((c) => c !== ' ').length;
  const cascadeDur = (nChars - 1) * STAGGER + NFLIP * FLIP;
  // 口播对齐：末字符停定帧 = revealAtSec*30，级联起点前移，核心翻牌节奏不变
  const start = cueMode ? Math.max(1, Math.round(revealAtSec * 30) - cascadeDur) : START;
  let letterIdx = 0;
  return (
    <AbsoluteFill style={{ background: G.bg, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
      {/* 卡片 + 上方预览字样 */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 30 }}>
        <div style={{ fontFamily: FONT_STACK, fontWeight: 800, fontSize: 34, letterSpacing: 12, color: G.mid }}>{previewLabel}</div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {text.split('').map((ch, idx) => {
            if (ch === ' ') {
              return <div key={idx} style={{ width: 52 }} />;
            }
            const i = letterIdx++;
            return <FlapCell key={idx} target={ch} i={i} frame={frame} start={start} />;
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
