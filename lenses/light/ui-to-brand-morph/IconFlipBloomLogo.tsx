// === 可调参数 ===
// DURATION: 180（总帧数，可调；弹性段随 DURATION 等比缩放）
// 色彩: 走纸墨 G 色板（src/_fixtures/Fixtures.tsx）——文字 G.ink / 背景 G.bg / 强调 G.accent
// 功能: 收束
// === 时间特性 ===
// 刚性（不可压缩）: 无（全程弹性）
// 弹性（可伸缩）: 全程可等比缩放（时长适配语音）
// === 适配注意 ===
// 调 DURATION 时只动弹性段 interpolate 关键帧，刚性核心帧区间保持固定帧数。
// icon-flip-bloom-logo —— 图标 Y 轴翻转压扁成竖线，绽放成花形 mark + wordmark 扫出
// 源：perplexity-promo 88–91.5s。笑脸 laptop 图标 anticipation 晃两下 →
// 沿 Y 轴翻转压扁成竖线（拖影/模糊）→ 翻过最薄处绽放花形 mark（花瓣张开）→
// wordmark 从 mark 右侧带方向模糊逐段扫出（字符从糊到锐利）。
import React from 'react';
import { AbsoluteFill, interpolate, Easing, spring, useVideoConfig, useCurrentFrame } from 'remotion';
import { G } from '../../_fixtures/Fixtures';
import { FONT_STACK } from '../../_system/typography';
import { useShotFrame } from '../../../engine/useShotFrame';
import type { ShotTime } from '../../../engine/time';

// 时长画像（迁移自 013 lens-timings.json；全弹性）
const SHOT_TIME: ShotTime = {
  segments: [{ from: 0, to: 180, mode: 'elastic', minFrames: 70 }],
  minFrames: 70,
};


const SmileLaptop: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 40 40">
    <rect x={7} y={6} width={26} height={20} rx={3.5} fill="#fff" stroke={G.ink} strokeWidth={3} />
    <circle cx={15.5} cy={13.5} r={2} fill={G.ink} />
    <circle cx={24.5} cy={13.5} r={2} fill={G.ink} />
    <path d="M14 18.5 Q20 23.5 26 18.5" stroke={G.ink} strokeWidth={2.8} fill="none" strokeLinecap="round" />
    <path d="M3.5 31.5 L36.5 31.5" stroke={G.ink} strokeWidth={3.6} strokeLinecap="round" />
  </svg>
);

// 5 瓣抽象花形 mark，bloom: 0(闭合竖线)→1(全开)
const FlowerMark: React.FC<{ size: number; bloom: number }> = ({ size, bloom }) => {
  const petals = 5;
  return (
    <svg width={size} height={size} viewBox="-50 -50 100 100">
      {Array.from({ length: petals }).map((_, i) => {
        // 从竖直方向(-90°)向两侧展开到均匀分布
        const finalAngle = -90 + (i - (petals - 1) / 2) * (360 / petals);
        const angle = interpolate(bloom, [0, 1], [-90, finalAngle]);
        const len = interpolate(bloom, [0, 1], [20, 38]);
        const wid = interpolate(bloom, [0, 1], [3, 15]);
        return (
          <ellipse
            key={i}
            cx={0}
            cy={-len / 2}
            rx={wid / 2}
            ry={len / 2}
            fill={G.accent}
            opacity={0.92}
            transform={`rotate(${angle + 90})`}
          />
        );
      })}
      <circle r={interpolate(bloom, [0, 1], [2, 9])} fill={G.ink} />
    </svg>
  );
};

export interface IconFlipBloomLogoProps {
  wordmark?: string;
  revealAtSec?: number; // 口播对齐：图标开始翻转（蓄力结束）的段内秒；提供后前段（登场+蓄力）压缩到该时刻前
}

export const IconFlipBloomLogo: React.FC<IconFlipBloomLogoProps> = ({ wordmark = 'inkmark', revealAtSec }) => {
  const frameShot = useShotFrame(SHOT_TIME);
  const realFrame = useCurrentFrame();
  const cueMode = revealAtSec !== undefined;
  const frame = cueMode ? realFrame : frameShot;
  const { fps } = useVideoConfig();

  // ---- 时间轴 ----
  // 0–10: 图标登场（淡入微弹）
  // 12–34: anticipation 倾斜蓄力晃两下
  // 34–46: Y 轴翻转压扁成竖线（scaleX -> 0.04，带拖影）
  // 46–62: 翻过最薄处绽放花形（bloom 0->1 带过冲）
  // 64–100: mark 左移让位 + wordmark 逐字符方向模糊扫出
  const FLIP_START = 34;
  const FLIP_MID = 46;
  const WORD_START = 66;
  const FLIP_F = cueMode ? Math.round(revealAtSec * 30) : FLIP_START;
  const FLIP_MID_F = FLIP_F + (FLIP_MID - FLIP_START);
  const WORD_START_F = FLIP_F + (WORD_START - FLIP_START);
  const preW = cueMode ? Math.min(1, (realFrame / 30) / (revealAtSec ?? 1)) * FLIP_START : frame;

  // 登场
  const inT = spring({ frame: realFrame, fps, config: { damping: 13, stiffness: 140, mass: 0.8 } });

  // anticipation：两次倾斜摆动，幅度递增（-10° / +14°），最后向反方向压一下蓄力
  const wobble =
    interpolate(preW, [12, 18, 24, 30, FLIP_START], [0, -12, 14, -18, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.inOut(Easing.sin),
    });

  // 翻转前半：scaleX 1 -> 0.04（加速入），伴随拖影
  const flipIn = interpolate(frame, [FLIP_F, FLIP_MID_F], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.in(Easing.cubic),
  });
  const iconScaleX = interpolate(flipIn, [0, 1], [1, 0.04]);

  // 绽放：spring 过冲
  const bloomSpring = spring({
    frame: frame - FLIP_MID_F,
    fps,
    config: { damping: 11, stiffness: 130, mass: 0.9 },
  });
  const bloom = frame < FLIP_MID_F ? 0 : bloomSpring;
  // mark 从竖线厚度撑开：scaleX 0.04 -> 1
  const markScaleX = interpolate(bloom, [0, 1], [0.04, 1]);

  // mark 左移让位（wordmark 登场时）
  const shift = interpolate(frame, [WORD_START_F - 2, WORD_START_F + 16], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const markX = interpolate(shift, [0, 1], [0, -420]);

  const showIcon = frame < FLIP_MID_F;

  // 拖影帧（翻转期间画 2 个残影）
  const ghosts = frame >= FLIP_F && frame < FLIP_MID_F ? [0.12, 0.24] : [];

  return (
    <AbsoluteFill style={{ background: G.bg, alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'relative', width: 1920, height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* 图标 / mark 容器 */}
        <div
          style={{
            position: 'absolute',
            left: 960 + markX,
            top: 200,
            transform: 'translate(-50%, -50%)',
          }}
        >
          {showIcon ? (
            <>
              {ghosts.map((g, i) => {
                const gs = Math.min(1, iconScaleX + g);
                return (
                  <div
                    key={i}
                    style={{
                      position: 'absolute',
                      left: '50%',
                      top: '50%',
                      transform: `translate(-50%, -50%) scaleX(${gs})`,
                      opacity: 0.22 - i * 0.08,
                      filter: 'blur(6px)',
                    }}
                  >
                    <SmileLaptop size={340} />
                  </div>
                );
              })}
              <div
                style={{
                  transform: `scale(${inT}) rotate(${wobble}deg) scaleX(${iconScaleX})`,
                  transformOrigin: 'center 78%',
                  filter: flipIn > 0.3 ? `blur(${flipIn * 5}px)` : 'none',
                  opacity: inT,
                }}
              >
                <SmileLaptop size={340} />
              </div>
            </>
          ) : (
            <div style={{ transform: `scaleX(${markScaleX})` }}>
              <FlowerMark size={340} bloom={bloom} />
            </div>
          )}
        </div>

        {/* wordmark：逐字符方向模糊扫出 */}
        <div
          style={{
            position: 'absolute',
            left: 960 + markX + 230,
            top: 200,
            transform: 'translateY(-50%)',
            display: 'flex',
            fontFamily: FONT_STACK,
            fontWeight: 700,
            fontSize: 150,
            color: G.ink,
            letterSpacing: 2,
          }}
        >
          {wordmark.split('').map((ch, i) => {
            const cT = interpolate(frame, [WORD_START + i * 2.2, WORD_START + i * 2.2 + 10], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
              easing: Easing.out(Easing.cubic),
            });
            return (
              <span
                key={i}
                style={{
                  display: 'inline-block',
                  opacity: cT,
                  transform: `translateX(${(1 - cT) * -70}px)`,
                  filter: `blur(${(1 - cT) * 16}px)`,
                }}
              >
                {ch}
              </span>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
