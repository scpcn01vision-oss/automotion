// === 可调参数 ===
// DURATION: 180（总帧数，可调；弹性段随 DURATION 等比缩放）
// 色彩: 走纸墨 G 色板（src/_fixtures/Fixtures.tsx）——文字 G.ink / 背景 G.bg / 强调 G.accent
// 功能: 展开,宣告
// === 时间特性 ===
// 策略: 弹刚 ShotTime（刚弹分段）
// 刚性（不可压缩）: 刚性:胶带拍34f,立起34f
// 弹性（可伸缩）: 其余段（入场/过渡/收尾/hold）可等比缩放
// === 适配注意 ===
// 调 DURATION 时只动弹性段 interpolate 关键帧，刚性核心帧区间保持固定帧数。
// masking-tape-slap —— 纸胶带拍定
// 一张 Card 轻飘入位后悬着微晃（±1.5° 正弦 + 5px 上下浮），两条半透明纸胶带
// 先后从画外拍在对角（scale 1.45→1 + rotate 过冲 + 一帧压扁）。第一条拍下晃动减半，
// 第二条拍下同帧卡片停晃、投影瞬间变薄、整卡 2px 下沉——"按死"的一瞬是主角。
// 帧确定性：全部由 frame 派生，无随机。收尾 f86 后真静止 54f。
import React from 'react';
import { interpolate, Easing, Img, staticFile, useCurrentFrame } from 'remotion';
import { G } from '../../_fixtures/Fixtures';
import { useShotFrame } from '../../../engine/useShotFrame';
import type { ShotTime } from '../../../engine/time';

// 时长画像（迁移自 013 lens-timings.json；空场/晃动弹性，胶带拍刚性）
const SHOT_TIME: ShotTime = {
  segments: [
    { from: 0, to: 58, mode: 'elastic', minFrames: 12 },
    { from: 58, to: 88, mode: 'rigid' },
    { from: 88, to: 180, mode: 'elastic', minFrames: 20 },
  ],
  minFrames: 62,
};

const CARD_W = 560;
const CARD_H = 350;
const CX = (1920 - CARD_W) / 2;
const CY = (1080 - CARD_H) / 2 + 40;

const FLOAT_START = 12; // 开头 12f 空场静置
const FLOAT_END = 38;
const SLAP1 = 58;
const SLAP2 = 82;
const APPROACH = 6; // 胶带从画外扑向卡面的帧数
const FREEZE = 2; // 拍死后晃动归零帧数

// 悬浮晃动幅度包络：入位后升起 → 第一条胶带拍下后减半 → 第二条拍下冻结（由外层处理）
const amp = (f: number, floatEnd: number, slap1: number): number => {
  const rise = interpolate(f, [floatEnd, floatEnd + 8], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const damp = interpolate(f, [slap1, slap1 + 4], [1, 0.45], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return rise * damp;
};

const rawRot = (f: number, floatEnd: number, slap1: number): number =>
  amp(f, floatEnd, slap1) * 1.5 * Math.sin((f - floatEnd) * 0.16);
const rawBob = (f: number, floatEnd: number, slap1: number): number =>
  amp(f, floatEnd, slap1) * 5 * Math.sin((f - floatEnd) * 0.11);

// 第二条拍下（SLAP2）同帧起 2f 内把晃动按死到 0
const frozen = (f: number, raw: (x: number) => number, slap2: number): number =>
  f <= slap2
    ? raw(f)
    : interpolate(f, [slap2, slap2 + FREEZE], [raw(slap2), 0], {
        extrapolateRight: 'clamp',
      });

const Tape: React.FC<{
  frame: number;
  land: number;
  cx: number; // 胶带中心点（世界坐标）
  cy: number;
  rot: number; // 落定角度
  fromX: number; // 画外来向偏移
  fromY: number;
}> = ({ frame, land, cx, cy, rot, fromX, fromY }) => {
  if (frame < land - APPROACH) return null; // 条件卸载：拍上前真不存在

  const t = interpolate(frame, [land - APPROACH, land], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const scale = interpolate(t, [0, 1], [1.45, 1]);
  const dx = fromX * (1 - t);
  const dy = fromY * (1 - t);
  const opacity = interpolate(frame, [land - APPROACH, land - APPROACH + 2], [0, 0.85], {
    extrapolateRight: 'clamp',
  });
  // rotate 过冲：来时欠 16° → 落帧过 7° → 4f 内回正
  const r = interpolate(frame, [land - APPROACH, land, land + 4], [rot - 16, rot + 7, rot], {
    easing: Easing.out(Easing.quad),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  // 一帧压扁：落帧 scaleY 0.72，次帧 0.9，随后复原
  const sy = frame === land ? 0.72 : frame === land + 1 ? 0.9 : 1;

  return (
    <div
      style={{
        position: 'absolute',
        left: cx - 160,
        top: cy - 34,
        width: 320,
        height: 68,
        transform: `translate(${dx}px, ${dy}px) rotate(${r}deg) scale(${scale}) scaleY(${sy})`,
        transformOrigin: '50% 50%',
        opacity,
        background:
          'linear-gradient(90deg, rgba(214,212,206,0.95) 0%, rgba(226,224,218,0.95) 30%, rgba(212,210,204,0.95) 60%, rgba(222,220,214,0.95) 100%)',
        // 撕边：两端锯齿
        clipPath:
          'polygon(0% 8%, 2.5% 0%, 97% 3%, 100% 12%, 98.2% 30%, 100% 52%, 98% 74%, 100% 90%, 96.5% 100%, 3% 97%, 0% 88%, 1.8% 64%, 0% 42%, 2% 22%)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
      }}
    />
  );
};

export interface MaskingTapeCard {
  type?: 'rows' | 'image';
  title?: string;
  rows?: { label: string; value: string }[];
  image?: string;
}

export interface MaskingTapeSlapProps {
  card?: MaskingTapeCard;
  revealAtSec?: number; // 口播对齐：第一条胶带拍下的段内秒；提供后飘入压缩到该时刻前，第二条相对 +24 帧
}

// 卡片内容渲染器（可扩展：新形态 = 在 type 联合里加值 + 此处加分支）
const CardContent: React.FC<{ card: MaskingTapeCard }> = ({ card }) => {
  const { type = 'rows', title, rows, image } = card;
  return (
    <div
      style={{
        width: '100%', height: '100%', background: G.card, border: `2px solid ${G.border}`,
        borderRadius: 14, boxSizing: 'border-box', padding: '28px 32px',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}
    >
      {title ? (
        <div style={{ fontSize: 30, fontWeight: 700, color: G.ink, marginBottom: 18 }}>
          {title}
        </div>
      ) : null}
      {type === 'image' && image ? (
        <Img
          src={/^https?:\/\//.test(image) ? image : staticFile(image)}
          style={{ width: '100%', flex: 1, objectFit: 'cover', borderRadius: 10, border: `1px solid ${G.line}` }}
        />
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {(rows ?? []).map((r, i) => (
            <div
              key={i}
              style={{
                display: 'flex', alignItems: 'center', padding: '13px 0',
                borderBottom: i < (rows ?? []).length - 1 ? `1px solid ${G.line}` : 'none',
              }}
            >
              <span style={{ fontSize: 22, color: G.ink, fontWeight: 600 }}>{r.label}</span>
              <span style={{ marginLeft: 'auto', fontSize: 23, color: G.accent, fontWeight: 800 }}>{r.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const MaskingTapeSlap: React.FC<MaskingTapeSlapProps> = ({
  card = {
    type: 'rows',
    title: 'PROJECT BRIEF',
    rows: [
      { label: 'Scope', value: 'Locked' },
      { label: 'Budget', value: 'Approved' },
      { label: 'Ship', value: 'Ready' },
    ],
  },
  revealAtSec,
}) => {
  const frameShot = useShotFrame(SHOT_TIME);
  const realFrame = useCurrentFrame();
  const cueMode = revealAtSec !== undefined;
  const frame = cueMode ? realFrame : frameShot;
  // cue 模式：飘入（0–38 原始）压缩到 revealAtSec 前；胶带拍 SLAP1=revealAtSec，SLAP2 相对 +24 帧
  const pre = cueMode ? Math.min(1, (realFrame / 30) / (revealAtSec ?? 1)) * FLOAT_END : frame;
  const SLAP1F = cueMode ? Math.round(revealAtSec * 30) : SLAP1;
  const SLAP2F = SLAP1F + (SLAP2 - SLAP1);

  // 卡片飘入：从上方 -120px 缓落
  const floatY = interpolate(pre, [FLOAT_START, FLOAT_END], [-120, 0], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const floatOp = interpolate(pre, [FLOAT_START, FLOAT_START + 10], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const rot = frozen(pre, (f) => rawRot(f, FLOAT_END, SLAP1F), SLAP2F);
  const bob = frozen(pre, (f) => rawBob(f, FLOAT_END, SLAP1F), SLAP2F);

  // 按死：2px 下沉 + 投影瞬间变薄
  const sink = interpolate(frame, [SLAP2F, SLAP2F + FREEZE], [0, 2], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const shOff = interpolate(frame, [SLAP2F, SLAP2F + FREEZE], [16, 3], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const shBlur = interpolate(frame, [SLAP2F, SLAP2F + FREEZE], [34, 8], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const shAlpha = interpolate(frame, [SLAP2F, SLAP2F + FREEZE], [0.22, 0.1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div style={{ width: 1920, height: 1080, background: G.bg, position: 'relative', overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute',
          left: CX,
          top: CY,
          width: CARD_W,
          height: CARD_H,
          transform: `translateY(${floatY + bob + sink}px) rotate(${rot}deg)`,
          transformOrigin: '50% 50%',
          opacity: floatOp,
          boxShadow: `0 ${shOff}px ${shBlur}px rgba(0,0,0,${shAlpha})`,
        }}
      >
        <CardContent card={card} />
      </div>

      {/* 两条胶带钉在卡片对角（世界坐标，卡片在其下滑动微晃） */}
      <Tape frame={frame} land={SLAP1F} cx={CX + 55} cy={CY + 40} rot={-45} fromX={-170} fromY={-130} />
      <Tape frame={frame} land={SLAP2F} cx={CX + CARD_W - 55} cy={CY + CARD_H - 40} rot={-45} fromX={170} fromY={130} />
    </div>
  );
};
