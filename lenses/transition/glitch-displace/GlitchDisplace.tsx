// === 可调参数 ===
// DURATION: 180（总帧数，可调；弹性段随 DURATION 等比缩放）
// 功能: 转折
// 描述: 撕裂位移藏切——水平条撕裂位移盖住硬切
// 色彩: 走纸墨 G 色板（src/_fixtures/Fixtures.tsx）——文字 G.ink / 背景 G.bg / 强调 G.accent
// === 时间特性 ===
// 策略: 弹刚 ShotTime（刚弹分段）
// 刚性（不可压缩）: 撕裂转场 45–62f（固定 0.57s，转场必须快、不可随段长拖长）
// 弹性（可伸缩）: 前段 A 画面 hold（0–45）/ 后段 B 画面（62–180）
// === 适配注意 ===
// 撕裂段固定不随段长伸缩；段长不足 33f（8+17+8）时回退原始帧（动画按原速、可能被截断）。
// glitch-displace｜噪声置换撕裂
// FakeDashboard A 播到 45f，45–62f 撕裂转场：页面切 16 条水平条带
// （外层 overflow hidden + 内层整页反向 translateY 对位），每条 translateX
// 由 h(条号*31+f*7) 驱动 ±70px 抖动，幅度包络 0→峰值→0（起势 out-cubic、
// 消散线性，冲击判例）。同时叠 2 份整页明暗错位重影（+12px 暗 / -12px 亮反相，
// opacity ≤0.35，灰阶版代替 RGB 分离）。58f 抖动衰减中硬切 variant="B"，
// 再抖 4f 至 62f 归位。62f 起摘罩直出 B（条带/重影全部条件卸载），
// 62–135f 真静止 73f ≥ 40f。帧确定：h() 伪随机，无 Math.random。
import React from 'react';
import { AbsoluteFill, interpolate, Easing } from 'remotion';
import { G } from '../../_fixtures/Fixtures';
import { SceneContent, SceneContentData } from '../../_system/scene-content';

import { useShotFrame } from '../../../engine/useShotFrame';
import type { ShotTime } from '../../../engine/time';

  // 时长画像：撕裂转场刚性（45–62f），前后 A/B 画面弹性 hold（2026-08-14 精修）
  const SHOT_TIME: ShotTime = {
    segments: [
      { from: 0, to: 45, mode: 'elastic', minFrames: 8 },
      { from: 45, to: 62, mode: 'rigid' },
      { from: 62, to: 180, mode: 'elastic', minFrames: 8 },
    ],
    minFrames: 33,
  };

const STRIPS = 16;
const H = 1080;
const STRIP_H = H / STRIPS; // 67.5
const AMP = 70; // 峰值条带错位（spec 备选加码值，QA 要一眼看到撕裂）

// 库内标准伪随机
const h = (n: number) => {
  const s = Math.sin(n * 127.3) * 43758.5453;
  return s - Math.floor(s);
};

export interface GlitchDisplaceProps {
  sceneA?: SceneContentData;
  sceneB?: SceneContentData;
}

export const GlitchDisplace: React.FC<GlitchDisplaceProps> = ({
  sceneA = {
    title: '概览',
    type: 'rows',
    rows: [
      { label: '指标一', value: '+18%' },
      { label: '指标二', value: '2.1×' },
    ],
  },
  sceneB = {
    title: '状态',
    type: 'rows',
    rows: [
      { label: '节点', value: '4/4' },
      { label: '可用性', value: '99.98%' },
    ],
  },
}) => {
  const frame = useShotFrame(SHOT_TIME);

  const tearing = frame >= 45 && frame < 62;
  const variant: 'A' | 'B' = frame >= 58 ? 'B' : 'A';

  if (!tearing) {
    // 45f 前 A 静置；62f 起 B 摘罩真静止（无 transform / filter / 重影）
    return (
      <AbsoluteFill style={{ background: G.bg }}>
        <SceneContent content={variant === 'A' ? sceneA : sceneB} />
      </AbsoluteFill>
    );
  }

  // 幅度包络：45–48f out-cubic 冲起 → 平台 → 56–62f 线性消散（帧驱动，确定性）
  const rise = interpolate(frame, [45, 48], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const decay = interpolate(frame, [56, 62], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const env = Math.min(rise, decay);

  return (
    <AbsoluteFill style={{ background: G.bg, overflow: 'hidden' }}>
      {/* 底垫一份完整页，防条带间横移露底色缝 */}
      <AbsoluteFill>
        <SceneContent content={variant === 'A' ? sceneA : sceneB} />
      </AbsoluteFill>

      {/* 明暗错位重影（灰阶版 RGB 分离）：+12px 压暗 / -12px 反相提亮 */}
      <AbsoluteFill
        style={{
          transform: 'translateX(12px)',
          opacity: 0.35 * env,
          filter: 'brightness(0.45)',
        }}
      >
        <SceneContent content={variant === 'A' ? sceneA : sceneB} />
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          transform: 'translateX(-12px)',
          opacity: 0.28 * env,
          filter: 'invert(1)',
        }}
      >
        <SceneContent content={variant === 'A' ? sceneA : sceneB} />
      </AbsoluteFill>

      {/* 16 条水平条带：外层裁切，内层整页反向 translateY 对位 + 逐帧横向抖动 */}
      {Array.from({ length: STRIPS }).map((_, i) => {
        const dx = (h(i * 31 + frame * 7) * 2 - 1) * AMP * env;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: i * STRIP_H,
              left: 0,
              width: 1920,
              height: STRIP_H,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: 1920,
                height: H,
                transform: `translate(${dx.toFixed(2)}px, ${-i * STRIP_H}px)`,
              }}
            >
              <SceneContent content={variant === 'A' ? sceneA : sceneB} />
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
