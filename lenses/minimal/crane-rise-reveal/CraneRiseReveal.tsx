// === 可调参数 ===
// DURATION: 180（总帧数，可调；弹性段随 DURATION 等比缩放）
// 色彩: 走纸墨 G 色板（src/_fixtures/Fixtures.tsx）——文字 G.ink / 背景 G.bg / 强调 G.accent
// 功能: 展开
// props: rows（内容行列表，默认 5 行，行脉冲按行数自适应）
// === 时间特性 ===
// 策略: 弹刚 ShotTime（整段弹性）
// 刚性（不可压缩）: 无
// 弹性（可伸缩）: 全程可等比缩放（时长适配语音）
// === 适配注意 ===
// 段长不足 60f 时回退原始帧（动画按原速、可能被截断）。
// 升降臂拉升揭示（crane-rise-reveal）——crane shot。
// 世界 = 内容行面板（默认 5 行列表）。相机 transform-origin 左上，联动公式：
// translate = 屏幕中心 - 对准点*scale（对准点始终落在屏幕中心）。
// 帧 0–20 hold 在底行特写（scale 3.2，对准第 5 行图标+长条）；
// 帧 20–120 scale 3.2→1 + 对准点 (520,958)→(960,540)，Easing.out(quad) 减速升起；
// 视野上缘每越过一行顶边，该行深色脉冲一拍（4f 起 18f 落）读作"涌入"；帧 120–150 满幅真静止。
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

const HOLD = 20; // 开场特写 hold
const MOVE_END = 120; // 运镜结束，此后真静止
const ease = Easing.out(Easing.quad);

const PANEL_W = 1400;
const PANEL_PAD = 56;
const ROW_H = 96;
const rowTop = (i: number, n: number) => {
  const panelH = PANEL_PAD * 2 + n * ROW_H;
  return (1080 - panelH) / 2 + PANEL_PAD + i * ROW_H;
};

// 起点对准最后一行中心
const F0 = { x: 520, y: rowTop(4, 5) + ROW_H / 2 };
const F1 = { x: 960, y: 540 }; // 终点对准整页中心
const S0 = 3.2;

const camAt = (frame: number) => {
  const p = Math.min(1, Math.max(0, (frame - HOLD) / (MOVE_END - HOLD)));
  const e = ease(p);
  const s = S0 + (1 - S0) * e;
  const fx = F0.x + (F1.x - F0.x) * e;
  const fy = F0.y + (F1.y - F0.y) * e;
  return { s, tx: 960 - fx * s, ty: 540 - fy * s, visTop: fy - 540 / s };
};

export interface CraneRiseRevealProps {
  rows?: { label: string; value: string }[];
}

export const CraneRiseReveal: React.FC<CraneRiseRevealProps> = ({
  rows = [
    { label: '指标一', value: '+18%' },
    { label: '指标二', value: '2.1×' },
    { label: '指标三', value: '96.4%' },
    { label: '节点', value: '4/4' },
    { label: '可用性', value: '99.98%' },
  ],
}) => {
  const frame = useShotFrame(SHOT_TIME);
  const { s, tx, ty } = camAt(frame);
  // 每行脉冲触发帧：视野上缘首次越过该行顶边（底行开场已在画内 → 运动一起步即触发）
  const triggers = Array.from({ length: rows.length }, (_, i) => {
    for (let f = HOLD; f <= MOVE_END; f++) {
      if (camAt(f).visTop <= rowTop(i, rows.length) + 1) return f;
    }
    return MOVE_END;
  });
  const panelLeft = (1920 - PANEL_W) / 2;
  const panelTop = (1080 - (PANEL_PAD * 2 + rows.length * ROW_H)) / 2;

  return (
    <div
      style={{
        width: 1920,
        height: 1080,
        background: G.bg,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'absolute',
          width: 1920,
          height: 1080,
          transformOrigin: '0 0',
          transform: `translate(${tx}px, ${ty}px) scale(${s})`,
        }}
      >
        {/* 内容行面板 */}
        <div
          style={{
            position: 'absolute',
            left: panelLeft,
            top: panelTop,
            width: PANEL_W,
            background: G.card,
            border: `2px solid ${G.border}`,
            borderRadius: 20,
            padding: `${PANEL_PAD}px`,
            boxSizing: 'border-box',
          }}
        >
          {rows.map((r, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                height: ROW_H,
                borderBottom: i < rows.length - 1 ? `1px solid ${G.line}` : 'none',
              }}
            >
              <span style={{ fontFamily: FONT_STACK, fontSize: 36, fontWeight: 600, color: G.ink }}>
                {r.label}
              </span>
              <span style={{ marginLeft: 'auto', fontFamily: FONT_STACK, fontSize: 38, fontWeight: 800, color: G.accent }}>
                {r.value}
              </span>
            </div>
          ))}
        </div>
        {triggers.map((t, i) => {
          const op = interpolate(frame, [t, t + 4, t + 22], [0, 0.22, 0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          if (op <= 0.001) return null;
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: panelLeft,
                top: rowTop(i, rows.length),
                width: PANEL_W,
                height: ROW_H,
                borderRadius: 14,
                background: G.ink,
                opacity: op,
              }}
            />
          );
        })}
      </div>
    </div>
  );
};
