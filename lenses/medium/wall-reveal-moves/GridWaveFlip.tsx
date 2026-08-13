// === 可调参数 ===
// DURATION: 180（总帧数，可调；弹性段随 DURATION 等比缩放）
// 色彩: 走纸墨 G 色板（src/_fixtures/Fixtures.tsx）——文字 G.ink / 背景 G.bg / 强调 G.accent
// 功能: 钩子,展开
// === 时间特性 ===
// 刚性（不可压缩）: 刚性:bento first 20f,grid flip 14f+stagger 6f
// 弹性（可伸缩）: 其余段（入场/过渡/收尾/hold）可等比缩放
// === 适配注意 ===
// 调 DURATION 时只动弹性段 interpolate 关键帧，刚性核心帧区间保持固定帧数。
import React from 'react';
import { AbsoluteFill, Easing, interpolate } from 'remotion';
import { G } from '../../_fixtures/Fixtures';
import { NeutralCard } from '../../_system/neutral-card';
import type { SceneContentData } from '../../_system/scene-content';
import { useShotFrame } from '../../../engine/useShotFrame';
import type { ShotTime } from '../../../engine/time';

// 时长画像（lens-timings 无此镜头；按文件头「刚性:bento first 20f,grid flip 14f+stagger 6f」标 20-58）
const SHOT_TIME: ShotTime = {
  segments: [
    { from: 0, to: 20, mode: 'elastic', minFrames: 8 },
    { from: 20, to: 58, mode: 'rigid' },
    { from: 58, to: 180, mode: 'elastic', minFrames: 20 },
  ],
  minFrames: 74,
};

// grid-wave-flip〔入场退场〕：灰背卡片墙沿对角线波前依次 rotateX 翻转 180°，
// 灰背翻成正面内容卡；波浪约一秒扫完全屏，最后一张落定带轻微过冲。
// 排版由 cards.length 驱动：n≤3 一排，n=4 两行两列，5-6 三列两行，>6 三列多行。
// 结构：hold 20f → delay=(row+col)*6f、每张 14f bezier(0.35,0,0.25,1) → 尾张过冲回弹 → 静止收尾。

const CELL_W = 520;
const CELL_H = 280;
const GAP = 36;
const HOLD = 20; // 开头建立
const STAGGER = 6; // 对角线波前步进
const FLIP = 14; // 单张翻转时长

const flipEase = Easing.bezier(0.35, 0, 0.25, 1);

// 单张卡的翻转角度：普通卡 0→180；最后一张（波前最末）过冲到 ~190 再回落 180
const angleAt = (frame: number, row: number, col: number, rows: number, cols: number): number => {
  const delay = HOLD + (row + col) * STAGGER;
  const isLast = row === rows - 1 && col === cols - 1;
  if (!isLast) {
    return interpolate(frame, [delay, delay + FLIP], [0, 180], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: flipEase,
    });
  }
  // 过冲：14f 冲到 190°，再 8f 弹回 180°
  const main = interpolate(frame, [delay, delay + FLIP], [0, 190], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: flipEase,
  });
  const settle = interpolate(frame, [delay + FLIP, delay + FLIP + 8], [0, -10], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  return main + settle;
};

export interface GridWaveFlipProps {
  cards?: SceneContentData[];
}

export const GridWaveFlip: React.FC<GridWaveFlipProps> = ({
  cards = [
    { title: '指标一', rows: [{ label: '数值', value: '+18%' }] },
    { title: '指标二', rows: [{ label: '数值', value: '2.4×' }] },
    { title: '指标三', rows: [{ label: '数值', value: '99%' }] },
  ],
}) => {
  const frame = useShotFrame(SHOT_TIME);
  const n = cards.length;
  const cols = n <= 3 ? n : n === 4 ? 2 : 3;
  const rows = Math.ceil(n / cols);
  const wallW = cols * CELL_W + (cols - 1) * GAP;
  const wallH = rows * CELL_H + (rows - 1) * GAP;

  return (
    <AbsoluteFill
      style={{
        background: G.bg,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {/* 卡片墙：共享 perspective 1200px 容器，整墙一个消失点 */}
      <div
        style={{
          width: wallW,
          height: wallH,
          perspective: 1200,
          perspectiveOrigin: '50% 50%',
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, ${CELL_W}px)`,
          gridTemplateRows: `repeat(${rows}, ${CELL_H}px)`,
          gap: GAP,
        }}
      >
        {Array.from({ length: n }).map((_, i) => {
          const row = Math.floor(i / cols);
          const col = i % cols;
          const angle = angleAt(frame, row, col, rows, cols);
          // 高光线：翻到 90°（最薄处）时最亮，位置随角度从上缘扫向下缘
          const glow = Math.max(0, 1 - Math.abs(angle - 90) / 45);
          const glowTop = interpolate(angle, [45, 135], [8, 92], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          // 翻转中抬起阴影，落定后收回
          const lift = Math.sin(Math.min(Math.max(angle, 0), 180) * (Math.PI / 180));
          return (
            <div key={i} style={{ width: CELL_W, height: CELL_H, position: 'relative' }}>
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  transformStyle: 'preserve-3d',
                  transform: `rotateX(${angle}deg)`,
                  boxShadow: `0 ${4 + lift * 22}px ${10 + lift * 40}px rgba(0,0,0,${0.08 + lift * 0.16})`,
                  borderRadius: 14,
                }}
              >
                {/* 灰背面（初始朝外） */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden',
                    background: G.bar,
                    border: `2px solid ${G.bar}`,
                    borderRadius: 14,
                    boxSizing: 'border-box',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  {/* 背面只留一个哑光圆点标记，强调"灰背" */}
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      background: G.mid,
                      opacity: 0.55,
                    }}
                  />
                </div>
                {/* 正面内容卡（预转 180°，翻过来正好朝外） */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden',
                    transform: 'rotateX(180deg)',
                    borderRadius: 14,
                  }}
                >
                  <NeutralCard w={CELL_W} h={CELL_H} content={cards[i]} split style={{ width: '100%', height: '100%' }} />
                </div>
              </div>
              {/* 最薄处高光线：不随卡旋转，贴在格位上随角度纵向移动 */}
              {glow > 0.01 && (
                <div
                  style={{
                    position: 'absolute',
                    left: '4%',
                    width: '92%',
                    top: `${glowTop}%`,
                    height: 4,
                    borderRadius: 2,
                    background:
                      'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.95) 50%, rgba(255,255,255,0) 100%)',
                    boxShadow: '0 0 14px rgba(255,255,255,0.8)',
                    opacity: glow,
                    pointerEvents: 'none',
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
