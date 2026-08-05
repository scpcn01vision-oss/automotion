// === 可调参数 ===
// DURATION: 180（总帧数，可调；弹性段随 DURATION 等比缩放）
// 色彩: 走纸墨 G 色板（src/_fixtures/Fixtures.tsx）——文字 G.ink / 背景 G.bg / 强调 G.accent
// 功能: 转折
// props: scene（频闪推近的内容承载，硬切落点 = 画面中心）
// === 时间特性 ===
// 刚性（不可压缩）: 无（全程弹性）
// 弹性（可伸缩）: 全程可等比缩放（时长适配语音）
// === 适配注意 ===
// 调 DURATION 时只动弹性段 interpolate 关键帧，刚性核心帧区间保持固定帧数。
// 频闪黑帧（strobe-black-frames）——节奏剪辑｜VJ strobe / 剪映闪黑。
// scene 全程缓慢推近蓄张力（scale 1.0→1.05，Easing.in(quad)，
// 越到后段越快）。40–80f 频闪窗：全屏纯黑 #0c0c0c 按写死帧号表闪现，
// 每次持续 2f，间隔从 8f 收敛到 3f，窒息感逐渐逼近。最后一闪盖住 79–80，
// 帧 81 掀开时构图已硬切到 scale 1.35 对准第 2 行中间卡（零补间一帧到位），
// 叠 2f brightness 0.88 加深脉冲当落锤。
// 关键帧：0–78 推近 1.0→~1.05 → 黑闪 [40,48,55,61,66,70,73,76,79]（各 2f）→
// 79–80 全黑 → 帧 81 硬切 scale 1.35（81–82 加深脉冲）→ 83–134 全静止（52f ≥50f）。
// 光敏警示：实战建议配乐渐强使用。
import React from 'react';
import { useCurrentFrame, interpolate, Easing } from 'remotion';
import { G } from '../../_fixtures/Fixtures';
import { SceneContent, SceneContentData } from '../../_system/scene-content';

const ORIGIN_X = 960;
const ORIGIN_Y = 540;

// 黑闪帧号表（写死）：间隔 8→7→6→5→4→3→3→3，每次持续 2f（f0 与 f0+1）
const FLASHES = [40, 48, 55, 61, 66, 70, 73, 76, 79];

const isBlack = (f: number): boolean =>
  FLASHES.some((f0) => f >= f0 && f <= f0 + 1);

// 帧 81 前缓慢推近（Easing.in 蓄力），81 起零补间硬切 1.35 定住
const scaleAt = (f: number): number =>
  f < 81
    ? interpolate(f, [0, 80], [1.0, 1.05], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
        easing: Easing.in(Easing.quad),
      })
    : 1.35;

// 落锤：81–82 两帧整画面加深脉冲
const pulseAt = (f: number): number => (f >= 81 && f <= 82 ? 0.88 : 1);

export interface StrobeBlackFramesProps {
  scene?: SceneContentData;
}

export const StrobeBlackFrames: React.FC<StrobeBlackFramesProps> = ({
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
  const black = isBlack(frame);

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
      {/* 全屏黑闪层：盖住一切（含标签），每次 2f */}
      {black && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: G.side,
            zIndex: 10,
          }}
        />
      )}
    </div>
  );
};
