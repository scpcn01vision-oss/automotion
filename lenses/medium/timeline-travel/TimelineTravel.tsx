// === 可调参数 ===
// DURATION: 180（总帧数，可调；弹性段随 DURATION 等比缩放）
// 色彩: 走纸墨 G 色板（src/_fixtures/Fixtures.tsx）——文字 G.ink / 背景 G.bg / 强调 G.accent
// 功能: 展开,举证
// props: title（顶部大标题）、ticks（刻度数组，含 label/cardTitle/cardValue 内容字段，位置自动等距，缺省 DEFAULT_TICKS）
// === 时间特性 ===
// 策略: 弹刚 ShotTime（整段弹性）
// 刚性（不可压缩）: 无
// 弹性（可伸缩）: 全程可等比缩放（时长适配语音）
// === 适配注意 ===
// 段长不足 60f 时回退原始帧（动画按原速、可能被截断）。
// timeline-travel —— 时间轴横移（《反恐王国》式）
// 镜头沿水平刻度轴加速横移，v1.0/v2.0/v3.0/Today 四个刻度依次掠过，
// 每过刻度对应 Card 从刻度线 spring 过冲弹立 + 短停，镜头不停；
// 末刻度 4f 急停 + 推近 1.28×。世界层只动 translateX/scale。
// f0–12 初始静置；f118 起真静止 ≥42f（160f 总长）。
import React from 'react';
import { interpolate, Easing, spring } from 'remotion';
import { G } from '../../_fixtures/Fixtures';
import { FONT_STACK } from '../../_system/typography';

import { useShotFrame } from '../../../engine/useShotFrame';
import type { ShotTime } from '../../../engine/time';

// 时长画像：整段弹性（2026-08-14 精修）
const SHOT_TIME: ShotTime = {
  segments: [{ from: 0, to: 180, mode: 'elastic', minFrames: 0 }],
  minFrames: 0,
};

const W = 1920;
const AXIS_Y = 700;
const TICK_GAP = 1400; // 刻度间距（世界坐标）
const MINOR_STEP = TICK_GAP / 5; // 次刻度步长

// 刻度实体：画面里的刻度 + 弹立的卡片，归 ticks 参数化（缺省 DEFAULT_TICKS 保证无参数可渲染）
export interface TimelineTick {
  label: string;        // 刻度标签（轴下方文字）
  cardTitle?: string;   // 卡片上行小标题（可省略）
  cardValue?: string;   // 卡片下行强调值（可省略）
}

export interface TimelineTravelProps {
  title?: string;
  ticks?: TimelineTick[];
}

// 缺省刻度示例（不传 ticks 时的默认画面）
const DEFAULT_TICKS: TimelineTick[] = [
  { label: 'v1.0', cardTitle: '阶段 1', cardValue: 'Day 7' },
  { label: 'v2.0', cardTitle: '阶段 2', cardValue: 'Day 14' },
  { label: 'v3.0', cardTitle: '阶段 3', cardValue: 'Day 21' },
  { label: 'Today', cardTitle: '阶段 4', cardValue: 'Day 28' },
];

const TRAVEL_START = 12;
const TRAVEL_END = 104; // 急停帧
const ZOOM_END = 114;

// 相机 X：in-out 但前段慢后段快（poly(3) in 为主，末端 out 急收）
// 用两段拼：0–0.82 加速段（Easing.in(poly(2.2))），0.82–1 急刹段
const camXAt = (f: number, startX: number, endX: number): number => {
  const t = interpolate(f, [TRAVEL_START, TRAVEL_END], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  // 加速→巡航→急刹：分段缓动，前 15% 缓起，中段近匀加速冲刺，末 12% 急收
  const eased = interpolate(t, [0, 0.15, 0.88, 1], [0, 0.055, 0.9, 1], {
    easing: Easing.inOut(Easing.quad),
  });
  return startX + eased * (endX - startX);
};

// 每张卡的弹立帧：相机中心扫过该刻度的时刻（数值上预先求好，避免逐帧求逆）
// 通过 camXAt 反查：找到 camX == tick.x - 960 的帧
const popFrameOf = (tickX: number, startX: number, endX: number, firstX: number): number => {
  for (let f = TRAVEL_START; f <= TRAVEL_END; f++) {
    if (camXAt(f, startX, endX) >= startX + (tickX - firstX)) return f;
  }
  return TRAVEL_END;
};

const CARD_W = 360;
const CARD_H = 240;

const TickStop: React.FC<{ frame: number; tick: TimelineTick; startX: number; endX: number; firstX: number }> = ({ frame, tick, startX, endX, firstX }) => {
  const pop = popFrameOf(tick.x!, startX, endX, firstX) - 6; // 提前 6f 起弹，掠过时正好立起
  const s = spring({
    frame: frame - pop,
    fps: 30,
    config: { damping: 11, stiffness: 160, mass: 0.9 }, // 明显过冲
    durationInFrames: 26,
  });
  const appeared = frame >= pop;

  return (
    <div style={{ position: 'absolute', left: tick.x, top: 0 }}>
      {/* 刻度竖线 */}
      <div style={{ position: 'absolute', left: -3, top: AXIS_Y - 28, width: 6, height: 56, background: G.ink, borderRadius: 3 }} />
      {/* 刻度标签 */}
      <div style={{ position: 'absolute', left: -80, top: AXIS_Y + 44, width: 160, textAlign: 'center', fontFamily: FONT_STACK, fontWeight: 800, fontSize: 40, color: G.ink }}>
        {tick.label}
      </div>
      {/* 卡片从刻度线弹立：以底边为轴 scaleY 0→1（带过冲），伴随上移 */}
      {appeared && (
        <div
          style={{
            position: 'absolute',
            left: -CARD_W / 2,
            top: AXIS_Y - 36 - CARD_H,
            transform: `scaleY(${s}) scaleX(${0.6 + 0.4 * s})`,
            transformOrigin: '50% 100%',
            opacity: Math.min(1, s * 2),
          }}
        >
          <div
            style={{
              width: CARD_W,
              height: CARD_H,
              background: G.card,
              border: `2px solid ${G.border}`,
              borderRadius: 14,
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
            }}
          >
            {/* 卡片内容：字段各自独立可选——只填一个则单行垂直居中，不为缺省字段留占位 */}
            {tick.cardTitle && (
              <div style={{ fontFamily: FONT_STACK, fontSize: 22, fontWeight: 800, color: G.ink }}>
                {tick.cardTitle}
              </div>
            )}
            {tick.cardValue && (
              <div style={{ fontFamily: FONT_STACK, fontSize: 30, fontWeight: 800, color: G.accent }}>
                {tick.cardValue}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const TimelineTravel: React.FC<TimelineTravelProps> = ({
  title = 'TIMELINE',
  ticks = DEFAULT_TICKS,
}) => {
  const frame = useShotFrame(SHOT_TIME);
  // 刻度位置自动等距（不暴露给使用者：首刻度恒 960 居中起点，往后 +TICK_GAP）
  const resolvedTicks = ticks.map((t, i) => ({ ...t, x: 960 + i * TICK_GAP }));
  const firstX = resolvedTicks[0]?.x ?? 960;
  const lastX = resolvedTicks[resolvedTicks.length - 1]?.x ?? 960;
  const startX = firstX - 960; // 相机起点：让首个刻度居中
  const endX = lastX - 960;    // 相机终点：让末个刻度居中
  const worldW = lastX + 960;
  const camX = camXAt(frame, startX, endX);

  // 急停后推近末刻度：scale 1 → 1.28，中心对准 Today 刻度
  const zoom = interpolate(frame, [TRAVEL_END, ZOOM_END], [1, 1.28], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div style={{ width: W, height: 1080, background: G.bg, overflow: 'hidden', position: 'relative' }}>
      {/* 推近层：以画面中央偏下（末刻度落点）为原点放大 */}
      <div style={{ width: W, height: 1080, transform: `scale(${zoom})`, transformOrigin: '50% 62%' }}>
        {/* 世界层：唯一横移的容器 */}
        <div style={{ position: 'absolute', left: 0, top: 0, width: worldW, height: 1080, transform: `translateX(${-camX}px)` }}>
          {/* 主轴线 */}
          <div style={{ position: 'absolute', left: 200, top: AXIS_Y - 3, width: worldW - 400, height: 6, background: G.bar, borderRadius: 3 }} />
          {/* 次刻度（小点，增强速度感） */}
          {Array.from({ length: Math.max(0, Math.ceil((worldW - firstX) / MINOR_STEP)) }).map((_, i) => (
            <div key={i} style={{ position: 'absolute', left: firstX + i * MINOR_STEP - 2, top: AXIS_Y - 12, width: 4, height: 24, background: G.bar, borderRadius: 2 }} />
          ))}
          {resolvedTicks.map((t, i) => (
            <TickStop key={i} frame={frame} tick={t} startX={startX} endX={endX} firstX={firstX} />
          ))}
        </div>
      </div>
      <div style={{ position: 'absolute', top: 90, width: '100%', textAlign: 'center' }}>
        <div style={{ fontFamily: FONT_STACK, fontWeight: 800, fontSize: 64, color: G.ink, letterSpacing: -1 }}>{title}</div>
      </div>
    </div>
  );
};
