// === 可调参数 ===
// DURATION: 180（总帧数，可调；弹性段随 DURATION 等比缩放）
// 色彩: 走纸墨 G 色板（src/_fixtures/Fixtures.tsx）——文字 G.ink / 背景 G.bg / 强调 G.accent
// 功能: 展开
// === 时间特性 ===
// 刚性（不可压缩）: 刚性:keycap 15/11f
// 弹性（可伸缩）: 其余段（入场/过渡/收尾/hold）可等比缩放
// === 适配注意 ===
// 调 DURATION 时只动弹性段 interpolate 关键帧，刚性核心帧区间保持固定帧数。
// keycap-smash-cut｜键帽引信+猛切句号（keycap-press-trigger × smash-cut）
// 0–25f 浅底中央 3D 键帽（⌘⏎）悬浮呼吸 → 25–28f 砰按下（3f 下沉 14px +
// 底座 12→3px 压扁 + 键面变暗）+ 底部亮环（扩散 out-cubic / 消散线性解耦）
// → 按下即引爆轰鸣段 28–58f：5 张卡 + 1 面板从四面八方高速飞入冲镜
// （ease-in 全程加速 + scale 1.5→3 冲脸 + 速度门控 blur），背景整体
// ease-in 推近 1→1.3 + 滚动 1.5°——切点前一刻动势最猛 → 58f 一帧猛切：
// FakeDashboard variant="A" 整齐静止全景，键帽已缩成小元素稳稳嵌在
// 顶栏角落（引信呼应），死寂 82f（>50f）。总 140f。
import React from 'react';
import { useCurrentFrame, interpolate, Easing } from 'remotion';
import { G } from '../../_fixtures/Fixtures';
import { SceneContent, SceneContentData } from '../../_system/scene-content';
import { NeutralCard } from '../../_system/neutral-card';
import { FONT_STACK } from '../../_system/typography';

const T = {
  press: 25,      // 按下起始（呼吸周期 25f，此帧位移恰好归零）
  pressEnd: 28,   // 3f 压到底，同帧引爆轰鸣段
  ringGrowEnd: 46, // 亮环扩散结束（out-cubic）
  ringFadeEnd: 52, // 亮环消散结束（线性，帧时间与扩散解耦）
  cut: 58,        // 猛切帧：>=58 全静止
  total: 140,     // 死寂 82f
};

// —— 键帽（复用 keycap 规格：多层 box-shadow 造厚度）——
const Keycap: React.FC<{ size: number; thick: number; bright: number; label?: string }> = ({
  size, thick, bright, label = '⌘⏎',
}) => (
  <div style={{
    width: size, height: size, borderRadius: size * 0.117,
    background: 'linear-gradient(165deg, #ffffff 0%, #f2f2f0 45%, #e2e2e0 100%)',
    border: `2px solid ${G.border}`, boxSizing: 'border-box',
    boxShadow: [
      `0 ${thick}px 0 #6e6e6c`,
      `0 ${thick + 4}px 2px #565654`,
      `0 ${thick * 2 + 10}px ${thick * 2 + 14}px rgba(0,0,0,0.28)`,
      'inset 0 3px 0 rgba(255,255,255,0.9)',
      'inset 0 -6px 10px rgba(0,0,0,0.07)',
    ].join(', '),
    filter: `brightness(${bright})`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }}>
    <div style={{
      fontSize: size * 0.3, fontWeight: 700, color: G.ink,
      fontFamily: FONT_STACK,
    }}>
      {label}
    </div>
  </div>
);

// —— 轰鸣段飞入物：5 张卡 + 1 面板，四面八方冲镜 ——
type Fly = {
  from: [number, number];
  to: [number, number];
  rot: [number, number];
  seed: number;
  w: number;
  h: number;
  panel?: boolean;
};

const FLIES: Fly[] = [
  { from: [-1400, -140], to: [1400, 80], rot: [-6, 5], seed: 1, w: 440, h: 290 },
  { from: [1400, 200], to: [-1400, -120], rot: [7, -4], seed: 2, w: 400, h: 260 },
  { from: [-260, -900], to: [180, 900], rot: [-3, 8], seed: 3, w: 460, h: 300 },
  { from: [-1300, 820], to: [1300, -760], rot: [5, -7], seed: 4, w: 420, h: 280 },
  { from: [1350, -800], to: [-1350, 840], rot: [-8, 4], seed: 5, w: 480, h: 310 },
  // 第 6 位：面板（更大更重，斜穿）
  { from: [1500, 700], to: [-1500, -600], rot: [4, -6], seed: 6, w: 700, h: 430, panel: true },
];

// 卡 i 的第 k 轮：start = 28 + i*3 + k*16，时长 15 / 11（第二轮更快=整体加速）。
// i=3 k=1 的 53–64f 在切点 58f 被硬切截断——绝不减速迎接切点。
const passWindow = (i: number, k: number): [number, number] => {
  const start = T.pressEnd + i * 3 + k * 16;
  const dur = k === 0 ? 15 : 11;
  return [start, start + dur];
};

const FlyItem: React.FC<{ fly: Fly; i: number; frame: number; cards: SceneContentData[] }> = ({ fly, i, frame, cards }) => {
  let active: [number, number] | null = null;
  for (let k = 0; k < 2; k++) {
    const [s, e] = passWindow(i, k);
    if (frame >= s && frame < e) { active = [s, e]; break; }
  }
  if (!active) return null;
  const [s, e] = active;
  // ease-in：全程加速，越近终点越快
  const p = interpolate(frame, [s, e], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.in(Easing.quad),
  });
  const x = fly.from[0] + (fly.to[0] - fly.from[0]) * p;
  const y = fly.from[1] + (fly.to[1] - fly.from[1]) * p;
  const rot = fly.rot[0] + (fly.rot[1] - fly.rot[0]) * p;
  const scale = 1.5 + 1.5 * p; // 冲脸
  const blur = 1 + 4 * p;      // 速度门控方向糊感（ease-in 下速度 ∝ p）
  return (
    <div style={{
      position: 'absolute', left: 960 - fly.w / 2, top: 540 - fly.h / 2,
      transform: `translate(${x}px, ${y}px) rotate(${rot}deg) scale(${scale})`,
      filter: `blur(${blur}px)`,
    }}>
      <NeutralCard
        w={fly.w}
        h={fly.h}
        content={cards[i] ?? cards[0]}
        style={{ boxShadow: fly.panel ? '0 16px 44px rgba(0,0,0,0.28)' : '0 12px 40px rgba(0,0,0,0.25)' }}
      />
    </div>
  );
};

export interface KeycapSmashCutProps {
  scene?: SceneContentData;
  flyingCards?: SceneContentData[];
}

export const KeycapSmashCut: React.FC<KeycapSmashCutProps> = ({
  scene = {
    title: '概览',
    type: 'rows',
    rows: [
      { label: '指标一', value: '+18%' },
      { label: '指标二', value: '2.1×' },
      { label: '指标三', value: '96.4%' },
    ],
  },
  flyingCards = [
    { title: '卡一', rows: [{ label: '指标', value: '+18%' }] },
    { title: '卡二', rows: [{ label: '指标', value: '2.4×' }] },
    { title: '卡三', rows: [{ label: '指标', value: '99%' }] },
    { title: '卡四', rows: [{ label: '指标', value: '45%' }] },
    { title: '卡五', rows: [{ label: '指标', value: '7.1×' }] },
    { title: '面板', rows: [{ label: '项目一', value: 'OK' }, { label: '项目二', value: '—' }, { label: '项目三', value: '✓' }] },
  ],
}) => {
  const frame = useCurrentFrame();

  // —— 死寂段：58f 起 variant A 整齐静止全景 + 键帽小元素嵌顶栏角落，
  //    无任何随帧变化的属性 ——
  if (frame >= T.cut) {
    return (
      <div style={{ width: 1920, height: 1080, position: 'relative' }}>
        <SceneContent content={scene} />
        {/* 键帽句号：稳稳嵌在顶栏（标题条右侧空档），呼应引信 */}
        <div style={{ position: 'absolute', left: 464, top: 12 }}>
          <Keycap size={44} thick={4} bright={1} />
        </div>
      </div>
    );
  }

  // —— 引信段键帽运动 ——
  // 呼吸：0–25f 一个完整正弦周期（±5px），f25 位移归零接按下
  const breathY = frame < T.press ? -5 * Math.sin((2 * Math.PI * frame) / T.press) : 0;
  // 按下：3f 下沉 14px，之后保持压死
  const pressY = interpolate(frame, [T.press, T.pressEnd], [0, 14], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  // 底座厚度 12→3px 压扁（灵魂），轰鸣段保持压扁
  const thick = interpolate(frame, [T.press, T.pressEnd], [12, 3], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const bright = interpolate(frame, [T.press, T.pressEnd], [1, 0.9], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  // —— 亮环：扩散 out-cubic 90→640px，消散线性，帧时间解耦，摘罩=条件挂载 ——
  const ringOn = frame >= T.press && frame < T.ringFadeEnd;
  const ringD = interpolate(frame, [T.press, T.ringGrowEnd], [90, 640], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const ringA = interpolate(frame, [T.press, T.ringFadeEnd], [0.9, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const ringBorder = interpolate(frame, [T.press, T.ringGrowEnd], [14, 3], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  // —— 轰鸣段背景动势：整体 ease-in 推近 + 滚动，切点前仍在加速 ——
  const bgScale = interpolate(frame, [T.pressEnd, T.cut], [1, 1.3], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.in(Easing.quad),
  });
  const bgRot = interpolate(frame, [T.pressEnd, T.cut], [0, 1.5], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.in(Easing.quad),
  });

  return (
    <div style={{
      width: 1920, height: 1080, background: G.bg,
      position: 'relative', overflow: 'hidden',
    }}>
      {/* 背景层（浅底 + 键帽 + 亮环），轰鸣段整体加速推近 */}
      <div style={{
        width: 1920, height: 1080, position: 'absolute',
        transform: `scale(${bgScale}) rotate(${bgRot}deg)`,
        transformOrigin: '50% 50%', background: G.bg,
      }}>
        {ringOn && (
          <div style={{
            position: 'absolute', left: 960 - ringD / 2, top: 540 + 120 + pressY - ringD / 2,
            width: ringD, height: ringD, borderRadius: '50%',
            border: `${ringBorder}px solid #4a4a48`, opacity: ringA,
            boxSizing: 'border-box',
          }} />
        )}
        <div style={{
          position: 'absolute', left: 960 - 120, top: 540 - 120,
          transform: `translateY(${breathY + pressY}px)`,
        }}>
          <Keycap size={240} thick={thick} bright={bright} />
        </div>
      </div>

      {/* 轰鸣段飞入物 */}
      {frame >= T.pressEnd && FLIES.map((fly, i) => (
        <FlyItem key={i} fly={fly} i={i} frame={frame} cards={flyingCards} />
      ))}
    </div>
  );
};
