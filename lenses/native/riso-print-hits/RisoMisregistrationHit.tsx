// === 可调参数 ===
// DURATION: 180（总帧数，可调；弹性段随 DURATION 等比缩放）
// 色彩: 走纸墨 G 色板（src/_fixtures/Fixtures.tsx）——文字 G.ink / 背景 G.bg / 强调 G.accent
// 功能: 宣告,举证
// === 时间特性 ===
// 刚性（不可压缩）: 刚性:节拍4拍,套准72f
// 弹性（可伸缩）: 其余段（入场/过渡/收尾/hold）可等比缩放
// === 适配注意 ===
// 调 DURATION 时只动弹性段 interpolate 关键帧，刚性核心帧区间保持固定帧数。
// 套印错位冲击帧（riso-misregistration-hit）——标题撞停瞬间裂成两份单色"印版"
// （浅灰琥珀版 G.mid + 深墨版 G.ink，mix-blend-mode: multiply 叠加），像 riso 印刷
// 没对准版；两版反向错位（x 为主 y 少量）做衰减震荡 offset = A*cos(ωt)*exp(-t/τ)
// 抖两下，帧 72 啪地硬切回单一正体（套准合一），带 4f scale 1.03→1 脉冲收束。
// 结构：0–19f 空场 hold（只有底部装饰线）；20–28f 标题从右画外 Easing.in(cubic)
// 撞入屏心（帧 28 命中）；28–71f 双版错位震荡；72–75f 套准脉冲；76–119f 真静止 44f。
import React from 'react';
import { interpolate, Easing } from 'remotion';
import { G } from '../../_fixtures/Fixtures';
import { FONT_STACK } from '../../_system/typography';

import { useShotFrame } from '../../../engine/useShotFrame';
import type { ShotTime } from '../../../engine/time';

// 时长画像（保守兜底：整段弹性；精修阶段按镜头关键帧画像刚弹分段）
const SHOT_TIME: ShotTime = {
  segments: [{ from: 0, to: 180, mode: 'elastic', minFrames: 0 }],
  minFrames: 0,
};

const HIT = 28; // 撞停命中帧
const SNAP = 72; // 套准合一帧
const AX = 16; // 单版 x 错位振幅（两版反向 → 总分离 ~32px，肉眼明显）
const AY = 7; // 单版 y 错位振幅（少量，更像没对准版）
const OMEGA = (2 * Math.PI) / 18; // 震荡周期 18f，44f 内抖两下半
const TAU = 60; // 缓衰减：帧 72 前仍余 ~14px 总分离，被"啪地"硬切归零

// 与正体标题同字形的可调色标题（错位印版需要单色副本）
const Plate: React.FC<{ color: string; dx: number; dy: number; text: string }> = ({ color, dx, dy, text }) => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transform: `translate(${dx}px, ${dy}px)`,
      mixBlendMode: 'multiply',
    }}
  >
    <div
      style={{
        fontFamily: FONT_STACK,
        fontWeight: 800,
        fontSize: 200,
        color,
        letterSpacing: -1,
        whiteSpace: 'nowrap',
      }}
    >
      {text}
    </div>
  </div>
);

export interface RisoMisregistrationHitProps {
  text?: string;
}

export const RisoMisregistrationHit: React.FC<RisoMisregistrationHitProps> = ({ text = 'IMPACT' }) => {
  const frame = useShotFrame(SHOT_TIME);

  // 阶段判定
  const entering = frame >= 20 && frame < HIT; // 撞入
  const split = frame >= HIT && frame < SNAP; // 双版错位震荡
  const showSingle = frame < HIT || frame >= SNAP; // 正体（画外/撞入/套准后）

  // 撞入位移：右画外 1400px → 0，8f Easing.in(cubic)（加速撞停）
  const slideX = interpolate(frame, [20, HIT], [1400, 0], {
    easing: Easing.in(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // 错位震荡包络：t 自命中起，衰减余弦（帧 72 前仍有可见残余，硬切归零成"啪"）
  const t = frame - HIT;
  const m = split ? Math.cos(OMEGA * t) * Math.exp(-t / TAU) : 0;
  const dx = AX * m;
  const dy = AY * m;

  // 套准合一脉冲：帧 72 起 4f scale 1.03 → 1，之后精确 1（保证结尾真静止）
  const pulse =
    frame >= SNAP && frame < SNAP + 4 ? 1 + 0.03 * (1 - (frame - SNAP) / 4) : 1;

  return (
    <div
      style={{
        width: 1920,
        height: 1080,
        background: G.bg,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* 底部装饰线：全程静止的布景锚点 */}
      <div
        style={{
          position: 'absolute',
          left: 510,
          top: 740,
          width: 900,
          height: 6,
          borderRadius: 3,
          background: G.bar,
        }}
      />

      {/* 正体：画外等待 / 撞入 / 套准后（撞入前 frame<20 时在画外，视觉等同空场） */}
      {showSingle && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: `translateX(${entering || frame < 20 ? slideX : 0}px) scale(${pulse})`,
            transformOrigin: 'center center',
          }}
        >
          <div style={{ fontFamily: FONT_STACK, fontWeight: 800, fontSize: 200, color: G.ink, letterSpacing: -1, textShadow: '2px 2px 8px rgba(211,146,60,0.28)' }}>
            {text}
          </div>
        </div>
      )}

      {/* 双版错位：浅灰版与深墨版反向偏移，multiply 叠加出"重影套印" */}
      {split && (
        <>
          <Plate color={G.mid} dx={-dx} dy={dy} text={text} />
          <Plate color={G.ink} dx={dx} dy={-dy} text={text} />
        </>
      )}
    </div>
  );
};
