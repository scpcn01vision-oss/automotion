// === 可调参数 ===
// DURATION: 180（总帧数，可调；弹性段随 DURATION 等比缩放）
// 色彩: 走纸墨 G 色板（src/_fixtures/Fixtures.tsx）——文字 G.ink / 背景 G.bg / 强调 G.accent
// 功能: 举证
// props: label（顶部主标题）、cardTitle（图表卡标题）、cardSubtitle（图表卡副标题）、bars（柱数组，含 value/label，缺省 DEFAULT_BARS；柱高按 value/maxValue 归一化、数量/柱位自适应）
// === 时间特性 ===
// 策略: 弹刚 ShotTime（整段弹性）
// 刚性（不可压缩）: 无
// 弹性（可伸缩）: 全程可等比缩放（时长适配语音）
// === 适配注意 ===
// 段长不足 60f 时回退原始帧（动画按原速、可能被截断）。
// particle-sand-fill —— 粒子落斗成柱
// 图表卡内 4 根柱，每根柱上方"下雨"：14px 方点错峰坠落（重力加速），触堆积面即停
// + 15% 回弹一下，逐层堆高——堆积高度闭式预解析（第 k 层顶面 = 基线 - (k+1)×粒径，
// 无真碰撞）。各柱错峰 6f 启动；堆满后粒子面淡出换实体柱 + 顶部数值标签弹出。
// 结尾全部粒子条件卸载、只剩实体柱 + 标签，真静止 ≥35f。
// 帧确定性：sin 散列派生每颗出发帧抖动/起点错高，落地帧由高度差闭式反解。
import React from 'react';
import { interpolate, Easing } from 'remotion';
import { G } from '../../_fixtures/Fixtures';
import { FONT_STACK } from '../../_system/typography';

import { useShotFrame } from '../../../engine/useShotFrame';
import type { ShotTime } from '../../../engine/time';

// 时长画像：整段弹性（2026-08-14 精修）
const SHOT_TIME: ShotTime = {
  segments: [{ from: 0, to: 180, mode: 'elastic', minFrames: 0 }],
  minFrames: 0,
};

const AMBER = G.accent;
const frac = (x: number) => x - Math.floor(x);
const rnd = (i: number, salt: number) => frac(Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453);

const CARD = { x: 460, y: 300, w: 1000, h: 560 };
const PLOT_BOTTOM = CARD.y + CARD.h - 70; // 堆积地面（卡内基线）
const GRAIN = 14; // 方点边长（宁大勿小：4px 在 1080p 卡内不可感，加码到 14）
const PER_LAYER = 9; // 每层 9 颗 → 柱宽 126px
const BAR_W = GRAIN * PER_LAYER;
const DROP_FROM = 230; // 距各自落点上方 ~230px 起落
const GRAV = 1.6; // px/f²
const STAGGER = 6; // 各柱错峰启动
const RATE = 0.28; // 颗间出发间隔（帧）——最高柱 216 颗需 ~60f 发完，全局 f120 内收束

const fallTime = (dist: number) => Math.sqrt((2 * dist) / GRAV);
const departOf = (bar: number, i: number) => 8 + bar * STAGGER + i * RATE + rnd(i, bar * 7 + 1) * 1.5;

export interface ParticleSandBar {
  value: number;  // 柱数据值（柱高按 value/maxValue 归一化）
  label?: string; // 顶部标注（缺省显示 value）
}

export interface ParticleSandFillProps {
  label?: string; // 顶部主标题
  cardTitle?: string; // 图表卡标题
  cardSubtitle?: string; // 图表卡副标题
  bars?: ParticleSandBar[];
}

// 缺省柱示例（不传 bars 时的默认画面）
const DEFAULT_BARS: ParticleSandBar[] = [
  { value: 238, label: '238' },
  { value: 336, label: '336' },
  { value: 182, label: '182' },
  { value: 294, label: '294' },
];

const MAX_BAR_H = 340; // 柱高上限（归一化后最大值；保证顶部标签不与卡标题重叠）
const MIN_BAR_H = 24;  // 柱高下限（保证小值柱可见）
const PAD = 90;        // 卡内左右留白（柱位等距计算基准）

export const ParticleSandFill: React.FC<ParticleSandFillProps> = ({
  label = 'FILL',
  cardTitle = '指标概览',
  cardSubtitle = '实时更新',
  bars = DEFAULT_BARS,
}) => {
  const frame = useShotFrame(SHOT_TIME);
  const values = bars.map((b) => b.value);
  const maxVal = Math.max(1, ...values);
  const highlightIdx = bars.length ? values.indexOf(Math.max(...values)) : -1;
  const slotW = bars.length ? (CARD.w - PAD * 2) / bars.length : 0;
  const resolved = bars.map((b, i) => {
    const h = Math.round(Math.max(MIN_BAR_H, Math.min(MAX_BAR_H, (b.value / maxVal) * MAX_BAR_H)));
    return {
      idx: i,
      cx: CARD.x + PAD + slotW * (i + 0.5),
      h,
      label: b.label ?? String(b.value),
      n: Math.round(h / GRAIN) * PER_LAYER,
      isHi: i === highlightIdx,
    };
  });

  return (
    <div style={{ width: 1920, height: 1080, background: G.bg, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 110, width: '100%', textAlign: 'center' }}>
        <div style={{ fontFamily: FONT_STACK, fontWeight: 800, fontSize: 72, color: G.ink, letterSpacing: -1 }}>{label}</div>
      </div>

      {/* 图表卡 */}
      <div style={{
        position: 'absolute', left: CARD.x, top: CARD.y, width: CARD.w, height: CARD.h,
        background: G.card, border: `2px solid ${G.border}`, borderRadius: 14,
        boxSizing: 'border-box', padding: 28, boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      }}>
        <div style={{ fontFamily: FONT_STACK, fontSize: 30, fontWeight: 700, color: G.ink }}>{cardTitle}</div>
        <div style={{ fontFamily: FONT_STACK, fontSize: 20, color: G.mid, marginTop: 6 }}>{cardSubtitle}</div>
      </div>
      {/* 基线 */}
      <div style={{ position: 'absolute', left: CARD.x + 40, top: PLOT_BOTTOM, width: CARD.w - 80, height: 3, background: G.line }} />

      {resolved.map((bar, b) => {
        const left = bar.cx - BAR_W / 2;
        // 末颗落地帧（闭式）：末颗落点在堆顶，坠距仍 ≈DROP_FROM
        const lastLand = departOf(b, bar.n - 1) + fallTime(DROP_FROM);
        const doneAt = lastLand + 7; // 回弹收完 → 开始交接
        const solidOp = interpolate(frame, [doneAt, doneAt + 10], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
        const labelScale = interpolate(frame, [doneAt + 6, doneAt + 18], [0, 1], {
          easing: Easing.out(Easing.back(2.2)),
          extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
        });

        return (
          <React.Fragment key={b}>
            {solidOp > 0 && (
              <div style={{
                position: 'absolute', left, top: PLOT_BOTTOM - bar.h,
                width: BAR_W, height: bar.h, background: bar.isHi ? AMBER : G.bar,
                borderRadius: '6px 6px 0 0', opacity: solidOp,
              }} />
            )}
            {labelScale > 0 && (
              <div style={{
                position: 'absolute', left: bar.cx - 100, top: PLOT_BOTTOM - bar.h - 62, width: 200,
                textAlign: 'center', fontFamily: FONT_STACK, fontWeight: 800,
                fontSize: 46, color: bar.isHi ? AMBER : G.ink,
                whiteSpace: 'nowrap',
                transform: `scale(${labelScale})`,
              }}>
                {bar.label}
              </div>
            )}
            {/* 粒子面：交接完成（solidOp=1）即整体条件卸载 → 真静止 */}
            {solidOp < 1 && Array.from({ length: bar.n }).map((_, i) => {
              const depart = departOf(b, i);
              const age = frame - depart;
              if (age <= 0) return null;
              const layer = Math.floor(i / PER_LAYER);
              const col = i % PER_LAYER;
              const targetTop = PLOT_BOTTOM - (layer + 1) * GRAIN; // 闭式堆积面
              const startTop = targetTop - DROP_FROM - rnd(i, b * 13 + 3) * 70;
              const dist = targetTop - startTop;
              const tLand = fallTime(dist);
              let top: number;
              if (age < tLand) {
                top = startTop + 0.5 * GRAV * age * age;
              } else {
                const ba = age - tLand;
                const bounce = ba < 6 ? Math.sin((ba / 6) * Math.PI) * GRAIN * 2 * 0.15 * (1 + rnd(i, b * 13 + 9)) : 0;
                top = targetTop - bounce;
              }
              const amber = bar.isHi || rnd(i, b * 13 + 7) < 0.18;
              return (
                <div key={i} style={{
                  position: 'absolute', left: left + col * GRAIN + 1, top, width: GRAIN - 2, height: GRAIN - 2,
                  background: amber ? AMBER : G.mid, opacity: 1 - solidOp,
                  borderRadius: 2,
                }} />
              );
            })}
          </React.Fragment>
        );
      })}
    </div>
  );
};
