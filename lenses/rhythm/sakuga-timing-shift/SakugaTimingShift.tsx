// === 可调参数 ===
// DURATION: 180（总帧数，可调；弹性段随 DURATION 等比缩放）
// 功能: 节奏
// 描述: 作画打拍切换——一拍三顿挫转一拍一丝滑冲刺
// 色彩: 走纸墨 G 色板（src/_fixtures/Fixtures.tsx）——文字 G.ink / 背景 G.bg / 强调 G.accent
// === 时间特性 ===
// 刚性（不可压缩）: 无（全程弹性）
// 弹性（可伸缩）: 全程可等比缩放（时长适配语音）
// === 适配注意 ===
// 调 DURATION 时只动弹性段 interpolate 关键帧，刚性核心帧区间保持固定帧数。
// sakuga-timing-shift —— 一拍三转一拍一（作画打拍切换）
// 0–48f：驱动帧 q = floor(f/3)*3，卡从左侧顿挫横移到右侧（10fps 手翻书感），
// 每步 ≈74px + rotate 摆动 = 一拍三的钝感；48f 切换点后改用原始 f 连续驱动，
// 48–75f 丝滑冲刺折返中央（out-poly(4) 高初速 + 运动拉伸 scaleX + 残影），
// 过冲 36px 后 3f 回弹落位。左上角标 "on 3s"/"on 1s" 随段切换并带 line-boil
// （boil 在 f=108 后冻结）。收尾真静止 ≥40f。
import React from 'react';
import { interpolate, Easing } from 'remotion';
import { G } from '../../_fixtures/Fixtures';

import { useShotFrame } from '../../../engine/useShotFrame';
import type { ShotTime } from '../../../engine/time';

// 时长画像（保守兜底：整段弹性；精修阶段按镜头关键帧画像刚弹分段）
const SHOT_TIME: ShotTime = {
  segments: [{ from: 0, to: 180, mode: 'elastic', minFrames: 0 }],
  minFrames: 0,
};

const W = 1920;
const CARD_W = 420;
const CARD_H = 260;
const CARD_Y = (1080 - CARD_H) / 2; // 410

const X_LEFT = 120;
const X_RIGHT = 1380; // 卡左缘，右侧停点
const X_CENTER = (W - CARD_W) / 2; // 750，中央落位
const OVERSHOOT = 36;

const SWITCH = 48; // 打拍切换帧
const ARRIVE = 70; // 冲刺到过冲点
const SETTLE = 75; // 回弹落位完成

export interface SakugaTimingShiftProps {
  cardTitle?: string;
  cardRows?: { label: string; value: string }[];
}

// 移动卡片内容：白卡 + 标题 + 行列表
const CardContent: React.FC<{ cardTitle: string; cardRows: { label: string; value: string }[] }> = ({
  cardTitle,
  cardRows,
}) => (
  <div
    style={{
      width: CARD_W, height: CARD_H, background: G.card, border: `2px solid ${G.border}`,
      borderRadius: 14, boxSizing: 'border-box', padding: '20px 24px',
      display: 'flex', flexDirection: 'column', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    }}
  >
    <div style={{ fontSize: 24, fontWeight: 700, color: G.ink, marginBottom: 12 }}>{cardTitle}</div>
    {cardRows.map((r, i) => (
      <div
        key={i}
        style={{
          display: 'flex', alignItems: 'center', padding: '7px 0',
          borderBottom: i < cardRows.length - 1 ? `1px solid ${G.line}` : 'none',
        }}
      >
        <span style={{ fontSize: 16, color: G.ink, fontWeight: 600 }}>{r.label}</span>
        <span style={{ marginLeft: 'auto', fontSize: 16, color: G.accent, fontWeight: 800 }}>{r.value}</span>
      </div>
    ))}
  </div>
);

// 段一：一拍三。位置函数线性，但只在 q = floor(f/3)*3 上取值。
const pos1 = (t: number): number =>
  interpolate(t, [0, SWITCH], [X_LEFT, X_RIGHT], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

// 段二：一拍一。out-poly(4) 高初速冲刺 → 过冲 → 3f 回弹。
const pos2 = (t: number): number =>
  interpolate(t, [SWITCH, ARRIVE, SETTLE], [X_RIGHT, X_CENTER - OVERSHOOT, X_CENTER], {
    easing: Easing.out(Easing.poly(4)),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

export const SakugaTimingShift: React.FC<SakugaTimingShiftProps> = ({
  cardTitle = 'PROJECT BRIEF',
  cardRows = [
    { label: 'Scope', value: 'Locked' },
    { label: 'Budget', value: 'Approved' },
    { label: 'Ship', value: 'Ready' },
  ],
}) => {
  const f = useShotFrame(SHOT_TIME);
  const onThrees = f < SWITCH;

  // ---- 卡片位置 ----
  const q = Math.floor(f / 3) * 3; // 一拍三驱动帧
  const x = onThrees ? pos1(q) : pos2(f);

  // 顿挫段 rotate 摆动（随 q 冻结，一步一个姿势）
  const rot = onThrees
    ? Math.sin(q * 0.7) * 5
    : interpolate(f, [SWITCH, SWITCH + 8], [Math.sin(SWITCH * 0.7) * 5, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });

  // 冲刺段速度（位置差分，帧时间解耦）→ 运动拉伸
  const v = onThrees ? 0 : Math.abs(pos2(f) - pos2(f - 1));
  const sFac = Math.min(v / 55, 1);
  const stretchX = 1 + 0.35 * sFac; // 峰值 ≈1.35，横向拉丝
  const stretchY = 1 - 0.12 * sFac;

  // 落位急停回弹：72–78f scaleX 压扁再回 1
  const sqX = interpolate(f, [SETTLE - 3, SETTLE, SETTLE + 3], [1, 0.9, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const sqY = interpolate(f, [SETTLE - 3, SETTLE, SETTLE + 3], [1, 1.07, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // 冲刺残影：只在段二速度高时挂载（条件挂载，不留 opacity 0 的壳）
  const ghosts =
    !onThrees && f > SWITCH + 1 && f < ARRIVE + 2 && sFac > 0.15
      ? [
          { xg: pos2(f - 2), op: 0.28 * sFac },
          { xg: pos2(f - 4), op: 0.13 * sFac },
        ]
      : [];

  return (
    <div style={{ width: 1920, height: 1080, background: G.bg, position: 'relative', overflow: 'hidden' }}>
      {/* 轨道基线 + 中央落位虚线槽 */}
      <div
        style={{
          position: 'absolute',
          left: 100,
          right: 100,
          top: CARD_Y + CARD_H + 24,
          height: 3,
          background: G.line,
          borderRadius: 2,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: X_CENTER,
          top: CARD_Y,
          width: CARD_W,
          height: CARD_H,
          border: `3px dashed ${G.bar}`,
          borderRadius: 14,
          boxSizing: 'border-box',
        }}
      />

      {/* 冲刺残影 */}
      {ghosts.map((g, i) => (
        <div
          key={`ghost-${i}`}
          style={{ position: 'absolute', left: 0, top: CARD_Y, opacity: g.op, transform: `translateX(${g.xg}px)` }}
        >
          <CardContent cardTitle={cardTitle} cardRows={cardRows} />
        </div>
      ))}

      {/* 主卡 */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: CARD_Y,
          transform: `translateX(${x}px) rotate(${rot}deg) scaleX(${stretchX * sqX}) scaleY(${stretchY * sqY})`,
          transformOrigin: '50% 50%',
        }}
      >
        <CardContent cardTitle={cardTitle} cardRows={cardRows} />
      </div>
    </div>
  );
};
