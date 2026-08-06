// === 可调参数 ===
// DURATION: 180（总帧数，可调；弹性段随 DURATION 等比缩放）
// 色彩: 走纸墨 G 色板（src/_fixtures/Fixtures.tsx）——文字 G.ink / 背景 G.bg / 强调 G.accent
// 功能: 钩子,宣告
// props: sceneA / sceneB（轰鸣/死寂前后景内容承载）、cards（飞掠卡内容）
// === 时间特性 ===
// 刚性（不可压缩）: 刚性:每镜9f等长硬切
// 弹性（可伸缩）: 其余段（入场/过渡/收尾/hold）可等比缩放
// === 适配注意 ===
// 调 DURATION 时只动弹性段 interpolate 关键帧，刚性核心帧区间保持固定帧数。
// smash-cut｜猛切（喧闹→死寂）
// 0–41f 轰鸣段：5 张 Card 多方向高速飞掠冲镜（穿屏 translate + scale 1.5→3
// 冲脸 + 微 rotate，各卡错峰跑两轮，第二轮更快=整体仍在加速），背景
// FakeDashboard A 以 ease-in 持续加速推近 1→1.55 并滚动 rotate 1.8°——
// 切点前一刻动势最猛。42f 一帧硬切 variant B 整齐静止全景，无一物在动，
// 停满 93f（>50f）。反差即手法本体。总 135f。
import React from 'react';
import { useCurrentFrame, interpolate, Easing } from 'remotion';
import { G } from '../../_fixtures/Fixtures';
import { SceneContent, SceneContentData } from '../../_system/scene-content';
import { FONT_STACK } from '../../_system/typography';

const CUT = 42; // 硬切帧：>=42 全静止

// 每张飞卡：两轮 pass，第二轮更短（更快），ease-in 让每一程都在加速。
// from/to 为屏幕外起终点（中心系坐标），飞行中 scale 1.5→3 冲脸。
type Fly = {
  from: [number, number];
  to: [number, number];
  rot: [number, number]; // 微旋转 起→终
  w: number;
  h: number;
};

const FLIES: Fly[] = [
  { from: [-1400, -120], to: [1400, 60], rot: [-6, 5], w: 440, h: 290 },
  { from: [1400, 180], to: [-1400, -100], rot: [7, -4], w: 400, h: 260 },
  { from: [-300, -900], to: [200, 900], rot: [-3, 8], w: 460, h: 300 },
  { from: [-1300, 800], to: [1300, -750], rot: [5, -7], w: 420, h: 280 },
  { from: [1350, -780], to: [-1350, 820], rot: [-8, 4], w: 480, h: 310 },
];

// 卡 i 的第 k 轮：start = i*4 + k*20，时长 16 / 12（第二轮更快）。
// card4 第二轮 36–48f 在切点 42f 被硬切截断——正中"绝不减速迎接切点"。
const passWindow = (i: number, k: number): [number, number] => {
  const start = i * 4 + k * 20;
  const dur = k === 0 ? 16 : 12;
  return [start, start + dur];
};

const FlyCard: React.FC<{
  fly: Fly;
  i: number;
  frame: number;
  label: string;
  value: string;
}> = ({ fly, i, frame, label, value }) => {
  // 找当前活跃的 pass（两轮）
  let active: [number, number] | null = null;
  for (let k = 0; k < 2; k++) {
    const [s, e] = passWindow(i, k);
    if (frame >= s && frame < e) { active = [s, e]; break; }
  }
  if (!active) return null;
  const [s, e] = active;
  // ease-in：全程加速，越接近终点越快
  const p = interpolate(frame, [s, e], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.in(Easing.quad),
  });
  const x = fly.from[0] + (fly.to[0] - fly.from[0]) * p;
  const y = fly.from[1] + (fly.to[1] - fly.from[1]) * p;
  const rot = fly.rot[0] + (fly.rot[1] - fly.rot[0]) * p;
  const scale = 1.5 + 1.5 * p; // 1.5 → 3 冲脸
  // 速度门控方向模糊感：ease-in 下瞬时速度 ∝ p，速度越快越糊
  const blur = 1 + 4 * p;
  return (
    <div style={{
      position: 'absolute', left: 960 - fly.w / 2, top: 540 - fly.h / 2,
      transform: `translate(${x}px, ${y}px) rotate(${rot}deg) scale(${scale})`,
      filter: `blur(${blur}px)`,
    }}>
      <div
        style={{
          width: fly.w,
          height: fly.h,
          background: G.card,
          border: `2px solid ${G.border}`,
          borderRadius: 14,
          boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
          padding: 18,
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        <div style={{ fontFamily: FONT_STACK, fontSize: 24, fontWeight: 800, color: G.ink, overflowWrap: 'break-word' }}>
          {label}
        </div>
        <div style={{ fontFamily: FONT_STACK, fontSize: 34, fontWeight: 800, color: G.accent }}>
          {value}
        </div>
      </div>
    </div>
  );
};

export interface SmashCutProps {
  sceneA?: SceneContentData;
  sceneB?: SceneContentData;
  cards?: { label: string; value: string }[];
}

export const SmashCut: React.FC<SmashCutProps> = ({
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
  cards = [
    { label: '指标一', value: '+18%' },
    { label: '指标二', value: '2.1×' },
    { label: '指标三', value: '96.4%' },
    { label: '节点', value: '4/4' },
    { label: '延迟', value: '42ms' },
  ],
}) => {
  const frame = useCurrentFrame();

  // —— 死寂段：42f 起 variant B 整齐静止全景，无任何动画属性 ——
  if (frame >= CUT) {
    return <SceneContent content={sceneB} />;
  }

  // —— 轰鸣段：背景 ease-in 加速推近 + 滚动，切点前 3f 仍在加速 ——
  const bgScale = interpolate(frame, [0, CUT], [1, 1.55], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.in(Easing.quad),
  });
  const bgRot = interpolate(frame, [0, CUT], [0, 1.8], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.in(Easing.quad),
  });

  return (
    <div style={{ width: 1920, height: 1080, background: G.bg, overflow: 'hidden', position: 'relative' }}>
      <div style={{
        width: 1920, height: 1080,
        transform: `scale(${bgScale}) rotate(${bgRot}deg)`,
        transformOrigin: '50% 50%',
        filter: 'blur(1.5px)', // 背景轻糊，衬前景飞卡
      }}>
        <SceneContent content={sceneA} />
      </div>
      {FLIES.map((fly, i) => (
        <FlyCard key={i} fly={fly} i={i} frame={frame} label={cards[i]?.label ?? ''} value={cards[i]?.value ?? ''} />
      ))}
    </div>
  );
};
