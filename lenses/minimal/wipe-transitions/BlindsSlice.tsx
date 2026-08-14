// === 可调参数 ===
// DURATION: 180（总帧数，可调；弹性段随 DURATION 等比缩放）
// 色彩: 走纸墨 G 色板（src/_fixtures/Fixtures.tsx）——文字 G.ink / 背景 G.bg / 强调 G.accent
// 功能: 转折,承接
// props: sceneA / sceneB（百叶窗前后景内容承载）
// === 时间特性 ===
// 策略: 弹刚 ShotTime（刚弹分段）
// 刚性（不可压缩）: 百叶横切 20–52f（波浪扫过 1.07s，转场必须快）
// 弹性（可伸缩）: 前段 A 画面 hold 0–20 / 后段 B 画面 52–180
// === 适配注意 ===
// 转场段固定不随段长伸缩；段长不足 48f（8+32+8）时回退原始帧。
// blinds-slice｜百叶窗切条错峰擦除
// FakeDashboard A → B。12 根 160px 竖条，从左到右 delay=列号×2f，
// 每条 10f 内完成翻换：条内 A scaleX 1→0（origin 左缘）与 B scaleX 0→1
// （origin 右缘）共用同一进度 p（Easing.in(cubic)），交接缝恒等于
// x+160(1-p)，数学上无露底。缝上亮线（柔光+暗描边+白核）随波扫过。
// 波 20–52f；52f 起摘罩（整页 B 直出、条结构与亮线全部卸载），
// 52–150f 真静止 98f ≥ 40f。帧确定，无随机源。
import React from 'react';
import { AbsoluteFill, interpolate, Easing } from 'remotion';
import { G } from '../../_fixtures/Fixtures';
import { SceneContent, SceneContentData } from '../../_system/scene-content';

import { useShotFrame } from '../../../engine/useShotFrame';
import type { ShotTime } from '../../../engine/time';

// 时长画像：百叶横切刚性（20–52f），前后弹性（2026-08-14 精修）
const SHOT_TIME: ShotTime = {
  segments: [
    { from: 0, to: 20, mode: 'elastic', minFrames: 8 },
    { from: 20, to: 52, mode: 'rigid' },
    { from: 52, to: 180, mode: 'elastic', minFrames: 8 },
  ],
  minFrames: 48,
};

const STRIPS = 12;
const W = 160; // 每条宽 12×160 = 1920
const WAVE_START = 20;
const STAGGER = 2; // 列号 × 2f
const FLIP = 10; // 每条 10f 完成翻换
const WAVE_END = WAVE_START + (STRIPS - 1) * STAGGER + FLIP; // 52

// 条内某页的切片：外层 160 宽裁剪，内层整页 1920 负 margin 对位
const Slice: React.FC<{ x: number; content: SceneContentData }> = ({ x, content }) => (
  <div style={{ width: 1920, height: 1080, marginLeft: -x }}>
    <SceneContent content={content} />
  </div>
);

export interface BlindsSliceProps {
  sceneA?: SceneContentData;
  sceneB?: SceneContentData;
}

export const BlindsSlice: React.FC<BlindsSliceProps> = ({
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

  // 摘罩：波完成后条结构全部卸载，B 整页直出
  if (frame >= WAVE_END) {
    return (
      <AbsoluteFill style={{ background: G.panel }}>
        <SceneContent content={sceneB} />
      </AbsoluteFill>
    );
  }

  const seams: { x: number; opacity: number }[] = [];

  const strips = Array.from({ length: STRIPS }).map((_, i) => {
    const x = i * W;
    const start = WAVE_START + i * STAGGER;
    const end = start + FLIP;

    // 未开始：纯 A 切片；已完成：纯 B 切片
    if (frame < start) {
      return (
        <div key={i} style={{ position: 'absolute', left: x, top: 0, width: W, height: 1080, overflow: 'hidden' }}>
          <Slice x={x} content={sceneA} />
        </div>
      );
    }
    if (frame >= end) {
      return (
        <div key={i} style={{ position: 'absolute', left: x, top: 0, width: W, height: 1080, overflow: 'hidden' }}>
          <Slice x={x} content={sceneB} />
        </div>
      );
    }

    // 翻换中：A、B 共用同一进度 p——A 宽 160(1-p) 靠左，B 宽 160p 靠右，
    // 交接点恒为 x+160(1-p)，无露底
    const p = interpolate(frame, [start, end], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.in(Easing.cubic),
    });

    // 缝亮线：进出各 2f 线性淡入淡出
    const seamOpacity = Math.min(
      interpolate(frame, [start, start + 2], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
      interpolate(frame, [end - 2, end], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
    );
    seams.push({ x: x + W * (1 - p), opacity: seamOpacity });

    return (
      <div key={i} style={{ position: 'absolute', left: x, top: 0, width: W, height: 1080, overflow: 'hidden' }}>
        {/* A：向左缘收缩 */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', transform: `scaleX(${1 - p})`, transformOrigin: '0% 50%' }}>
          <Slice x={x} content={sceneA} />
        </div>
        {/* B：从右缘展开 */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', transform: `scaleX(${p})`, transformOrigin: '100% 50%' }}>
          <Slice x={x} content={sceneB} />
        </div>
      </div>
    );
  });

  return (
    <AbsoluteFill style={{ background: G.panel }}>
      {strips}
      {/* 缝亮线：白底判例——纯提亮不可见，柔光 + 暗描边 + 白核三层 */}
      {seams.length > 0 && (
        <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {seams.map((s, i) => (
            <g key={i} opacity={s.opacity}>
              <line x1={s.x} y1={0} x2={s.x} y2={1080} stroke="rgba(255,255,255,0.45)" strokeWidth={16} />
              <line x1={s.x} y1={0} x2={s.x} y2={1080} stroke="rgba(0,0,0,0.55)" strokeWidth={6} />
              <line x1={s.x} y1={0} x2={s.x} y2={1080} stroke="rgba(255,255,255,0.95)" strokeWidth={3} />
            </g>
          ))}
        </svg>
      )}
    </AbsoluteFill>
  );
};
