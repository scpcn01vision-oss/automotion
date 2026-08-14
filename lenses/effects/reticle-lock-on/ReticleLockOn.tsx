// === 可调参数 ===
// DURATION: 180（总帧数，可调；弹性段随 DURATION 等比缩放）
// 功能: 强调
// 描述: 准星锁定——准星围绕目标组装锁定
// 色彩: 走纸墨 G 色板（src/_fixtures/Fixtures.tsx）——文字 G.ink / 背景 G.bg / 强调 G.accent
// === 时间特性 ===
// 刚性（不可压缩）: 无（全程弹性）
// 弹性（可伸缩）: 全程可等比缩放（时长适配语音）
// === 适配注意 ===
// 调 DURATION 时只动弹性段 interpolate 关键帧，刚性核心帧区间保持固定帧数。
// reticle-lock-on —— 准星咬合（钢铁侠 HUD / 安德的游戏）
// FakeDashboard 静置。四个 L 形角标组成的取景框从画外飞入（大框），
// 超调回弹后收缩贴紧目标卡片四角"咔"地咬合定格；咬合帧卡片微亮 +
// 旁弹一行小标签。画面不冻结，是运动中的捕获。
// f0–14 面板静置；f14–24 飞入；f24–46 收缩（含过冲回弹）；f46 咬合；
// 标签 f46–56 弹出；f56 后真静止 ≥84f（140f 总长）。
import React from 'react';
import { interpolate, Easing } from 'remotion';
import { G } from '../../_fixtures/Fixtures';
import { SceneContent, SceneContentData } from '../../_system/scene-content';
import { FONT_STACK } from '../../_system/typography';

import { useShotFrame } from '../../../engine/useShotFrame';
import type { ShotTime } from '../../../engine/time';

// 时长画像（保守兜底：整段弹性；精修阶段按镜头关键帧画像刚弹分段）
const SHOT_TIME: ShotTime = {
  segments: [{ from: 0, to: 180, mode: 'elastic', minFrames: 0 }],
  minFrames: 0,
};

// 目标：variant A 网格第 2 张卡（第一行中间）。
// 布局推导：侧栏 220 + padding 36，网格 3 列 gap 28，
// 内容区宽 1700-72=1628 → 卡宽 (1628-56)/3 ≈ 524，卡高 (1080-72-72-28)/2 ≈ 454...
// 实测近似：目标框取第一行中间卡的外接矩形（含少量呼吸边距）。
const PAD = 14; // 咬合后角标与卡的呼吸距

const FLY_IN = 14; // 飞入开始
const FLY_END = 24; // 飞入结束（大框就位）
const LOCK_END = 46; // 咬合帧
const LABEL_END = 56;

const ARM = 56; // L 臂长
const THICK = 10; // L 粗

const clamp = { extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const };

export interface ReticleLockOnProps {
  scene?: SceneContentData;
  focus?: { x: number; y: number; w: number; h: number }; // 对焦框位置与尺寸
}

export const ReticleLockOn: React.FC<ReticleLockOnProps> = ({
  scene = {
    title: '概览',
    type: 'rows',
    rows: [
      { label: '指标一', value: '+18%' },
      { label: '指标二', value: '2.1×' },
      { label: '指标三', value: '96.4%' },
    ],
  },
  focus = { x: 808, y: 108, w: 524, h: 425 },
}) => {
  const frame = useShotFrame(SHOT_TIME);
  const fx = focus.x;
  const fy = focus.y;
  const fw = focus.w;
  const fh = focus.h;
  const tcx = fx + fw / 2;
  const tcy = fy + fh / 2;

  // 飞入：整框从右下画外冲进来，同时是个放大 2.2× 的大框
  const flyT = interpolate(frame, [FLY_IN, FLY_END], [0, 1], {
    easing: Easing.out(Easing.cubic),
    ...clamp,
  });
  const flyDX = (1 - flyT) * 1100;
  const flyDY = (1 - flyT) * 620;

  // 收缩咬合：半宽/半高从 2.2× 收到贴紧，带超调（收过头 6% 再弹回）
  const shrink = interpolate(
    frame,
    [FLY_END, LOCK_END - 8, LOCK_END - 3, LOCK_END],
    [2.2, 1.06, 0.94, 1],
    { easing: Easing.inOut(Easing.cubic), ...clamp },
  );
  const hw = (fw / 2 + PAD) * shrink;
  const hh = (fh / 2 + PAD) * shrink;

  // 咬合帧：卡片微亮（一层白色 overlay 快闪后停在 0.28）
  const glow = interpolate(frame, [LOCK_END, LOCK_END + 3, LOCK_END + 10], [0, 0.55, 0.28], clamp);

  // 标签：咬合后从角标右上弹出（scaleX 展开 + 淡入）
  const labelT = interpolate(frame, [LOCK_END + 2, LABEL_END], [0, 1], {
    easing: Easing.out(Easing.back(1.8)),
    ...clamp,
  });

  const showReticle = frame >= FLY_IN;
  const locked = frame >= LOCK_END;

  // 四个 L 角：位置 = 中心 ± (hw, hh)，各自镜像
  const corners = [
    { x: tcx - hw, y: tcy - hh, sx: 1, sy: 1 },
    { x: tcx + hw, y: tcy - hh, sx: -1, sy: 1 },
    { x: tcx - hw, y: tcy + hh, sx: 1, sy: -1 },
    { x: tcx + hw, y: tcy + hh, sx: -1, sy: -1 },
  ];

  return (
    <div style={{ width: 1920, height: 1080, background: G.bg, overflow: 'hidden', position: 'relative' }}>
      <SceneContent content={scene} />
      {/* 咬合微亮层：条件渲染，锁定前不存在 */}
      {locked && (
        <div
          style={{
            position: 'absolute',
            left: fx,
            top: fy,
            width: fw,
            height: fh,
            borderRadius: 14,
            background: G.card,
            opacity: glow,
            pointerEvents: 'none',
          }}
        />
      )}
      {showReticle && (
        <div style={{ position: 'absolute', left: 0, top: 0, transform: `translate(${flyDX}px, ${flyDY}px)` }}>
          {corners.map((c, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: c.x,
                top: c.y,
                transform: `scale(${c.sx}, ${c.sy})`,
                transformOrigin: '0 0',
              }}
            >
              {/* L 形角标：横臂 + 竖臂 */}
              <div style={{ position: 'absolute', left: 0, top: 0, width: ARM, height: THICK, background: G.ink }} />
              <div style={{ position: 'absolute', left: 0, top: 0, width: THICK, height: ARM, background: G.ink }} />
            </div>
          ))}
          {/* 小标签：右上角标外侧弹出 */}
          {frame >= LOCK_END + 2 && (
            <div
              style={{
                position: 'absolute',
                left: tcx + hw + 18,
                top: tcy - hh - 6,
                transform: `scale(${labelT})`,
                transformOrigin: '0 50%',
                background: G.ink,
                color: '#fff',
                fontFamily: FONT_STACK,
                fontWeight: 700,
                fontSize: 26,
                padding: '10px 18px',
                borderRadius: 8,
                whiteSpace: 'nowrap',
                opacity: Math.min(1, labelT * 1.5),
              }}
            >
              TARGET · CARD_02
            </div>
          )}
        </div>
      )}
    </div>
  );
};
