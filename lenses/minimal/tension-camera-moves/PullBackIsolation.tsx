// === 可调参数 ===
// DURATION: 180（总帧数，可调；弹性段随 DURATION 等比缩放）
// 色彩: 走纸墨 G 色板（src/_fixtures/Fixtures.tsx）——文字 G.ink / 背景 G.bg / 强调 G.accent
// 功能: 宣告,举证
// props: value（主卡数字）、cards（8 张兄弟卡内容）
// === 时间特性 ===
// 刚性（不可压缩）: 无（全程弹性）
// 弹性（可伸缩）: 全程可等比缩放（时长适配语音）
// === 适配注意 ===
// 调 DURATION 时只动弹性段 interpolate 关键帧，刚性核心帧区间保持固定帧数。
// 拉远孤立收束（pull-back-isolation）——pull-back shot。
// 相机容器 scale 2.2→0.62（0–110f，Easing.out(cubic)）：开场怼在主卡
// "99.9%" 特写上，缓缓后拉露出周围 8 张兄弟卡。帧 30 起兄弟卡按离主卡
// 距离由近到远错峰熄灭（每 8f 一张，opacity→0 + brightness 压暗）；
// 背景 60–110f 从 #ececea 沉入 #141414；主卡白光晕 60–100f 淡入。
// 帧 110–150 完全静止：暗场中央孤悬一张发光小卡——全片只为这一个数字。
import React from 'react';
import { useCurrentFrame, interpolate, interpolateColors, Easing } from 'remotion';
import { G } from '../../_fixtures/Fixtures';

// 8 张兄弟卡：相对主卡中心 (960,540) 的偏移 + 尺寸 + seed
const SIBS = [
  { dx: -620, dy: -330, w: 360, h: 240 },
  { dx: 10, dy: -390, w: 420, h: 220 },
  { dx: 620, dy: -320, w: 380, h: 260 },
  { dx: -680, dy: 20, w: 340, h: 230 },
  { dx: 700, dy: 40, w: 360, h: 250 },
  { dx: -600, dy: 360, w: 400, h: 240 },
  { dx: 40, dy: 400, w: 440, h: 220 },
  { dx: 640, dy: 350, w: 370, h: 250 },
].map((s) => ({ ...s, dist: Math.hypot(s.dx, s.dy) }));

// 按离主卡距离排名 → 错峰熄灭顺序（近的先灭）
const RANKED = SIBS.map((s, i) => i).sort((a, b) => SIBS[a].dist - SIBS[b].dist);
const FADE_START = RANKED.reduce<number[]>((acc, idx, rank) => {
  acc[idx] = 30 + rank * 8;
  return acc;
}, []);
const FADE_DUR = 16;

const clamp = { extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const };

const MiniCard: React.FC<{ w: number; h: number; label: string; value: string }> = ({ w, h, label, value }) => (
  <div
    style={{
      width: w,
      height: h,
      background: G.card,
      border: `2px solid ${G.border}`,
      borderRadius: 14,
      padding: 16,
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      gap: 8,
    }}
  >
    <div style={{ fontFamily: 'Helvetica, Arial, sans-serif', fontSize: 18, fontWeight: 800, color: G.ink, overflowWrap: 'break-word' }}>
      {label}
    </div>
    <div style={{ fontFamily: 'Helvetica, Arial, sans-serif', fontSize: 26, fontWeight: 800, color: G.accent }}>
      {value}
    </div>
  </div>
);

export interface PullBackIsolationProps {
  value?: string;
  cards?: { label: string; value: string }[];
}

export const PullBackIsolation: React.FC<PullBackIsolationProps> = ({
  value = '99.9%',
  cards = [
    { label: '指标一', value: '+18%' },
    { label: '指标二', value: '2.1×' },
    { label: '指标三', value: '96.4%' },
    { label: '节点', value: '4/4' },
    { label: '延迟', value: '42ms' },
    { label: '可用性', value: '99.98%' },
    { label: '覆盖率', value: '87%' },
    { label: '吞吐', value: '1.2k/s' },
  ],
}) => {
  const frame = useCurrentFrame();

  // 相机后拉：2.2（怼脸特写）→ 0.62（大远景孤悬）
  const scale = interpolate(frame, [0, 110], [2.2, 0.62], {
    easing: Easing.out(Easing.cubic),
    ...clamp,
  });

  // 背景沉入黑暗：G.panel → G.side（60–110f）
  const bgT = interpolate(frame, [60, 110], [0, 1], { easing: Easing.inOut(Easing.quad), ...clamp });
  const bg = interpolateColors(bgT, [0, 1], [G.panel, G.side]);

  // 主卡白光晕淡入（60–100f）
  const glow = interpolate(frame, [60, 100], [0, 0.35], { ...clamp });

  return (
    <div style={{ width: 1920, height: 1080, background: bg, overflow: 'hidden', position: 'relative' }}>
      {/* 相机容器：以主卡中心（画面中心）为原点整体缩放 */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: `scale(${scale})`,
          transformOrigin: '960px 540px',
        }}
      >
        {/* 兄弟卡：错峰熄灭 */}
        {SIBS.map((s, i) => {
          const t0 = FADE_START[i];
          const op = interpolate(frame, [t0, t0 + FADE_DUR], [1, 0], {
            easing: Easing.out(Easing.quad),
            ...clamp,
          });
          const bright = interpolate(frame, [t0, t0 + FADE_DUR], [1, 0.3], { ...clamp });
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: 960 + s.dx - s.w / 2,
                top: 540 + s.dy - s.h / 2,
                opacity: op,
                filter: `brightness(${bright})`,
              }}
            >
              <MiniCard w={s.w} h={s.h} label={cards[i]?.label ?? ''} value={cards[i]?.value ?? ''} />
            </div>
          );
        })}

        {/* 主卡：520×340 居中，叠大数字 + 白光晕 */}
        <div
          style={{
            position: 'absolute',
            left: 960 - 260,
            top: 540 - 170,
            width: 520,
            height: 340,
            borderRadius: 14,
            boxShadow: `0 0 80px rgba(255,255,255,${glow}), 0 0 160px rgba(255,255,255,${glow * 0.6})`,
          }}
        >
          <MiniCard w={520} h={340} label={cards[0]?.label ?? ''} value={cards[0]?.value ?? ''} />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'Helvetica, Arial, sans-serif',
              fontWeight: 800,
              fontSize: 128,
              letterSpacing: -3,
              color: G.ink,
              background: G.card,
              borderRadius: 14,
            }}
          >
            {value}
          </div>
        </div>
      </div>
    </div>
  );
};
