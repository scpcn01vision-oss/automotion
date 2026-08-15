// === 可调参数 ===
// DURATION: 180（总帧数，可调；弹性段随 DURATION 等比缩放）
// 色彩: 走纸墨 G 色板（src/_fixtures/Fixtures.tsx）——文字 G.ink / 背景 G.bg / 强调 G.accent
// 功能: 钩子,宣告
// props: card（甩入卡内容）
// === 时间特性 ===
// 策略: 弹刚 ShotTime（刚弹分段）
// 刚性（不可压缩）: 甩入+过冲回弹 0–22f（透视甩入与落定回弹，核心动作固定）
// 弹性（可伸缩）: 后段全静止 hold 22–180
// === 适配注意 ===
// 甩入段固定不随段长伸缩（0.73s）；段长不足 30f（22+8）时回退原始帧。
// 金田透视急停（kanada-perspective-snap）——金田伊功式夸张透视入场。
// 一张卡片以鱼眼级夸张透视姿态高速甩入画面中心：容器 perspective 300→1500px
// （短焦→长焦，透视畸变随之收敛），卡片 rotate3d(0.5,1,0.1) 58°→0 +
// scale 1.7→1 + translateX -700→0，近角冲出画面感。落定瞬间"啪"地弹平：
// rotateY 过冲 +5° 再 4f 回 0；同时 6px 震屏 2f 衰减，拉长斜影收为正常投影。
// 甩入期整卡叠 blur(2px) 增速感，落定即摘（保证收尾逐帧全同）。
// 关键帧：0–18 透视甩入（out cubic）→ 14–18 rotateY 过冲至 +5° →
// 18–22 回弹归 0 + 震屏衰减 + 阴影收正 → 22–130 全静止（≥45f）。
import React from 'react';
import { interpolate, Easing } from 'remotion';
import { G } from '../../_fixtures/Fixtures';
import { FONT_STACK } from '../../_system/typography';

import { useShotFrame } from '../../../engine/useShotFrame';
import type { ShotTime } from '../../../engine/time';

  // 时长画像：甩入+回弹刚性（0–22f），尾部静止弹性（2026-08-14 精修）
  const SHOT_TIME: ShotTime = {
    segments: [
      { from: 0, to: 22, mode: 'rigid' },
      { from: 22, to: 180, mode: 'elastic', minFrames: 8 },
    ],
    minFrames: 30,
  };

// 确定性伪随机（震屏抖动用）
const h = (n: number): number => {
  const s = Math.sin(n * 127.3) * 43758.5453;
  return s - Math.floor(s);
};

const CLAMP = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

const CARD_W = 520;
const CARD_H = 340;
const CX = (1920 - CARD_W) / 2; // 700
const CY = (1080 - CARD_H) / 2; // 370

export interface KanadaPerspectiveSnapProps {
  card?: { label: string; value: string };
}

const MiniCard: React.FC<{ w: number; h: number; label: string; value: string }> = ({ w, h, label, value }) => (
  <div
    style={{
      width: w,
      height: h,
      background: G.card,
      border: `2px solid ${G.border}`,
      borderRadius: 14,
      padding: 26,
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      gap: 12,
    }}
  >
    <div style={{ fontFamily: FONT_STACK, fontSize: 28, fontWeight: 800, color: G.ink, overflowWrap: 'break-word' }}>
      {label}
    </div>
    <div style={{ fontFamily: FONT_STACK, fontSize: 40, fontWeight: 800, color: G.accent }}>
      {value}
    </div>
  </div>
);

export const KanadaPerspectiveSnap: React.FC<KanadaPerspectiveSnapProps> = ({
  card = { label: '指标一', value: '+18%' },
}) => {
  const frame = useShotFrame(SHOT_TIME);

  // 0–18f 甩入主通道（out cubic：先猛后缓，急停感）
  const p = interpolate(frame, [0, 18], [0, 1], { ...CLAMP, easing: Easing.out(Easing.cubic) });
  const persp = interpolate(p, [0, 1], [300, 1500]); // 短焦鱼眼→长焦收平
  const angle3d = interpolate(p, [0, 1], [58, 0]); // rotate3d(0.5,1,0.1)
  const scale = interpolate(p, [0, 1], [1.7, 1]);
  const tx = interpolate(p, [0, 1], [-700, 0]);

  // rotateY 过冲通道：14–18f 冲到 +5°，18–22f "啪"地回 0
  const rotY =
    frame < 18
      ? interpolate(frame, [14, 18], [0, 5], CLAMP)
      : interpolate(frame, [18, 22], [5, 0], { ...CLAMP, easing: Easing.out(Easing.cubic) });

  // 落定震屏：18f 起 6px，2f 内衰减到 0（21f 后恒为 0，保证真静止）
  const shakeAmp = frame >= 18 ? interpolate(frame, [18, 21], [6, 0], CLAMP) : 0;
  const shakeX = shakeAmp * (h(frame * 7 + 1) * 2 - 1);
  const shakeY = shakeAmp * (h(frame * 13 + 2) * 2 - 1);

  // 阴影：飞行期拉长斜影（大偏移大模糊）→ 落定收为正常投影（18–22f 收拢）
  const shOff = frame < 18 ? interpolate(p, [0, 1], [1, 0.35]) : interpolate(frame, [18, 22], [0.35, 0], { ...CLAMP, easing: Easing.out(Easing.quad) });
  const shX = interpolate(shOff, [0, 1], [0, 70]);
  const shY = interpolate(shOff, [0, 1], [8, 52]);
  const shBlur = interpolate(shOff, [0, 1], [14, 36]);
  const shAlpha = interpolate(shOff, [0, 1], [0.16, 0.3]);

  // 甩速 blur：透视扭曲期叠 2px，落定（18f）即摘，收尾无逐帧滤镜
  const blur = frame < 18 ? 2 : 0;

  return (
    <div style={{ width: 1920, height: 1080, background: G.bg, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: shakeX, top: shakeY, width: 1920, height: 1080 }}>
        <div style={{ position: 'absolute', left: 120, top: 96 }}>
          {null}
        </div>
        {/* 落点槽位（虚线框，给"甩到哪"一个参照） */}
        <div
          style={{
            position: 'absolute',
            left: CX - 20,
            top: CY - 20,
            width: CARD_W + 40,
            height: CARD_H + 40,
            border: `3px dashed ${G.bar}`,
            borderRadius: 22,
            boxSizing: 'border-box',
          }}
        />
        {/* 透视容器：perspective 随落定从鱼眼收敛到长焦 */}
        <div style={{ position: 'absolute', left: CX, top: CY, perspective: `${persp}px`, perspectiveOrigin: '30% 50%' }}>
          <div
            style={{
              transform: `translateX(${tx}px) scale(${scale}) rotate3d(0.5, 1, 0.1, ${angle3d}deg) rotateY(${rotY}deg)`,
              transformOrigin: '20% 50%',
              filter: `drop-shadow(${shX}px ${shY}px ${shBlur}px rgba(0,0,0,${shAlpha}))${blur ? ` blur(${blur}px)` : ''}`,
            }}
          >
            <MiniCard w={CARD_W} h={CARD_H} label={card.label} value={card.value} />
          </div>
        </div>
      </div>
    </div>
  );
};
