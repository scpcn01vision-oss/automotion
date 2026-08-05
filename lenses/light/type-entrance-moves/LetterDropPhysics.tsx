// === 可调参数 ===
// DURATION: 180（总帧数，可调；弹性段随 DURATION 等比缩放）
// 色彩: 走纸墨 G 色板（src/_fixtures/Fixtures.tsx）——文字 G.ink / 背景 G.bg / 强调 G.accent
// 功能: 钩子,宣告
// props: word（坠落堆积的字标）
// === 时间特性 ===
// 刚性（不可压缩）: 刚性:锁定闪2f
// 弹性（可伸缩）: 其余段（入场/过渡/收尾/hold）可等比缩放
// === 适配注意 ===
// 调 DURATION 时只动弹性段 interpolate 关键帧，刚性核心帧区间保持固定帧数。
// 字符坠落堆积（letter-drop-physics）——FallingLetterAnimation。
// "GRAVITY" 7 字符各自绝对定位，第 i 字符从帧 10+i*5 起下落：
// ① 重力加速 y = D*(t/24)^2 掉 720px 到基线（地板线可见）；
// ② 落地后 2 次衰减弹跳（高度 30% / 9%，抛物线 4u(1-u) 拼段），
//    落地瞬间 rotate 到 seed hash ±6° 小歪角并保持；
// ③ 帧 110 一拍：6f ease-out 全体齐整回正（rotate→0、偏移→0、scale 1.06→1），
//    帧 116–150 真静止（≥25f）收尾。
import React from 'react';
import { useCurrentFrame, Easing } from 'remotion';
import { G } from '../../_fixtures/Fixtures';

// 确定性伪随机
const h = (n: number) => {
  const s = Math.sin(n * 127.3) * 43758.5453;
  return s - Math.floor(s);
};

const SLOT_W = 150; // 每字符槽宽
const FONT = 140;
const REST_TOP = 452; // 字符落定后的 top
const FLOOR_Y = REST_TOP + 152; // 地板线（视觉基线）

const DROP = 720; // 下落距离
const T_FALL = 24; // 落到基线用时
const T_B1 = 16; // 第一次弹跳时长（高 30%）
const T_B2 = 8; // 第二次弹跳时长（高 9%）
const SNAP = 110; // 齐整回正的一拍
const SNAP_DUR = 6;

const easeOutCubic = Easing.out(Easing.cubic);
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

// 单字符纵向位移（相对基线，负 = 在上方）
const dropY = (t: number): number => {
  if (t <= 0) return -DROP;
  if (t < T_FALL) return -DROP + DROP * (t / T_FALL) ** 2; // 重力加速
  if (t < T_FALL + T_B1) {
    const u = (t - T_FALL) / T_B1;
    return -DROP * 0.3 * 4 * u * (1 - u); // 弹跳 1：30%
  }
  if (t < T_FALL + T_B1 + T_B2) {
    const u = (t - T_FALL - T_B1) / T_B2;
    return -DROP * 0.09 * 4 * u * (1 - u); // 弹跳 2：9%
  }
  return 0;
};

export interface LetterDropPhysicsProps {
  word?: string;
}

export const LetterDropPhysics: React.FC<LetterDropPhysicsProps> = ({
  word = 'GRAVITY',
}) => {
  const frame = useCurrentFrame();
  const wordW = word.length * SLOT_W;
  const left = (1920 - wordW) / 2;
  // 帧 110 起的齐整回正进度
  const snap = easeOutCubic(clamp01((frame - SNAP) / SNAP_DUR));

  return (
    <div style={{ width: 1920, height: 1080, background: G.bg, overflow: 'hidden', position: 'relative' }}>
      {/* 地板线：字符落点的视觉基线 */}
      <div style={{ position: 'absolute', left: left - 60, top: FLOOR_Y, width: wordW + 120, height: 6, background: G.bar, borderRadius: 3 }} />

      {word.split('').map((ch, i) => {
        const start = 10 + i * 5;
        const t = frame - start;
        const y = dropY(t);
        // 落地瞬间歪到 seed 小角度（±6°），落地前为 0
        const tiltTarget = (h(i + 1) - 0.5) * 12;
        const landP = clamp01((t - T_FALL) / 6);
        const restJitter = (h(i + 11) - 0.5) * 10; // 落定后的 ±5px 竖向错位
        // snap 一拍：歪角与错位齐整归零，scale 1.06→1 脉冲
        const rot = tiltTarget * landP * (1 - snap);
        const jitter = restJitter * landP * (1 - snap);
        const scale = frame < SNAP ? 1 : 1 + 0.06 * (1 - snap);
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: left + i * SLOT_W,
              top: REST_TOP,
              width: SLOT_W,
              height: FONT,
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              transform: `translateY(${y + jitter}px) rotate(${rot}deg) scale(${scale})`,
              transformOrigin: '50% 100%',
              fontFamily: 'Helvetica, Arial, sans-serif',
              fontWeight: 800,
              fontSize: FONT,
              lineHeight: 1,
              color: G.ink,
            }}
          >
            {ch}
          </div>
        );
      })}
    </div>
  );
};
