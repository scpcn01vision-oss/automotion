// === 可调参数 ===
// DURATION: 180（总帧数，可调；弹性段随 DURATION 等比缩放）
// 色彩: 走纸墨 G 色板（src/_fixtures/Fixtures.tsx）——文字 G.ink / 背景 G.bg / 强调 G.accent
// 功能: 宣告,举证
// props: value（大数字）、caption（副标）、scene（硬切后内容承载）
// === 时间特性 ===
// 刚性（不可压缩）: 无（全程弹性）
// 弹性（可伸缩）: 全程可等比缩放（时长适配语音）
// === 适配注意 ===
// 调 DURATION 时只动弹性段 interpolate 关键帧，刚性核心帧区间保持固定帧数。
// 慢推压迫（slow-push-in）——studiobinder camera movements。
// 景 A（帧 0–120）：深色底 + 白色大数字，scale 用 Easing.in(Easing.quad)
// 从 1.00 匀加速推到 1.14——前 2 秒几乎不可察，后段明显可感；同时四角径向
// 暗角 opacity 0→0.5 同步加深，构成压迫感的第二来源。
// 帧 120 无任何过渡硬切景 B：满屏亮色内容真静止 30f——
// 暗→亮的大反差让"切"这一拍才响。
import React from 'react';
import { useCurrentFrame, interpolate, Easing } from 'remotion';
import { G } from '../../_fixtures/Fixtures';
import { SceneContent, SceneContentData } from '../../_system/scene-content';

const CUT = 120; // 硬切帧

export interface SlowPushInProps {
  value?: string;
  caption?: string;
  scene?: SceneContentData;
}

export const SlowPushIn: React.FC<SlowPushInProps> = ({
  value = '10x',
  caption = 'GO FURTHER',
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

  // ---- 景 B：帧 120 起，满屏亮面板，完全静止 ----
  if (frame >= CUT) {
    return <SceneContent content={scene} />;
  }

  // ---- 景 A：0–120f 慢推 ----
  // 匀加速推近：Easing.in(quad)——前段几乎不可察，后段可感
  const scale = interpolate(frame, [0, CUT], [1.0, 1.14], {
    easing: Easing.in(Easing.quad),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  // 暗角同步加深：压迫感的第二来源
  const vignette = interpolate(frame, [0, CUT], [0, 0.5], {
    easing: Easing.in(Easing.quad),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        width: 1920,
        height: 1080,
        background: G.side,
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'Helvetica, Arial, sans-serif',
      }}
    >
      {/* 被推近的内容层：整体 scale */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          transform: `scale(${scale})`,
          transformOrigin: '50% 50%',
        }}
      >
        <div
          style={{
            fontSize: 300,
            fontWeight: 800,
            color: G.card,
            letterSpacing: -6,
            lineHeight: 1,
          }}
        >
          {value}
        </div>
        <div
          style={{
            marginTop: 36,
            fontSize: 40,
            fontWeight: 500,
            color: G.mid,
            letterSpacing: 6,
          }}
        >
          {caption}
        </div>
      </div>

      {/* 暗角层：四角径向渐变，随推近同步加深 */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: vignette,
          background:
            'radial-gradient(ellipse 62% 55% at 50% 50%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.95) 100%)',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
};
