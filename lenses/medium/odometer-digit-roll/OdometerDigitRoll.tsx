// === 可调参数 ===
// DURATION: 180（总帧数，可调；弹性段随 DURATION 等比缩放）
// 色彩: 走纸墨 G 色板（src/_fixtures/Fixtures.tsx）——文字 G.ink / 背景 G.bg / 强调 G.accent
// 功能: 举证,宣告
// === 时间特性 ===
// 刚性（不可压缩）: 无（全程弹性）
// 弹性（可伸缩）: 全程可等比缩放（时长适配语音）
// === 适配注意 ===
// 调 DURATION 时只动弹性段 interpolate 关键帧，刚性核心帧区间保持固定帧数。
// 里程表数字滚动大字报（odometer-digit-roll）——声画钩子 / Vercel Ship 指标段。
// 全屏巨号 "99.98%"（190px fw800 tabular-nums），四个数位各是一条 0–9 纵向
// strip（overflow:hidden 数位盒），高速滚动后逐位停稳：位 i 在 20+i*7f 开始
// 减速（Easing.out(cubic)），过冲半格再 6f 弹回锁定。滚动期每位叠 2 个错帧
// 残影副本（translateY ±行高*0.5，opacity 0.25/0.12），按帧速度门控，停稳即摘。
// 小数点与 % 不滚动，一直驻场。
// 关键帧：0–20 四位全速滚（0.85 行/帧）→ 20/27/34/41 逐位开始减速（各 16f
// 减速 + 6f 回弹，锁定于 42/49/56/63）→ 63–71 整体加深脉冲（ink→#000→ink，
// 附 1.035 微缩放加码）→ 66–84 下方标签条淡入 → 84–150 全静止（66f ≥45f）。
import React from 'react';
import { interpolate, interpolateColors, Easing } from 'remotion';
import { G } from '../../_fixtures/Fixtures';
import { FONT_STACK } from '../../_system/typography';
import { useShotFrame } from '../../../engine/useShotFrame';
import type { ShotTime } from '../../../engine/time';

// 时长画像（lens-timings 无此镜头；按文件头「全程弹性」+ 关键帧 ~66 标）
const SHOT_TIME: ShotTime = {
  segments: [{ from: 0, to: 180, mode: 'elastic', minFrames: 66 }],
  minFrames: 66,
};

const ROW = 210; // 数位行高（overflow 盒高）
const DW = 126; // 数位盒宽
const FS = 190; // 字号
const SPIN = 0.85; // 高速滚动速度：行/帧

// 位 i 的 strip 位置（单位：行，连续值）。纯帧函数，天然确定性。
const posAt = (f: number, i: number, digits: number[]): number => {
  const d = digits[i];
  const s = 20 + i * 7; // 开始减速帧
  const p0 = SPIN * s;
  // 最小再走 6 行后，落在个位 = d 的最近整数位置
  const T = Math.ceil((p0 + 6 - d) / 10) * 10 + d;
  if (f < s) return SPIN * Math.max(f, 0);
  if (f < s + 16)
    return interpolate(f, [s, s + 16], [p0, T + 0.5], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.cubic),
    });
  if (f < s + 22)
    return interpolate(f, [s + 16, s + 22], [T + 0.5, T], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.cubic),
    });
  return T;
};

// 一条 0–9 纵列 strip（两轮 20 格，容过冲跨界）
const Strip: React.FC<{ pos: number; color: string; opacity?: number; dy?: number }> = ({
  pos,
  color,
  opacity = 1,
  dy = 0,
}) => (
  <div
    style={{
      position: 'absolute',
      left: 0,
      top: 0,
      width: DW,
      transform: `translateY(${-(pos % 10) * ROW + dy}px)`,
      opacity,
    }}
  >
    {Array.from({ length: 20 }).map((_, k) => (
      <div
        key={k}
        style={{
          width: DW,
          height: ROW,
          lineHeight: `${ROW}px`,
          textAlign: 'center',
          fontSize: FS,
          fontWeight: 800,
          fontVariantNumeric: 'tabular-nums',
          color,
        }}
      >
        {k % 10}
      </div>
    ))}
  </div>
);

// 单个数位盒：本体 strip + 滚动期 2 个错帧残影（速度门控，停稳即摘）
const DigitReel: React.FC<{ frame: number; i: number; color: string; digits: number[] }> = ({ frame, i, color, digits }) => {
  const pos = posAt(frame, i, digits);
  const speed = Math.abs(pos - posAt(frame - 1, i, digits));
  const gate = interpolate(speed, [0.06, 0.5], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div style={{ position: 'relative', width: DW, height: ROW, overflow: 'hidden' }}>
      {gate > 0.001 && (
        <>
          <Strip pos={pos} color={color} opacity={0.25 * gate} dy={ROW * 0.5} />
          <Strip pos={pos} color={color} opacity={0.12 * gate} dy={-ROW * 0.5} />
        </>
      )}
      <Strip pos={pos} color={color} />
    </div>
  );
};

// 不滚动的静态字符（小数点 / %），一直驻场
const StaticGlyph: React.FC<{ ch: string; color: string; w?: number }> = ({ ch, color, w }) => (
  <div
    style={{
      width: w,
      height: ROW,
      lineHeight: `${ROW}px`,
      textAlign: 'center',
      fontSize: FS,
      fontWeight: 800,
      fontVariantNumeric: 'tabular-nums',
      color,
    }}
  >
    {ch}
  </div>
);

export interface OdometerDigitRollProps {
  value?: string;
  label?: string;
  sublabel?: string;
}

export const OdometerDigitRoll: React.FC<OdometerDigitRollProps> = ({
  value = '99.98%',
  label = 'TARGET METRIC',
  sublabel = 'ACHIEVED',
}) => {
  const frame = useShotFrame(SHOT_TIME);
  // 目标数字解析：数字位滚动，非数字（./%/空格）驻场
  const chars = value.split('');
  const digits = chars.filter((c) => /\d/.test(c)).map(Number);
  let digitIdx = 0;
  // 全位锁定于 63f：整体加深脉冲 ink→#000→ink（8f），附微缩放加码可感性
  const inkNow = interpolateColors(frame, [63, 67, 71], [G.ink, '#000000', G.ink]);
  const pulseScale = interpolate(frame, [63, 67, 71], [1, 1.035, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.quad),
  });
  const labelOp = interpolate(frame, [66, 84], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad),
  });

  return (
    <div style={{ width: 1920, height: 1080, background: G.bg, position: 'relative', overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 400,
          width: 1920,
          display: 'flex',
          justifyContent: 'center',
          fontFamily: FONT_STACK,
          transform: `scale(${pulseScale})`,
          transformOrigin: '960px 105px',
        }}
      >
        {chars.map((ch, k) =>
          /\d/.test(ch) ? (
            <DigitReel key={k} frame={frame} i={digitIdx++} color={inkNow} digits={digits} />
          ) : (
            <StaticGlyph key={k} ch={ch} color={inkNow} w={ch === '.' ? 70 : undefined} />
          ),
        )}
      </div>
      {/* 下方标签：全部锁定后淡入 */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 680,
          width: 1920,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 10,
          opacity: labelOp,
        }}
      >
        {label ? <div style={{ fontSize: 34, fontWeight: 700, color: G.ink, letterSpacing: 2 }}>{label}</div> : null}
        {sublabel ? <div style={{ fontSize: 20, color: G.mid, letterSpacing: 3 }}>{sublabel}</div> : null}
      </div>
    </div>
  );
};
