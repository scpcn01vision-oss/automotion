// === 可调参数 ===
// DURATION: 180（总帧数，可调；弹性段随 DURATION 等比缩放）
// 色彩: 走纸墨 G 色板（src/_fixtures/Fixtures.tsx）——文字 G.ink / 背景 G.bg / 强调 G.accent
// 功能: 展开,举证
// props: title（爆入大标题）、scene（爆黑前播放的内容承载）
// === 时间特性 ===
// 刚性（不可压缩）: 刚性:每卡12f
// 弹性（可伸缩）: 其余段（入场/过渡/收尾/hold）可等比缩放
// === 适配注意 ===
// 调 DURATION 时只动弹性段 interpolate 关键帧，刚性核心帧区间保持固定帧数。
// 落拍黑场爆开（drop-blackout-slam）——EDM concert blackout 的节奏手法：
// 帧 0–49:内容正常"播放"(scale 呼吸 1.0↔1.02)+右下角节拍点每 12f 闪一下;
// 帧 50–61:一帧切纯黑,整整 12f 死寂,屏上完全无物(蓄力全靠这一拍静默);
// 帧 62:白色大标题从 scale 1.35 撞到 1.0(5f cubic out),同帧整屏
// 10px 震屏指数衰减(τ≈2.5f,约 12f 收干),底色变 G.ink 并从中心泛出一圈
// 快速消散的亮环;帧 ~80 起全静止到 130,收尾 ≥40f 真静止。
import React from 'react';
import { useCurrentFrame, interpolate, Easing } from 'remotion';
import { G } from '../../_fixtures/Fixtures';
import { SceneContent, SceneContentData } from '../../_system/scene-content';

// 帧确定伪随机(硬规矩:禁 Math.random)
const h = (n: number) => {
  const s = Math.sin(n * 127.3) * 43758.5453;
  return s - Math.floor(s);
};

const BLACK_IN = 50; // 切黑帧
const SLAM = 62; // 爆入帧

export interface DropBlackoutSlamProps {
  title?: string;
  scene?: SceneContentData;
}

export const DropBlackoutSlam: React.FC<DropBlackoutSlamProps> = ({
  title = 'DROP',
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

  // ===== 段 1:帧 0–49 正常播放 =====
  if (f < BLACK_IN) {
    // scale 呼吸 1.0↔1.02,周期 48f
    const breathe = 1.01 + 0.01 * Math.sin((f / 48) * Math.PI * 2);
    // 节拍点:每 12f 闪一下(亮 4f 衰减)
    const beatPhase = f % 12;
    const beatOn = interpolate(beatPhase, [0, 1, 5], [0.25, 1, 0.25], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    const beatScale = interpolate(beatPhase, [0, 1, 5], [1, 1.5, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    return (
      <div style={{ width: 1920, height: 1080, background: G.bg, overflow: 'hidden', position: 'relative' }}>
        <div style={{ width: 1920, height: 1080, transform: `scale(${breathe})`, transformOrigin: '50% 50%' }}>
          <SceneContent content={scene} />
        </div>
        {/* 右下角节拍点 */}
        <div
          style={{
            position: 'absolute',
            right: 56,
            bottom: 48,
            width: 36,
            height: 36,
            borderRadius: 18,
            background: G.ink,
            opacity: beatOn,
            transform: `scale(${beatScale})`,
          }}
        />
      </div>
    );
  }

  // ===== 段 2:帧 50–61 纯黑死寂,屏上完全无物 =====
  if (f < SLAM) {
    return <div style={{ width: 1920, height: 1080, background: G.side }} />;
  }

  // ===== 段 3:帧 62 起爆入 =====
  const t = f - SLAM;

  // 标题:scale 1.35 → 1.0,5f cubic out
  const slamScale = interpolate(t, [0, 5], [1.35, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // 震屏:10px 指数衰减,τ≈2.5f,~12f 收干;t≥14 强制归零保证结尾真静止
  const amp = t >= 14 ? 0 : 10 * Math.exp(-t / 2.5);
  const shakeX = amp === 0 ? 0 : (h(f * 3.7 + 1) - 0.5) * 2 * amp;
  const shakeY = amp === 0 ? 0 : (h(f * 7.1 + 2) - 0.5) * 2 * amp;

  // 亮环:从中心快速扩散并消散,~16f 走完(t≥16 后 opacity=0 且不再画)
  const ringR = interpolate(t, [0, 16], [80, 900], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const ringOpacity = interpolate(t, [0, 3, 16], [0.85, 0.55, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div style={{ width: 1920, height: 1080, background: G.ink, overflow: 'hidden', position: 'relative' }}>
      <div
        style={{
          width: 1920,
          height: 1080,
          transform: `translate(${shakeX}px, ${shakeY}px)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {/* 亮环:快速扩散消散 */}
        {t < 16 && (
          <div
            style={{
              position: 'absolute',
              left: 960 - ringR,
              top: 540 - ringR,
              width: ringR * 2,
              height: ringR * 2,
              borderRadius: '50%',
              border: `10px solid ${G.card}`,
              opacity: ringOpacity,
            }}
          />
        )}
        <div
          style={{
            fontFamily: 'Helvetica, Arial, sans-serif',
            fontWeight: 800,
            fontSize: 340,
            color: G.card,
            letterSpacing: -6,
            transform: `scale(${slamScale})`,
            lineHeight: 1,
          }}
        >
          {title}
        </div>
      </div>
    </div>
  );
};
