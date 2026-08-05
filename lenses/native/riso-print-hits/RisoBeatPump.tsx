// === 可调参数 ===
// DURATION: 180（总帧数，可调；弹性段随 DURATION 等比缩放）
// 色彩: 走纸墨 G 色板（src/_fixtures/Fixtures.tsx）——文字 G.ink / 背景 G.bg / 强调 G.accent
// 功能: 宣告,举证
// props: title（套印标题）、cards（底部 3 张卡内容）
// === 时间特性 ===
// 刚性（不可压缩）: 刚性:节拍4拍,套准72f
// 弹性（可伸缩）: 其余段（入场/过渡/收尾/hold）可等比缩放
// === 适配注意 ===
// 调 DURATION 时只动弹性段 interpolate 关键帧，刚性核心帧区间保持固定帧数。
// 套印节拍泵（riso-beat-pump）——beat-punch-in（卡点顿推）× riso-misregistration-hit
// （套印错位）的组合节奏。节拍帧 [30,54,78,102]（每 24f 一拍），每命中帧：
// ① 整画面 scale 一帧瞬跳 1.08（无渐入），14f 内按 exp(-t/3) 指数衰减回 1；
// ② 标题裂成 G.mid/G.ink 双色印版 multiply 错位，初始错位逐拍加码 4/7/11/16px
//    （每版反向 → 总分离 8/14/22/32px），12f 衰减余弦震荡收敛套准；
// ③ 底部对应节拍刻度点闪深并常驻。结构：0–29f hold；30–115f 四拍；116–139f 真静止。
import React from 'react';
import { useCurrentFrame } from 'remotion';
import { G } from '../../_fixtures/Fixtures';

const HITS = [30, 54, 78, 102]; // 节拍命中帧
const AMP = [4, 7, 11, 16]; // 每拍单版初始错位（px），逐拍加码
const PUMP_WIN = 14; // scale 泵窗口：14f 后精确归 1（保证结尾真静止）
const SPLIT_WIN = 12; // 错位窗口：12f 后精确归 0（余量 <0.4px，硬切套准）

// 与正体标题同字形的单色印版（错位需要可调色副本）
const Plate: React.FC<{ text: string; color: string; dx: number; dy: number }> = ({ text, color, dx, dy }) => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transform: `translate(${dx}px, ${dy}px)`,
      mixBlendMode: 'multiply',
    }}
  >
    <div
      style={{
        fontFamily: 'Helvetica, Arial, sans-serif',
        fontWeight: 800,
        fontSize: 160,
        color,
        letterSpacing: -1,
        whiteSpace: 'nowrap',
      }}
    >
      {text}
    </div>
  </div>
);

export interface RisoBeatPumpProps {
  title?: string;
  cards?: { label: string; value: string }[];
}

export const RisoBeatPump: React.FC<RisoBeatPumpProps> = ({
  title = 'ON THE BEAT',
  cards = [
    { label: '指标一', value: '+18%' },
    { label: '指标二', value: '2.1×' },
    { label: '指标三', value: '96.4%' },
  ],
}) => {
  const frame = useCurrentFrame();

  // 找最近一次已命中的节拍（24f 间隔 > 14f 窗口，永远只有一拍在作用）
  let beatIdx = -1;
  for (let i = 0; i < HITS.length; i++) {
    if (frame >= HITS[i]) beatIdx = i;
  }
  const t = beatIdx >= 0 ? frame - HITS[beatIdx] : Infinity;

  // ① 整画面泵：命中帧一帧到位 1.08（t=0 即满值，无渐入），指数衰减回 1
  const pump = t < PUMP_WIN ? 1 + 0.08 * Math.exp(-t / 3) : 1;

  // ② 标题错位：衰减余弦震荡（周期 6f 抖两下），窗口外精确 0 = 套准
  const split = t < SPLIT_WIN;
  const m = split ? Math.cos((2 * Math.PI * t) / 6) * Math.exp(-t / 3) : 0;
  const dx = beatIdx >= 0 ? AMP[beatIdx] * m : 0;
  const dy = dx * 0.45; // y 少量，更像没对准版

  return (
    <div
      style={{
        width: 1920,
        height: 1080,
        background: G.bg,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* 整画面容器：scale 泵作用在全部内容上 */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: `scale(${pump})`,
          transformOrigin: 'center center',
        }}
      >
        {/* 标题区：正体 / 双版错位互斥切换 */}
        <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 660 }}>
          {!split && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  fontFamily: 'Helvetica, Arial, sans-serif',
                  fontWeight: 800,
                  fontSize: 160,
                  color: G.ink,
                  letterSpacing: -1,
                  whiteSpace: 'nowrap',
                }}
              >
                {title}
              </div>
            </div>
          )}
          {split && (
            <>
              <Plate text={title} color={G.mid} dx={-dx} dy={dy} />
              <Plate text={title} color={G.ink} dx={dx} dy={-dy} />
            </>
          )}
        </div>

        {/* 底下一排卡（默认 3 张，数量随 cards） */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 660,
            display: 'flex',
            justifyContent: 'center',
            gap: 44,
          }}
        >
          {cards.map((c, i) => (
            <div
              key={i}
              style={{
                width: 330,
                height: 200,
                background: G.card,
                border: `2px solid ${G.border}`,
                borderRadius: 14,
                padding: 22,
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                gap: 10,
              }}
            >
              <div style={{ fontFamily: 'Helvetica, Arial, sans-serif', fontSize: 24, fontWeight: 800, color: G.ink, overflowWrap: 'break-word' }}>
                {c.label}
              </div>
              <div style={{ fontFamily: 'Helvetica, Arial, sans-serif', fontSize: 34, fontWeight: 800, color: G.accent }}>
                {c.value}
              </div>
            </div>
          ))}
        </div>

        {/* 节拍刻度：命中即闪深（8f 缩放脉冲 1.8→1）并常驻深色 */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 950,
            display: 'flex',
            justifyContent: 'center',
            gap: 60,
          }}
        >
          {HITS.map((hit, i) => {
            const dt = frame - hit;
            const on = dt >= 0;
            const s = on && dt < 8 ? 1 + 0.8 * (1 - dt / 8) : 1;
            return (
              <div
                key={i}
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  background: on ? G.ink : G.bar,
                  transform: `scale(${s})`,
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
