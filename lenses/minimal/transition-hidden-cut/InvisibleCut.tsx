// === 可调参数 ===
// DURATION: 180（总帧数，可调；弹性段随 DURATION 等比缩放）
// 色彩: 走纸墨 G 色板（src/_fixtures/Fixtures.tsx）——文字 G.ink / 背景 G.bg / 强调 G.accent
// 功能: 转折
// props: sceneA / sceneB（遮挡切前后景内容承载）、card（遮挡卡内容）
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
import { useShotFrame } from '../../../engine/useShotFrame';
import type { ShotTime } from '../../../engine/time';

// 时长画像（lens-timings 无此镜头；硬切短镜头，按文件头「全程弹性」标）
const SHOT_TIME: ShotTime = {
  segments: [{ from: 0, to: 180, mode: 'elastic', minFrames: 20 }],
  minFrames: 20,
};

// invisible-cut：前景遮挡隐形切——一张放大到超出画幅的卡片带重运动模糊
// 从左侧贴脸扫过，糊满屏幕的瞬间背景从 A 无痕换成 B，卡片飞出右侧时
// 观众以为还是同一镜。（invisible-cut + foreground-occlusion-swipe）
const SW_START = 40; // 卡片入场
const SW_END = 54; // 卡片出场（14f 横扫）
const CUT = 47; // 硬切点：扫掠中点，卡片完全糊满画面的那一帧

// 卡片中扫掠曲线上的水平位置（容器 left，未缩放坐标）
const xAt = (f: number, s: number, e: number) =>
  // 卡片 scale(1.6) 后半宽 1280：起点右缘 -120 / 终点左缘 2120，均完全出画；
  // 中点 f47 覆盖 -280..2280，糊满整个 1920 画幅
  interpolate(f, [s, e], [-2200, 2600], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.3, 0, 0.7, 1),
  });

const Scene: React.FC<{
  sceneA: SceneContentData;
  sceneB: SceneContentData;
  card: { label: string; value: string };
  revealAtSec?: number;
}> = ({ sceneA, sceneB, card, revealAtSec }) => {
  const frame = useShotFrame(SHOT_TIME);
  const realFrame = useCurrentFrame();
  const cueMode = revealAtSec !== undefined;
  const f = cueMode ? realFrame : frame;
  const CUT_F = cueMode ? Math.round(revealAtSec * 30) : CUT;
  const SW_START_F = CUT_F - (CUT - SW_START);
  const SW_END_F = CUT_F + (SW_END - CUT);
  const x = xAt(f, SW_START_F, SW_END_F);
  // 瞬时速度（px/帧），驱动斜切与残影强度
  const v = xAt(f + 0.5, SW_START_F, SW_END_F) - xAt(f - 0.5, SW_START_F, SW_END_F);
  const sweeping = f > SW_START_F - 2 && f < SW_END_F + 3;
  // 背景被"带风"轻推：A 被拖向左，切成 B 后从右侧回稳——卖同一镜错觉
  const shove =
    f < CUT_F
      ? interpolate(f, [SW_START_F, CUT_F], [0, -40], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
          easing: Easing.in(Easing.quad),
        })
      : interpolate(f, [CUT_F, CUT_F + 13], [40, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
          easing: Easing.out(Easing.cubic),
        });
  return (
    <AbsoluteFill style={{ background: G.bg, overflow: 'hidden' }}>
      {/* 背景层：硬切藏在遮挡帧内 */}
      <div style={{ position: 'absolute', inset: 0, transform: `translateX(${shove}px)` }}>
        {f < CUT_F ? <SceneContent content={sceneA} /> : <SceneContent content={sceneB} />}
      </div>
      {/* 手动残影：4 层拖尾（在主卡身后），保证遮挡窗口糊满全屏 */}
      {sweeping &&
        [4, 3, 2, 1].map((i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: xAt(f - i * 0.55, SW_START_F, SW_END_F),
              top: 40,
              width: 1600,
              height: 1000,
              transform: 'scale(1.6)',
              opacity: [0, 0.18, 0.11, 0.07, 0.04][i],
              filter: 'blur(14px)',
            }}
          >
            <OcclusionCard label={card.label} value={card.value} />
          </div>
        ))}
      {/* 主卡：1600x1000 放大 1.6 倍（2560x1600 超出画幅），自带 blur 加强糊感 */}
      {sweeping && (
        <div
          style={{
            position: 'absolute',
            left: x,
            top: 40,
            width: 1600,
            height: 1000,
            transform: `scale(1.6) skewX(${-v * 0.018}deg)`,
            filter: 'blur(8px)',
            boxShadow: '0 24px 80px rgba(44,36,22,0.25)',
            borderRadius: 20,
          }}
        >
          <OcclusionCard label={card.label} value={card.value} />
        </div>
      )}
    </AbsoluteFill>
  );
};

export interface InvisibleCutProps {
  sceneA?: SceneContentData;
  sceneB?: SceneContentData;
  card?: { label: string; value: string };
  revealAtSec?: number; // 口播对齐：硬切（sceneA→sceneB）的段内秒；提供后 sceneA 展示到该时刻
}

const OcclusionCard: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div
    style={{
      width: '100%',
      height: '100%',
      background: G.card,
      border: `2px solid ${G.border}`,
      borderRadius: 20,
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 24,
    }}
  >
    <div style={{ fontFamily: FONT_STACK, fontSize: 96, fontWeight: 800, color: G.ink }}>
      {label}
    </div>
    <div style={{ fontFamily: FONT_STACK, fontSize: 140, fontWeight: 800, color: G.accent }}>
      {value}
    </div>
  </div>
);

export const InvisibleCut: React.FC<InvisibleCutProps> = ({
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
  card = { label: '指标', value: '+18%' },
  revealAtSec,
}) => <Scene sceneA={sceneA} sceneB={sceneB} card={card} revealAtSec={revealAtSec} />;
