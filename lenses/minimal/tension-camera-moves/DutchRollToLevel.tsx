// === 可调参数 ===
// DURATION: 180（总帧数，可调；弹性段随 DURATION 等比缩放）
// 色彩: 走纸墨 G 色板（src/_fixtures/Fixtures.tsx）——文字 G.ink / 背景 G.bg / 强调 G.accent
// 功能: 宣告,举证
// props: scene（斜置内容承载）、alertText（痛点警示条）、solution（滚正浮现卡）
// === 时间特性 ===
// 刚性（不可压缩）: 无（全程弹性）
// 弹性（可伸缩）: 全程可等比缩放（时长适配语音）
// === 适配注意 ===
// 调 DURATION 时只动弹性段 interpolate 关键帧，刚性核心帧区间保持固定帧数。
import React from 'react';
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';
import { G } from '../../_fixtures/Fixtures';
import { SceneContent, SceneContentData } from '../../_system/scene-content';
import { FONT_STACK } from '../../_system/typography';

// 斜角滚正（dutch-roll-to-level）：呈现痛点时整帧带 -10° 斜角悬着（叠极缓慢
// 正弦漂移防止读作静态歪图），帧 70 解决方案的一拍整帧带单次过冲滚回水平
// （-10° → +1.2° → 0），同时警示条淡出、干净卡浮现——"世界被扶正"打在节拍上。
// 帧 0–70 斜置漂移 / 70–84 滚正冲过头 / 84–94 收回 0 / 94–140 真静止。

const ROLL = 70; // 滚正起拍
const LEVEL = 94; // 完全归位帧

export interface DutchRollToLevelProps {
  scene?: SceneContentData;
  alertText?: string;
  solution?: { title: string; value: string };
}

export const DutchRollToLevel: React.FC<DutchRollToLevelProps> = ({
  scene = {
    title: '概览',
    type: 'rows',
    rows: [
      { label: '指标一', value: '+18%' },
      { label: '指标二', value: '2.1×' },
      { label: '指标三', value: '96.4%' },
    ],
  },
  alertText = '注意',
  solution = { title: '已解决', value: '✓' },
}) => {
  const f = useCurrentFrame();

  // —— 斜置期的缓慢漂移（帧 70 前）：±0.8° 长周期正弦 + 2px 纵漂 ——
  const driftT = Math.min(f, ROLL);
  const driftRot = Math.sin(driftT * 0.035) * 0.8;
  const driftY = Math.sin(driftT * 0.05) * 2;
  // 滚正期间漂移随进度淡出
  const driftFade = interpolate(f, [ROLL, ROLL + 6], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // —— 滚正：-10° 用 14f 冲过 0 到 +1.2°，再 10f 收回 0（单次过冲不振荡） ——
  const baseRot =
    f < ROLL
      ? -10
      : f < ROLL + 14
        ? interpolate(f, [ROLL, ROLL + 14], [-10, 1.2], {
            easing: Easing.out(Easing.cubic),
          })
        : interpolate(f, [ROLL + 14, LEVEL], [1.2, 0], {
            extrapolateRight: 'clamp',
            easing: Easing.inOut(Easing.quad),
          });

  const rot = baseRot + driftRot * driftFade;
  const y = driftY * driftFade;

  // scale 1.15（防旋转露边）→ 滚正同步收到 1.08
  const scale = interpolate(f, [ROLL, LEVEL], [1.15, 1.08], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });

  // —— 警示条（痛点）：斜置期悬在上方，滚正一拍淡出；干净卡反向淡入 ——
  const alertOpacity = interpolate(f, [ROLL, ROLL + 12], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const cleanOpacity = interpolate(f, [ROLL + 8, ROLL + 22], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ background: G.bg, overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: `translateY(${y}px) rotate(${rot}deg) scale(${scale})`,
          transformOrigin: '50% 50%',
        }}
      >
        <SceneContent content={scene} />

        {/* 痛点警示条：深色横幅压在页面上方（斜着更显歪） */}
        <div
          style={{
            position: 'absolute',
            left: 560,
            top: 120,
            width: 800,
            height: 88,
            background: G.ink,
            borderRadius: 14,
            opacity: alertOpacity * 0.92,
            display: 'flex',
            alignItems: 'center',
            gap: 18,
            padding: '0 28px',
            boxSizing: 'border-box',
            boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
          }}
        >
          {/* 警示三角 */}
          <div
            style={{
              width: 0,
              height: 0,
              borderLeft: '18px solid transparent',
              borderRight: '18px solid transparent',
              borderBottom: `32px solid ${G.panel}`,
            }}
          />
          <div style={{ fontFamily: FONT_STACK, fontSize: 28, fontWeight: 700, color: G.card }}>
            {alertText}
          </div>
        </div>

        {/* 解决方案：干净卡随滚正浮现在同一位置 */}
        <div style={{ position: 'absolute', left: 560, top: 96, opacity: cleanOpacity }}>
          <div
            style={{
              width: 800,
              height: 140,
              background: G.card,
              border: `2px solid ${G.border}`,
              borderRadius: 14,
              boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
              padding: '0 28px',
              boxSizing: 'border-box',
              display: 'flex',
              alignItems: 'center',
              gap: 18,
            }}
          >
            <span style={{ fontFamily: FONT_STACK, fontSize: 32, fontWeight: 800, color: G.ink }}>
              {solution.title}
            </span>
            <span style={{ marginLeft: 'auto', fontFamily: FONT_STACK, fontSize: 34, fontWeight: 800, color: G.accent }}>
              {solution.value}
            </span>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
