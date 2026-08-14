// === 可调参数 ===
// DURATION: 180（总帧数，可调；弹性段随 DURATION 等比缩放）
// 色彩: 走纸墨 G 色板（src/_fixtures/Fixtures.tsx）——文字 G.ink / 背景 G.bg / 强调 G.accent
// 功能: 钩子,宣告
// props: segments（笔画段坐标数组，默认内置 SHIP 16 段，可自定义字形）
// === 时间特性 ===
// 策略: 弹刚 ShotTime（整段弹性）
// 刚性（不可压缩）: 无
// 弹性（可伸缩）: 全程可等比缩放（时长适配语音）
// === 适配注意 ===
// 段长不足 60f 时回退原始帧（动画按原速、可能被截断）。
// stroke-segment-build —— 断笔成字（《异形》式）
// "SHIP" 拆成 16 段互不相连的粗线段，按乱序表逐段点亮。
// 前 70%（11 段）读不出字，最后 3 段落位瞬间突然可读；
// 末段落位帧整字轻微 scale 脉冲（1→1.06→1）。
// 每段入场：opacity 0→1 + 沿笔画方向 12px 滑入（out 缓动），6f。
// f0–14 静置空场；末段落位于 f104，脉冲至 f112，真静止 ≥38f（150f 总长）。
import React from 'react';
import { interpolate, Easing } from 'remotion';
import { G } from '../../_fixtures/Fixtures';

import { useShotFrame } from '../../../engine/useShotFrame';
import type { ShotTime } from '../../../engine/time';

// 时长画像：整段弹性（2026-08-14 精修）
const SHOT_TIME: ShotTime = {
  segments: [{ from: 0, to: 180, mode: 'elastic', minFrames: 0 }],
  minFrames: 0,
};

// "SHIP" 手工笔画段。坐标系：每字 200 宽、320 高，字间距 60。
// 段 = {x1,y1,x2,y2}，线宽 44，方形端帽（不连续感更强）。
type Seg = { x1: number; y1: number; x2: number; y2: number };

const K = 200; // 字宽
const H = 320; // 字高
const ADV = K + 60;

// S：4 段（上横、左上竖、中横、右下竖+下横 → 拆成 5 也行，取 4）
// H：3 段（左竖、右竖、中横）
// I：3 段（上横、中竖、下横）
// P：4 段（左竖、上横、右短竖、中横）—— 共 14 段；S 再拆 2 段成 16
const SEGS: Seg[] = [
  // S (x offset 0) —— 6 段
  { x1: 30, y1: 22, x2: 185, y2: 22 },     // 0 上横
  { x1: 22, y1: 44, x2: 22, y2: 130 },     // 1 左上竖
  { x1: 30, y1: 152, x2: 175, y2: 152 },   // 2 中横
  { x1: 178, y1: 174, x2: 178, y2: 276 },  // 3 右下竖
  { x1: 15, y1: 298, x2: 170, y2: 298 },   // 4 下横
  { x1: 22, y1: 240, x2: 22, y2: 276 },    // 5 左下小竖（S 尾钩）
  // H (x offset ADV) —— 3 段
  { x1: ADV + 22, y1: 22, x2: ADV + 22, y2: 298 },   // 6 左竖
  { x1: ADV + 178, y1: 22, x2: ADV + 178, y2: 298 }, // 7 右竖
  { x1: ADV + 44, y1: 160, x2: ADV + 156, y2: 160 }, // 8 中横
  // I (x offset ADV*2) —— 3 段
  { x1: ADV * 2 + 40, y1: 22, x2: ADV * 2 + 160, y2: 22 },   // 9 上横
  { x1: ADV * 2 + 100, y1: 44, x2: ADV * 2 + 100, y2: 276 }, // 10 中竖
  { x1: ADV * 2 + 40, y1: 298, x2: ADV * 2 + 160, y2: 298 }, // 11 下横
  // P (x offset ADV*3) —— 4 段
  { x1: ADV * 3 + 22, y1: 22, x2: ADV * 3 + 22, y2: 298 },   // 12 左竖
  { x1: ADV * 3 + 44, y1: 22, x2: ADV * 3 + 165, y2: 22 },   // 13 上横
  { x1: ADV * 3 + 178, y1: 44, x2: ADV * 3 + 178, y2: 140 }, // 14 右短竖
  { x1: ADV * 3 + 44, y1: 162, x2: ADV * 3 + 165, y2: 162 }, // 15 中横
];

// 乱序点亮表：刻意打散——前 13 段跨字乱跳（读不出），
// 最后 3 段（8 中横 / 10 I 竖 / 12 P 左竖）落位瞬间补全可读性。
const ORDER = [3, 9, 6, 15, 1, 11, 14, 4, 0, 7, 13, 2, 5, 8, 10, 12];

const FIRST = 14; // 首段起始帧
const STEP = 6; // 段间隔
const SEG_IN = 6; // 单段入场时长
const LAST_LAND = FIRST + 15 * STEP + SEG_IN; // = 110，末段落位
const PULSE_END = LAST_LAND + 8;

const WORD_W = ADV * 3 + K; // 980
const OX = (1920 - WORD_W) / 2;
const OY = (1080 - H) / 2 + 20;

export interface StrokeSegmentBuildProps {
  segments?: Seg[];
}

export const StrokeSegmentBuild: React.FC<StrokeSegmentBuildProps> = ({
  segments = SEGS,
}) => {
  const frame = useShotFrame(SHOT_TIME);

  // 末段落位：整字脉冲 1 → 1.06 → 1（8f）
  const pulse = interpolate(
    frame,
    [LAST_LAND, LAST_LAND + 3, PULSE_END],
    [1, 1.06, 1],
    { easing: Easing.out(Easing.cubic), extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  return (
    <div style={{ width: 1920, height: 1080, background: G.bg, overflow: 'hidden', position: 'relative' }}>
      <svg
        width={1920}
        height={1080}
        style={{ position: 'absolute', left: 0, top: 0, transform: `scale(${pulse})`, transformOrigin: '50% 55%' }}
      >
        {segments.map((seg, i) => {
          const rank = ORDER.indexOf(i);
          // 自定义段超出内置顺序表时按序号顺序点亮（不崩）
          const start = rank >= 0 ? FIRST + rank * STEP : FIRST + i * STEP;
          if (frame < start) return null; // 未开始的段不渲染
          const t = interpolate(frame, [start, start + SEG_IN], [0, 1], {
            easing: Easing.out(Easing.cubic),
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          // 沿笔画方向滑入 12px
          const dx = seg.x2 - seg.x1;
          const dy = seg.y2 - seg.y1;
          const len = Math.hypot(dx, dy) || 1;
          const slide = 12 * (1 - t);
          const ox = (-dx / len) * slide;
          const oy = (-dy / len) * slide;
          return (
            <line
              key={i}
              x1={OX + seg.x1 + ox}
              y1={OY + seg.y1 + oy}
              x2={OX + seg.x2 + ox}
              y2={OY + seg.y2 + oy}
              stroke={G.ink}
              strokeWidth={44}
              strokeLinecap="butt"
              opacity={t}
            />
          );
        })}
      </svg>
    </div>
  );
};
