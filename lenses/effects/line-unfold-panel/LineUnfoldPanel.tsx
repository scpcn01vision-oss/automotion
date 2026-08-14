// === 可调参数 ===
// DURATION: 180（总帧数，可调；弹性段随 DURATION 等比缩放）
// 功能: 展开
// 描述: 线展开成面板——一线自绘展开为面板
// 色彩: 走纸墨 G 色板（src/_fixtures/Fixtures.tsx）——文字 G.ink / 背景 G.bg / 强调 G.accent
// === 时间特性 ===
// 策略: 弹刚 ShotTime（整段弹性）
// 刚性（不可压缩）: 无
// 弹性（可伸缩）: 全程可等比缩放（时长适配语音）
// === 适配注意 ===
// 段长不足 60f 时回退原始帧（动画按原速、可能被截断）。
// line-unfold-panel —— 一线展面（Jarvis/FUI 母题）
// 暗底。入场两拍：3px 细线从中点向两侧极快抽出（5f）→ 定宽后纵向
// 撑开成 Card 面板（9f，out 缓动）→ 内容延迟淡入。
// 静置展示后反向退场：压扁成线（7f）→ 线缩成点 → 熄灭，像老 CRT 关机。
// f0–12 空场静置；入场 f12–34；持面板至 f78；退场 f78–98；末静止 ≥42f（140f）。
import React from 'react';
import { interpolate, Easing } from 'remotion';
import { G } from '../../_fixtures/Fixtures';
import { SceneContentData } from '../../_system/scene-content';
import { FONT_STACK } from '../../_system/typography';

import { useShotFrame } from '../../../engine/useShotFrame';
import type { ShotTime } from '../../../engine/time';

// 时长画像：整段弹性（2026-08-14 精修）
const SHOT_TIME: ShotTime = {
  segments: [{ from: 0, to: 180, mode: 'elastic', minFrames: 0 }],
  minFrames: 0,
};

const PANEL_W = 760;
const PANEL_H = 460;
const CX = 960;
const CY = 540;

const clamp = { extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const };

export interface LineUnfoldPanelProps {
  panel?: SceneContentData;
  revealAtSec?: number; // 口播对齐：点亮/线抽出起点时刻（段内秒）；提供后忽略默认 12f
}

export const LineUnfoldPanel: React.FC<LineUnfoldPanelProps> = ({
  panel = {
    title: '概览',
    type: 'rows',
    rows: [
      { label: '指标一', value: '+18%' },
      { label: '指标二', value: '2.1×' },
      { label: '指标三', value: '96.4%' },
    ],
  },
  revealAtSec,
}) => {
  const frame = useShotFrame(SHOT_TIME);
  // —— 入场/退场时间表（T0 可由 revealAtSec 覆盖，其余相对保持）——
  const T0 = revealAtSec !== undefined ? Math.round(revealAtSec * 30) : 12; // 点亮起点
  const LINE_END = T0 + 5; // 线抽出完成
  const UNFOLD_END = LINE_END + 9; // 面板撑开完成
  const CONTENT_END = UNFOLD_END + 8; // 内容淡入完成
  const OUT0 = T0 + 66; // 开始压扁（默认 78 = 12+66）
  const COLLAPSE_END = OUT0 + 7; // 压成线
  const SHRINK_END = COLLAPSE_END + 6; // 线缩成点
  const OFF = SHRINK_END + 4; // 点熄灭

  // 入场：scaleX（线抽出）快进快停，入场后保持 1
  const inSX = interpolate(frame, [T0, LINE_END], [0.004, 1], {
    easing: Easing.out(Easing.poly(4)),
    ...clamp,
  });
  // 入场：scaleY（纵向撑开），线阶段压在 3px
  const inSY = interpolate(frame, [LINE_END, UNFOLD_END], [3 / PANEL_H, 1], {
    easing: Easing.out(Easing.cubic),
    ...clamp,
  });
  // 内容淡入（面板撑开过半才开始）
  const contentOp = interpolate(frame, [UNFOLD_END - 3, CONTENT_END], [0, 1], {
    easing: Easing.out(Easing.quad),
    ...clamp,
  });

  // 退场：先压 Y 回线，再缩 X 回点
  const outSY = interpolate(frame, [OUT0, COLLAPSE_END], [1, 3 / PANEL_H], {
    easing: Easing.in(Easing.cubic),
    ...clamp,
  });
  const outSX = interpolate(frame, [COLLAPSE_END, SHRINK_END], [1, 0.004], {
    easing: Easing.in(Easing.poly(4)),
    ...clamp,
  });
  // 内容在压扁前先撤
  const contentOutOp = interpolate(frame, [OUT0 - 4, OUT0 + 2], [1, 0], clamp);

  const sx = frame < OUT0 ? inSX : outSX;
  const sy = frame < OUT0 ? inSY : outSY;

  // 末点熄灭：opacity 快落。f >= OFF 后整个元素条件卸载 → 真静止
  const dotOp = interpolate(frame, [SHRINK_END, OFF], [1, 0], {
    easing: Easing.in(Easing.quad),
    ...clamp,
  });

  const alive = frame >= T0 && frame < OFF;
  // 面板阶段（sy 足够大）显示卡片内容；线/点阶段显示发光条
  const isPanel = sy > 0.15;

  return (
    <div style={{ width: 1920, height: 1080, background: G.bg, overflow: 'hidden', position: 'relative' }}>
      {alive && (
        <div
          style={{
            position: 'absolute',
            left: CX - PANEL_W / 2,
            top: CY - PANEL_H / 2,
            width: PANEL_W,
            height: PANEL_H,
            transform: `scaleX(${sx}) scaleY(${sy})`,
            transformOrigin: '50% 50%',
            opacity: dotOp,
          }}
        >
          {isPanel ? (
            <>
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  background: G.card,
                  border: `2px solid ${G.border}`,
                  borderRadius: 14,
                  boxSizing: 'border-box',
                  padding: '30px 36px',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  boxShadow: '0 0 40px rgba(211,146,60,0.18)',
                  fontFamily: FONT_STACK,
                }}
              >
                {panel.title ? (
                  <div style={{ fontSize: 32, fontWeight: 700, color: G.ink, marginBottom: 20 }}>{panel.title}</div>
                ) : null}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  {(panel.rows ?? []).map((r, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '15px 0',
                        borderBottom: i < (panel.rows ?? []).length - 1 ? `1px solid ${G.line}` : 'none',
                      }}
                    >
                      <span style={{ fontSize: 26, color: G.ink, fontWeight: 600 }}>{r.label}</span>
                      <span style={{ marginLeft: 'auto', fontSize: 28, color: G.accent, fontWeight: 800 }}>{r.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* 内容层单独控 opacity：盖一层暗板模拟"内容未亮" */}
              <div
                style={{
                  position: 'absolute',
                  inset: 2,
                  borderRadius: 12,
                  background: G.card,
                  opacity: 1 - Math.min(contentOp, contentOutOp),
                }}
              />
            </>
          ) : (
            // 线/点阶段：白色发光条填满整个盒（被 scale 压成线）
            <div style={{ width: '100%', height: '100%', background: G.card, boxShadow: '0 0 60px rgba(255,255,255,0.9)', borderRadius: 2 }} />
          )}
        </div>
      )}
    </div>
  );
};
