// === 可调参数 ===
// DURATION: 180（总帧数，可调；弹性段随 DURATION 等比缩放）
// 功能: 展开
// 描述: 声纹实时起伏——说话时波形起伏、停顿缩成点线
// 色彩: 走纸墨 G 色板（src/_fixtures/Fixtures.tsx）——文字 G.ink / 背景 G.bg / 强调 G.accent
// === 时间特性 ===
// 刚性（不可压缩）: 无（全程弹性）
// 弹性（可伸缩）: 全程可等比缩放（时长适配语音）
// === 适配注意 ===
// 调 DURATION 时只动弹性段 interpolate 关键帧，刚性核心帧区间保持固定帧数。
// voice-waveform-live —— raycast-teams 19.5–26s：
// 录音胶囊内实时声纹：细竖条随"说话"起伏（种子随机+相邻插值），
// 说话时中部高耸、停顿缩成点线，波形从右往左滚动；右端提交钮。
// 演：说(0.5–1.9s) → 停(1.9–2.7s) → 说(2.7–4.1s) → 提交(4.1–5s)。
import React from 'react';
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';
import { G } from '../../_fixtures/Fixtures';
import { FONT_STACK } from '../../_system/typography';

const mulberry32 = (a: number) => () => {
  let t = (a += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

// 值噪声：整数采样点取种子随机值，采样点之间平滑插值
const noiseAt = (x: number) => {
  const i = Math.floor(x);
  const fr = x - i;
  const a = mulberry32(i * 7919 + 13)();
  const b = mulberry32((i + 1) * 7919 + 13)();
  const s = fr * fr * (3 - 2 * fr); // smoothstep
  return a + (b - a) * s;
};

// 说话包络（按"声音发生时刻"计）：说→停→说
const envelope = (t: number) => {
  const seg = (a: number, b: number, rise = 5, fall = 7) =>
    interpolate(t, [a, a + rise, b - fall, b], [0, 1, 1, 0], {
      extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    });
  // 两段说话内部再叠音节起伏
  const talk = Math.max(seg(15, 57), seg(80, 124));
  const syllable = 0.55 + 0.45 * noiseAt(t / 4.5 + 200);
  return talk * syllable;
};

const N_BARS = 64;

export interface VoiceWaveformLiveProps {
  statusText?: string;
}

export const VoiceWaveformLive: React.FC<VoiceWaveformLiveProps> = ({ statusText }) => {
  const f = useCurrentFrame();

  // 提交动作
  const submitAt = 126;
  const submitted = f >= submitAt;
  const btnPress = interpolate(f, [submitAt, submitAt + 3, submitAt + 9], [1, 0.82, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.out(Easing.ease),
  });
  // 提交后波形整体塌缩 + 胶囊微缩离场感
  const collapse = interpolate(f, [submitAt, submitAt + 12], [1, 0.06], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.in(Easing.ease),
  });
  const capsuleScale = interpolate(f, [submitAt, submitAt + 20], [1, 0.96], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.out(Easing.ease),
  });

  // 胶囊入场
  const inOp = interpolate(f, [0, 12], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.out(Easing.ease),
  });
  const inScale = interpolate(f, [0, 14], [1.04, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  const SCROLL = 1.6; // 帧→采样时间比：滚动速度

  const bars = Array.from({ length: N_BARS }).map((_, i) => {
    // 从右往左滚动：最右条是"现在"，越靠左越旧
    const sampleT = f - (N_BARS - 1 - i) * SCROLL;
    const env = sampleT < 0 ? 0 : envelope(sampleT);
    // 空间权重：中部高耸
    const center = Math.pow(Math.sin((i / (N_BARS - 1)) * Math.PI), 0.8);
    const jitter = 0.35 + 0.65 * noiseAt(sampleT * 1.7 + i * 0.13);
    const hRaw = env * center * jitter;
    const h = Math.max(5, hRaw * 235 * collapse); // 静默=5px 点线
    return h;
  });

  const nowEnv = envelope(f);
  const micGlow = submitted ? 0 : nowEnv;

  return (
    <AbsoluteFill style={{ background: G.bg, overflow: 'hidden' }}>
      {/* 纸色淡光 */}
      <div style={{
        position: 'absolute', left: -300, top: -200, width: 2600, height: 1700,
        background: 'radial-gradient(closest-side, rgba(211,146,60,0.12), rgba(0,0,0,0) 70%)',
        transform: `translate(${f * 0.6}px, ${f * 0.25}px)`,
      }} />

      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
        {statusText ? (
          <div
            style={{
              position: 'absolute', top: 250, width: '100%', textAlign: 'center',
              fontFamily: FONT_STACK, fontSize: 26,
              fontWeight: 700, letterSpacing: 4, color: G.mid, opacity: inOp,
            }}
          >
            {statusText}
          </div>
        ) : null}
        <div
          style={{
            width: 1320, height: 300, borderRadius: 150,
            opacity: inOp,
            transform: `scale(${inScale * capsuleScale})`,
            background:
              `linear-gradient(180deg, ${G.card}, ${G.panel})`,
            border: `2px solid ${G.border}`,
            padding: 2.5, boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              width: '100%', height: '100%', borderRadius: 148,
              background: G.bg,
              boxShadow: '0 20px 50px rgba(0,0,0,0.10)',
              display: 'flex', alignItems: 'center', gap: 36,
              padding: '0 44px', boxSizing: 'border-box',
            }}
          >
            {/* 麦克风圆钮：说话时发亮 */}
            <div
              style={{
                width: 96, height: 96, borderRadius: 48, flexShrink: 0,
                background: `rgba(211,146,60,${0.06 + micGlow * 0.14})`,
                border: `2.5px solid ${G.border}`,
                boxShadow: `0 0 ${28 * micGlow}px rgba(211,146,60,${micGlow * 0.5})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 46, boxSizing: 'border-box',
              }}
            >
              🎙️
            </div>

            {/* 声纹条区 */}
            <div style={{
              flex: 1, height: 244, display: 'flex', alignItems: 'center',
              gap: 6, overflow: 'hidden',
            }}>
              {bars.map((h, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1, height: h, borderRadius: 4,
                    background: `rgba(44,36,22,${0.15 + (h / 235) * 0.55})`,
                  }}
                />
              ))}
            </div>

            {/* 提交钮：白圆 + 上箭头 */}
            <div
              style={{
                width: 96, height: 96, borderRadius: 48, flexShrink: 0,
                background: submitted ? G.accent : G.ink,
                transform: `scale(${btnPress})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: submitted
                  ? `0 0 60px rgba(211,146,60,0.55)`
                  : '0 8px 24px rgba(0,0,0,0.18)',
              }}
            >
              <svg width="44" height="44" viewBox="0 0 24 24">
                <path
                  d="M12 20V5M12 5l-6.5 6.5M12 5l6.5 6.5"
                  stroke={G.card} strokeWidth="3" strokeLinecap="round"
                  strokeLinejoin="round" fill="none"
                />
              </svg>
            </div>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
