// === 可调参数 ===
// DURATION: 180（总帧数，可调；弹性段随 DURATION 等比缩放）
// 色彩: 走纸墨 G 色板（src/_fixtures/Fixtures.tsx）——文字 G.ink / 背景 G.bg / 强调 G.accent
// 功能: 钩子,展开
// props: scene（俯仰揭示的内容承载）
// === 时间特性 ===
// 刚性（不可压缩）: 无（全程弹性）
// 弹性（可伸缩）: 全程可等比缩放（时长适配语音）
// === 适配注意 ===
// 调 DURATION 时只动弹性段 interpolate 关键帧，刚性核心帧区间保持固定帧数。
// tilt-reveal｜俯仰揭示
// 开场俯视 dashboard 顶部（rotateX 平躺、只露顶栏），~43f 机位抬头回正，
// 内容一排排涌入视野。out-cubic + 末端轻微过冲回正，落定真静止 ≥35f。
import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, Easing } from 'remotion';
import { G } from '../../_fixtures/Fixtures';
import { SceneContent, SceneContentData } from '../../_system/scene-content';

const HOLD = 25; // 俯角定格
const MOVE = 43; // 主抬升
// 过冲：-55° → +2.6° → -0.9° → 0°，全部动画在 f=76 结束（145-76=69f 真静止）

export interface TiltRevealProps {
  scene?: SceneContentData;
}

export const TiltReveal: React.FC<TiltRevealProps> = ({
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
  const f = useCurrentFrame();

  const rotX = interpolate(
    f,
    [HOLD, HOLD + MOVE, HOLD + MOVE + 4, HOLD + MOVE + 8],
    [-80, 2.6, -0.9, 0],
    { easing: Easing.out(Easing.cubic), extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  const p = interpolate(f, [HOLD, HOLD + MOVE], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const scale = interpolate(p, [0, 1], [3.2, 1]);
  const ty = interpolate(p, [0, 1], [200, 0]);
  const persp = interpolate(p, [0, 1], [600, 1200]);
  const perspY = interpolate(p, [0, 1], [5, 40]);

  return (
    <AbsoluteFill style={{ background: G.bg, overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          perspective: persp,
          perspectiveOrigin: `50% ${perspY}%`,
        }}
      >
        <div
          style={{
            width: 1920,
            height: 1080,
            transformOrigin: '50% 0%', // 画面上缘
            transform: `translateY(${ty}px) scale(${scale}) rotateX(${rotX}deg)`,
          }}
        >
          <SceneContent content={scene} />
        </div>
      </div>
    </AbsoluteFill>
  );
};
