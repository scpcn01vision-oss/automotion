// === 可调参数 ===
// DURATION: 180（总帧数，可调；弹性段随 DURATION 等比缩放）
// 色彩: 走纸墨 G 色板（src/_fixtures/Fixtures.tsx）——文字 G.ink / 背景 G.bg / 强调 G.accent
// 功能: 转折,承接
// props: sceneA / sceneB（前后页内容承载 rows/image，共享 _system/scene-content 渲染器）
// === 时间特性 ===
// 刚性（不可压缩）: 无（全程弹性）
// 弹性（可伸缩）: 全程可等比缩放（时长适配语音）
// === 适配注意 ===
// 调 DURATION 时只动弹性段 interpolate 关键帧，刚性核心帧区间保持固定帧数。
// 对开门裂幕（barn-door-split-reveal）——剪映"开门式"转场。
// 前页 sceneA 从画面正中垂直裂成左右两半：两个 960×1080 overflow:hidden
// 容器各装一份完整 A（右半内层 translateX(-960) 对位拼合），同时向外加速滑
// 出画外，露出底层 sceneB 从 scale 1.06 轻推到 1.0 迎上来。
// 裂缝各自内边缘 2px G.ink 亮线 + 8px 投影强调"撕开"。
// 关键帧：0–30 静止展示 A（18–22 / 25–29 中缝细线两次闪现预告裂点）→
// 30–50 两半各 translateX ∓980（Easing.in cubic 加速滑出）→
// 30–55 底层 B scale 1.06→1.0（out cubic）→ 55–130 全静止（75f）。
import React from 'react';
import { interpolate, Easing } from 'remotion';
import { G } from '../../_fixtures/Fixtures';
import { SceneContent, SceneContentData } from '../../_system/scene-content';
import { useShotFrame } from '../../../engine/useShotFrame';
import type { ShotTime } from '../../../engine/time';

// 时长画像（迁移自 013 lens-timings.json；全弹性）
const SHOT_TIME: ShotTime = {
  segments: [{ from: 0, to: 180, mode: 'elastic', minFrames: 60 }],
  minFrames: 60,
};

export interface BarnDoorSplitProps {
  sceneA?: SceneContentData;
  sceneB?: SceneContentData;
}

export const BarnDoorSplit: React.FC<BarnDoorSplitProps> = ({
  sceneA = {
    title: '概览',
    type: 'rows',
    rows: [
      { label: '指标一', value: '+18%' },
      { label: '指标二', value: '2.1×' },
      { label: '指标三', value: '96.4%' },
    ],
  },
  sceneB = {
    title: '状态',
    type: 'rows',
    rows: [
      { label: '节点', value: '4/4' },
      { label: '延迟', value: '42ms' },
      { label: '可用性', value: '99.98%' },
    ],
  },
}) => {
  const frame = useShotFrame(SHOT_TIME);

  // 两半外滑位移：30–50f，0 → 980px，加速离场
  const slide = interpolate(frame, [30, 50], [0, 980], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.in(Easing.cubic),
  });

  // 底层 B：30–55f 从 1.06 轻推到 1.0 迎上来
  const bScale = interpolate(frame, [30, 55], [1.06, 1.0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  // 裂前预告：中缝细线两次闪现（帧确定的开关，无随机）
  const crackFlash =
    (frame >= 18 && frame < 22) || (frame >= 25 && frame < 29);
  // 裂开后内边缘亮线 + 阴影常驻（随门一起滑出画外）
  const tornEdge = frame >= 30;

  const edgeLine = (side: 'left' | 'right'): React.CSSProperties => ({
    position: 'absolute',
    top: 0,
    [side]: 0,
    width: 3,
    height: 1080,
    background: G.ink,
    boxShadow:
      side === 'right'
        ? '-8px 0 14px rgba(0,0,0,0.4)'
        : '8px 0 14px rgba(0,0,0,0.4)',
  });

  return (
    <div
      style={{
        width: 1920,
        height: 1080,
        background: G.bg,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* 底层 sceneB：scale 1.06 → 1.0 迎上来 */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: 1920,
          height: 1080,
          transform: `scale(${bScale})`,
          transformOrigin: '50% 50%',
        }}
      >
        <SceneContent content={sceneB} />
      </div>

      {/* 左门：960×1080 视口，装完整 sceneA 的左半 */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: 960,
          height: 1080,
          overflow: 'hidden',
          transform: `translateX(${-slide}px)`,
        }}
      >
        <div style={{ position: 'absolute', left: 0, top: 0, width: 1920, height: 1080 }}>
          <SceneContent content={sceneA} />
        </div>
        {tornEdge && <div style={edgeLine('right')} />}
      </div>

      {/* 右门：960×1080 视口，内层 translateX(-960) 对位拼合 */}
      <div
        style={{
          position: 'absolute',
          left: 960,
          top: 0,
          width: 960,
          height: 1080,
          overflow: 'hidden',
          transform: `translateX(${slide}px)`,
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: 1920,
            height: 1080,
            transform: 'translateX(-960px)',
          }}
        >
          <SceneContent content={sceneA} />
        </div>
        {tornEdge && <div style={edgeLine('left')} />}
      </div>

      {/* 裂点预告：中缝 2px 细线闪现两次 */}
      {crackFlash && (
        <div
          style={{
            position: 'absolute',
            left: 959,
            top: 0,
            width: 2,
            height: 1080,
            background: G.ink,
          }}
        />
      )}
    </div>
  );
};
