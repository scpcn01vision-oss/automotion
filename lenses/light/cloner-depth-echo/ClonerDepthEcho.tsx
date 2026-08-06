// === 可调参数 ===
// DURATION: 180（总帧数，可调；弹性段随 DURATION 等比缩放）
// 色彩: 走纸墨 G 色板（src/_fixtures/Fixtures.tsx）——文字 G.ink / 背景 G.bg / 强调 G.accent
// 功能: 展开
// props: card（克隆卡内容）
// === 时间特性 ===
// 刚性（不可压缩）: 刚性:吸回10f
// 弹性（可伸缩）: 其余段（入场/过渡/收尾/hold）可等比缩放
// === 适配注意 ===
// 调 DURATION 时只动弹性段 interpolate 关键帧，刚性核心帧区间保持固定帧数。
// cloner-depth-echo —— 克隆纵队
// 一张主卡瞬间"复印"出 7 个克隆体沿 Z 轴向后等距排开（间隔 120px、
// opacity 100%→20% 衰减、整队 8° rotateY 侧视），12f 错峰弹出；停 25f；
// 全部克隆加速吸回本体合一（10f ease-in），合体瞬间本体弹 1.08x。
// 收尾 f120 后真静止 40f。全部 frame 派生。
import React from 'react';
import { useCurrentFrame, interpolate, spring, Easing } from 'remotion';
import { G } from '../../_fixtures/Fixtures';
import { FONT_STACK } from '../../_system/typography';

const FPS = 30;
const N = 7; // 克隆数
const GAP_Z = 120;

const SPREAD_START = 18; // 排开起始帧
const HOLD_END = 18 + 12 + 25; // f55：停留结束
const MERGE_DUR = 10; // 吸回时长

export interface ClonerDepthEchoProps {
  card?: { label: string; value: string };
}

const CloneCard: React.FC<{ label: string; value: string; glow?: boolean }> = ({ label, value, glow }) => (
  <div
    style={{
      width: 520,
      height: 340,
      background: G.card,
      border: `2px solid ${G.border}`,
      borderRadius: 14,
      padding: 26,
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      gap: 12,
      boxShadow: glow ? '0 10px 36px rgba(31,28,23,0.22)' : undefined,
    }}
  >
    <div style={{ fontFamily: FONT_STACK, fontSize: 28, fontWeight: 800, color: G.ink, overflowWrap: 'break-word' }}>
      {label}
    </div>
    <div style={{ fontFamily: FONT_STACK, fontSize: 42, fontWeight: 800, color: G.accent }}>
      {value}
    </div>
  </div>
);

export const ClonerDepthEcho: React.FC<ClonerDepthEchoProps> = ({
  card = { label: '指标一', value: '+18%' },
}) => {
  const frame = useCurrentFrame();

  // 吸回进度（全体同步，ease-in 加速）
  const merge = interpolate(frame, [HOLD_END, HOLD_END + MERGE_DUR], [0, 1], {
    easing: Easing.in(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // 合体瞬间本体弹一下
  const popS = spring({
    frame: frame - (HOLD_END + MERGE_DUR),
    fps: FPS,
    config: { damping: 11, stiffness: 200, mass: 0.7 },
    durationInFrames: 18,
  });
  const heroScale = frame >= HOLD_END + MERGE_DUR ? 1 + 0.08 * Math.sin(popS * Math.PI) : 1;

  return (
    <div style={{ width: 1920, height: 1080, background: G.bg, overflow: 'hidden', position: 'relative' }}>
      <div style={{ position: 'absolute', inset: 0, perspective: 1600, perspectiveOrigin: '58% 46%' }}>
        <div
          style={{
            position: 'absolute',
            left: 960 - 260,
            top: 540 - 170 + 40,
            transformStyle: 'preserve-3d',
            transform: 'rotateY(16deg)',
          }}
        >
          {/* 克隆队列：从后往前渲染保证遮挡正确 */}
          {Array.from({ length: N }, (_, k) => N - k).map((idx) => {
            // idx 1..N，idx 越大越靠后
            const spread = spring({
              frame: frame - SPREAD_START - (idx - 1) * 1.6,
              fps: FPS,
              config: { damping: 14, stiffness: 160, mass: 0.8 },
              durationInFrames: 16,
            });
            const p = spread * (1 - merge);
            const z = -GAP_Z * idx * p;
            // 斜向错位让纵队肉眼可见（像侧看一列纵队）
            const dx = 64 * idx * p;
            const dy = -34 * idx * p;
            const op = (1 - (idx / N) * 0.8) * spread * (1 - merge);
            if (op <= 0.005) return null;
            return (
              <div
                key={idx}
                style={{
                  position: 'absolute',
                  transform: `translate3d(${dx.toFixed(2)}px, ${dy.toFixed(2)}px, ${z.toFixed(2)}px)`,
                  opacity: op,
                }}
              >
                <CloneCard label={card.label} value={card.value} />
              </div>
            );
          })}
          {/* 本体 */}
          <div style={{ position: 'absolute', transform: `translateZ(0px) scale(${heroScale.toFixed(4)})` }}>
            <CloneCard label={card.label} value={card.value} glow />
          </div>
        </div>
      </div>
    </div>
  );
};
