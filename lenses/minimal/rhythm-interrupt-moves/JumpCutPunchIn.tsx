// === 可调参数 ===
// DURATION: 180（总帧数，可调；弹性段随 DURATION 等比缩放）
// 色彩: 走纸墨 G 色板（src/_fixtures/Fixtures.tsx）——文字 G.ink / 背景 G.bg / 强调 G.accent
// 功能: 转折
// props: scene（跳切推近的内容承载，对焦中心 = 画面中心）
// === 时间特性 ===
// 刚性（不可压缩）: 无（全程弹性）
// 弹性（可伸缩）: 全程可等比缩放（时长适配语音）
// === 适配注意 ===
// 调 DURATION 时只动弹性段 interpolate 关键帧，刚性核心帧区间保持固定帧数。
// 三级跳切推近（jump-cut-punch-in）——节奏剪辑｜戈达尔跳切/纪录片 punch-in。
// scene 固定构图，transform-origin 钉在画面中心 (960px, 540px)。
// 三次无补间硬切逐级放大：刻意零 interpolate，
// 切换帧一帧到位。每次跳切帧叠 2f 整画面 brightness 0.92 加深脉冲当 tick。
// 关键帧：0–34 scale 1.0 hold → 帧 35 直跳 1.6（35–36 加深脉冲）→ hold →
// 帧 70 直跳 2.6（70–71 加深脉冲）→ 72–134 全静止（63f ≥45f）。
import React from 'react';
import { useCurrentFrame } from 'remotion';
import { G } from '../../_fixtures/Fixtures';
import { SceneContent, SceneContentData } from '../../_system/scene-content';

const ORIGIN_X = 960;
const ORIGIN_Y = 540;

// 三级硬切：零补间，帧 35 / 帧 70 一帧到位
const scaleAt = (f: number): number => (f < 35 ? 1.0 : f < 70 ? 1.6 : 2.6);

// 跳切帧 2f 加深脉冲（整画面 brightness 0.92）
const pulseAt = (f: number): number =>
  (f >= 35 && f <= 36) || (f >= 70 && f <= 71) ? 0.92 : 1;

export interface JumpCutPunchInProps {
  scene?: SceneContentData;
}

export const JumpCutPunchIn: React.FC<JumpCutPunchInProps> = ({
  scene = {
    title: '概览',
    type: 'rows',
    rows: [
      { label: '指标一', value: '+18%' },
      { label: '指标二', value: '2.1×' },
      { label: '指标三', value: '96.4%' },
    ],
  },
}) => {
  const frame = useCurrentFrame();
  const s = scaleAt(frame);
  const b = pulseAt(frame);

  return (
    <div
      style={{
        width: 1920,
        height: 1080,
        background: G.bg,
        position: 'relative',
        overflow: 'hidden',
        filter: `brightness(${b})`,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: `scale(${s})`,
          transformOrigin: `${ORIGIN_X}px ${ORIGIN_Y}px`,
        }}
      >
        <SceneContent content={scene} />
      </div>
    </div>
  );
};
