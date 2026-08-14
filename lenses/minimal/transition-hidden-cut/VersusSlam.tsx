// === 可调参数 ===
// DURATION: 180（总帧数，可调；弹性段随 DURATION 等比缩放）
// 色彩: 走纸墨 G 色板（src/_fixtures/Fixtures.tsx）——文字 G.ink / 背景 G.bg / 强调 G.accent
// 功能: 转折
// props: sceneA / sceneB（对撞半屏内容承载）、vsText（盖章字块）
// === 时间特性 ===
// 刚性（不可压缩）: 无（全程弹性）
// 弹性（可伸缩）: 全程可等比缩放（时长适配语音）
// === 适配注意 ===
// 调 DURATION 时只动弹性段 interpolate 关键帧，刚性核心帧区间保持固定帧数。
import React from 'react';
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';
import { G } from '../../_fixtures/Fixtures';
import { useShotFrame } from '../../../engine/useShotFrame';
import type { ShotTime } from '../../../engine/time';

// 时长画像（lens-timings 无此镜头；按文件头「全程弹性」+ 关键帧 ~20 标）
const SHOT_TIME: ShotTime = {
  segments: [{ from: 0, to: 180, mode: 'elastic', minFrames: 20 }],
  minFrames: 20,
};
import { SceneContent, SceneContentData } from '../../_system/scene-content';
import { FONT_STACK } from '../../_system/typography';

// versus-slam 对撞开屏：左右两个半屏画面（带 78° 斜切边）从画外加速对冲，
// 沿斜缝砰地撞合；撞击帧白闪 + 整机震屏指数衰减 + "VS" 字块盖章压出，结尾静止 hold。
const IMPACT = 30; // 撞击帧（前 20f 建立 hold + 10f ease-in 对冲）

// 斜缝几何：78° 斜边 → 1080 高度上水平偏移 1080/tan(78°) ≈ 230px，中线 x=960 ±115
const SEAM_TOP_X = 1075; // 缝顶端 x
const SEAM_BOT_X = 845; // 缝底端 x
// CSS 旋转顺时针为正：缝顶端偏右（1075 > 845）→ 正角度 ≈ +12°
const SEAM_DEG = (Math.atan2(SEAM_TOP_X - SEAM_BOT_X, 1080) * 180) / Math.PI;

export interface VersusSlamProps {
  sceneA?: SceneContentData;
  sceneB?: SceneContentData;
  vsText?: string;
  revealAtSec?: number; // 口播对齐：撞击时刻段内秒；提供后前段（建立+对冲）压缩到该时刻前
  sceneAAtSec?: number; // 口播对齐（分时）：sceneA 左屏入场的段内秒
  sceneBAtSec?: number; // 口播对齐（分时）：sceneB 右屏入场（撞合+盖章）的段内秒
}

export const VersusSlam: React.FC<VersusSlamProps> = ({
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
  vsText = 'VS',
  revealAtSec,
  sceneAAtSec,
  sceneBAtSec,
}) => {
  const frame = useShotFrame(SHOT_TIME);
  const realFrame = useCurrentFrame();
  const splitMode = sceneAAtSec !== undefined && sceneBAtSec !== undefined;
  const cueMode = splitMode || revealAtSec !== undefined;
  const f = cueMode ? realFrame : frame;
  const IMPACT_F = splitMode
    ? Math.round(sceneBAtSec * 30)
    : cueMode
      ? Math.round((revealAtSec ?? 0) * 30)
      : IMPACT;

  // 两半屏对冲：ease-in 加速，10f 从 ±1200px 冲到位
  // 口播对齐（分时）：sceneA 在「市场」时刻入场、sceneB 在「公司」时刻入场，各自 20f 滑入
  const leftX = splitMode
    ? interpolate(f, [Math.round(sceneAAtSec * 30), Math.round(sceneAAtSec * 30) + 20], [-1200, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
        easing: Easing.in(Easing.cubic),
      })
    : cueMode
      ? interpolate(f, [0, IMPACT_F], [-1200, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        })
      : interpolate(f, [20, IMPACT], [-1200, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
          easing: Easing.in(Easing.cubic),
        });
  const rightX = splitMode
    ? interpolate(f, [Math.round(sceneBAtSec * 30), Math.round(sceneBAtSec * 30) + 20], [1200, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
        easing: Easing.in(Easing.cubic),
      })
    : -leftX;

  // 撞击帧起：整机震屏 12px 指数衰减（约 5f 收干）
  const since = f - IMPACT_F;
  const env = since >= 0 ? 12 * Math.exp(-since / 1.6) : 0;
  const shakeX = env * Math.sin(since * 3.4);
  const shakeY = env * 0.6 * Math.sin(since * 4.1 + 0.7);

  // 白闪：撞击帧 0.9 → 0，3f 收掉；撞击前必须为 0（clamp 左端会返回 0.9 遮住全屏）
  const flash =
    f >= IMPACT_F
      ? interpolate(f, [IMPACT_F, IMPACT_F + 3], [0.9, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        })
      : 0;

  // "VS" 盖章：scale 1.6 → 1 带 back overshoot，6f 压出
  const vsScale = interpolate(f, [IMPACT_F, IMPACT_F + 6], [1.6, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.back(2.6)),
  });
  const vsOpacity = interpolate(f, [IMPACT_F, IMPACT_F + 2], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const impacted = f >= IMPACT_F;

  return (
    <AbsoluteFill style={{ background: G.bg, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, transform: `translate(${shakeX}px, ${shakeY}px)` }}>
        {/* 建立段的斜缝虚线预示（撞合后被实缝替代） */}
        {!impacted && (
          <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
            <line
              x1={SEAM_TOP_X} y1={0} x2={SEAM_BOT_X} y2={1080}
              stroke={G.bar} strokeWidth={4} strokeDasharray="18 16"
            />
          </svg>
        )}
        {/* 左半屏：FakeDashboard A 裁左半，斜边 78° */}
        <div style={{
          position: 'absolute', left: 0, top: 0, width: 960, height: 1080, overflow: 'hidden',
          transform: `translateX(${leftX}px)`,
          clipPath: `polygon(0px 0px, ${SEAM_TOP_X}px 0px, ${SEAM_BOT_X}px 1080px, 0px 1080px)`,
        }}>
          <SceneContent content={sceneA} titleSize={46} panelWidth={720} />
        </div>
        {/* 右半屏：FakeDashboard B 裁右半 */}
        <div style={{
          position: 'absolute', left: 960, top: 0, width: 960, height: 1080, overflow: 'hidden',
          transform: `translateX(${rightX}px)`,
          // clip-path 坐标相对元素自身（右半 div 宽 960）：缝线屏幕坐标 1075/845 → 相对 115/-115
          clipPath: `polygon(${SEAM_TOP_X - 960}px 0px, 960px 0px, 960px 1080px, ${SEAM_BOT_X - 960}px 1080px)`,
        }}>
          <SceneContent content={sceneB} titleSize={46} panelWidth={720} />
        </div>
        {/* 撞合后的实体斜缝条 */}
        {impacted && (
          <div style={{
            position: 'absolute', left: 960 - 6, top: 540 - 700,
            width: 12, height: 1400, background: G.ink,
            transform: `rotate(${SEAM_DEG}deg)`,
          }} />
        )}
        {/* "VS" 字块盖章：贴缝、随缝倾斜 */}
        {impacted && (
          <div style={{
            position: 'absolute', left: 960, top: 540,
            transform: `translate(-50%, -50%) rotate(${SEAM_DEG}deg) scale(${vsScale})`,
            opacity: vsOpacity,
            background: G.card, border: `6px solid ${G.ink}`, borderRadius: 20,
            padding: '18px 46px', boxShadow: '0 18px 60px rgba(0,0,0,0.35)',
          }}>
            <div style={{ fontFamily: FONT_STACK, fontWeight: 800, fontSize: 140, color: G.ink, letterSpacing: -2 }}>
              {vsText}
            </div>
          </div>
        )}
      </div>
      {/* 撞击白闪（不随震屏位移） */}
      <AbsoluteFill style={{ background: G.card, opacity: flash, pointerEvents: 'none' }} />
    </AbsoluteFill>
  );
};
