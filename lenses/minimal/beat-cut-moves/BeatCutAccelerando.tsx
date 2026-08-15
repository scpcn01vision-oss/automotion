// === 可调参数 ===
// DURATION: 180（总帧数，可调；弹性段随 DURATION 等比缩放）
// 色彩: 走纸墨 G 色板（src/_fixtures/Fixtures.tsx）——文字 G.ink / 背景 G.bg / 强调 G.accent
// 功能: 钩子,宣告
// props: sceneA / sceneB（两套内容承载，6 视图交替硬切）
// === 时间特性 ===
// 策略: 弹刚 ShotTime（整段弹性）
// 刚性（不可压缩）: 无
// 弹性（可伸缩）: 全程可等比缩放（时长适配语音）
// === 适配注意 ===
// 段长不足 60f 时回退原始帧（动画按原速、可能被截断）。
import React from 'react';
import { AbsoluteFill, Easing, interpolate } from 'remotion';
import { G } from '../../_fixtures/Fixtures';
import { SceneContent, SceneContentData } from '../../_system/scene-content';

import { useShotFrame } from '../../../engine/useShotFrame';
import type { ShotTime } from '../../../engine/time';

// 时长画像：整段弹性（2026-08-14 精修）
const SHOT_TIME: ShotTime = {
  segments: [{ from: 0, to: 180, mode: 'elastic', minFrames: 0 }],
  minFrames: 0,
};

// beat-cut-accelerando：六个不同构图按 16→12→8→6→4 帧递减间隔全屏硬切，
// 加速逼近，最后一切戛然定格回主画面并 1→1.06 慢推收住。
// 真硬切：frame 落在哪个区间就渲染哪个视图，无任何过渡。

// 一个视图 = 内容变体（A/B）+ 缩放 + 对焦点（画面上要被推到屏幕中心的点）
type View = { variant: 'A' | 'B'; scale: number; cx: number; cy: number };

const VIEWS: View[] = [
  { variant: 'A', scale: 1, cx: 960, cy: 540 },    // v0 全景（建立）
  { variant: 'A', scale: 1.8, cx: 1070, cy: 576 }, // v1 卡片区
  { variant: 'A', scale: 2.6, cx: 600, cy: 340 },  // v2 单卡特写
  { variant: 'B', scale: 1, cx: 960, cy: 540 },    // v3 列表页全景
  { variant: 'B', scale: 1.9, cx: 1070, cy: 500 }, // v4 列表行区
  { variant: 'B', scale: 2.8, cx: 1070, cy: 290 }, // v5 单行特写
];

// 每段起始帧：建立 49f，然后间隔 16→12→8→6→4，末段（回主画面）hold 35f
// 0–48 v0 | 49–64 v1 | 65–76 v2 | 77–84 v3 | 85–90 v4 | 91–94 v5 | 95–129 定格
const CUTS = [0, 49, 65, 77, 85, 91, 95];
const FINAL = 95; // 最后一切：戛然定格回主画面

const ViewShot: React.FC<{
  view: View;
  sceneA: SceneContentData;
  sceneB: SceneContentData;
  extraScale?: number;
}> = ({ view, sceneA, sceneB, extraScale = 1 }) => {
  const s = view.scale * extraScale;
  return (
    <div
      style={{
        width: 1920,
        height: 1080,
        transformOrigin: `${view.cx}px ${view.cy}px`,
        transform: `translate(${960 - view.cx}px, ${540 - view.cy}px) scale(${s})`,
      }}
    >
      <SceneContent content={view.variant === 'A' ? sceneA : sceneB} />
    </div>
  );
};

export interface BeatCutAccelerandoProps {
  sceneA?: SceneContentData;
  sceneB?: SceneContentData;
}

export const BeatCutAccelerando: React.FC<BeatCutAccelerandoProps> = ({
  sceneA = {
    type: 'image',
    image: 'textures/card1.png',
  },
  sceneB = {
    type: 'image',
    image: 'textures/card6.png',
  },
}) => {
  const frame = useShotFrame(SHOT_TIME);

  // 当前落在哪个区间（末段 = 主画面 v0）
  let seg = 0;
  for (let i = 0; i < CUTS.length; i++) {
    if (frame >= CUTS[i]) seg = i;
  }
  const isFinal = seg === CUTS.length - 1;
  const view = isFinal ? VIEWS[0] : VIEWS[seg];

  // 末段慢推：scale 1 → 1.06，ease-out，推 22f 后静止（结尾静止 ≥15f）
  const push = isFinal
    ? interpolate(frame, [FINAL, FINAL + 20], [1, 1.06], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
        easing: Easing.out(Easing.cubic),
      })
    : 1;

  // 每次硬切的 1f 亮度跳变（约 +5%）模拟快门
  const isCutFrame = CUTS.some((c, i) => i > 0 && frame === c);
  const flash = isCutFrame ? 1.05 : 1;

  return (
    <AbsoluteFill style={{ background: G.bg, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, filter: `brightness(${flash})` }}>
        <ViewShot view={view} sceneA={sceneA} sceneB={sceneB} extraScale={push} />
      </div>
      {/* 切帧再叠一层极薄白闪，保证肉眼可感 */}
      {isCutFrame && (
        <AbsoluteFill style={{ background: '#ffffff', opacity: 0.06 }} />
      )}
    </AbsoluteFill>
  );
};
