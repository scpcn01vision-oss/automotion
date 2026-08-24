// === 可调参数 ===
// DURATION: 180（总帧数，可调；弹性段随 DURATION 等比缩放）
// 色彩: 走纸墨 G 色板（src/_fixtures/Fixtures.tsx）——文字 G.ink / 背景 G.bg / 强调 G.accent
// 功能: 宣告,承接
// props: titleA / titleB（两段"降格"标题）
// === 时间特性 ===
// 策略: 弹刚 ShotTime（整段弹性）
// 刚性（不可压缩）: 无（全程弹性）
// 弹性（可伸缩）: 全程可等比缩放（时长适配语音）
// === 适配注意 ===
// 调 DURATION 时只动弹性段 interpolate 关键帧，刚性核心帧区间保持固定帧数。
// title-demote-to-label —— 大标题降格为节标签
// 源：perplexity-promo 16–18.5s。大标题居中显影站稳一拍，随后缩小 ~0.3x
// 平移到左上角变小节标签，内容区（灰阶骨架块）在其下方生长。
// 附加变体（framer text-selection-title）：标题登场带文本选中蓝高亮块、随后撤掉。
import React from 'react';
import { AbsoluteFill, interpolate, Easing } from 'remotion';
import { G } from '../../_fixtures/Fixtures';
import { FONT_STACK } from '../../_system/typography';
import { useShotFrame } from '../../../engine/useShotFrame';
import type { ShotTime } from '../../../engine/time';

// 时长画像（lens-timings 无此镜头；按文件头「全程弹性」标）
const SHOT_TIME: ShotTime = {
  segments: [{ from: 0, to: 180, mode: 'elastic', minFrames: 40 }],
  minFrames: 40,
};

const SEL = 'rgba(211,146,60,0.35)';

// 内容行：随 t 依次生长（同宽文字行，label/value）
const RowsBlock: React.FC<{ t: number; rows: { label: string; value: string }[] }> = ({ t, rows }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 30 }}>
    {rows.map((r, i) => {
      const bt = interpolate(t, [i * 0.16, i * 0.16 + 0.3], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
        easing: Easing.out(Easing.cubic),
      });
      return (
        <div
          key={i}
          style={{
            width: 1500,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            opacity: bt,
            transform: `translateY(${(1 - bt) * 28}px)`,
            boxSizing: 'border-box',
          }}
        >
          <span style={{ fontFamily: FONT_STACK, fontSize: 28, fontWeight: 600, color: G.ink }}>{r.label}</span>
          <span style={{ marginLeft: 'auto', fontFamily: FONT_STACK, fontSize: 28, fontWeight: 700, color: G.mid }}>{r.value}</span>
        </div>
      );
    })}
  </div>
);

// 一个完整的"显影→(可选高亮)→降格→内容生长"小节
const DemoteScene: React.FC<{
  frame: number;
  title: string;
  withSelection: boolean;
  rows: { label: string; value: string }[];
}> = ({ frame, title, withSelection, rows }) => {
  // 时间轴（局部帧）
  const REVEAL = 0; // 0–12 显影
  const SEL_ON = 14; // 高亮扫入 14–24
  const SEL_OFF = 32; // 高亮撤掉 32–40
  const DEMOTE = withSelection ? 44 : 32; // 降格开始
  const DEMOTE_END = DEMOTE + 20;
  const GROW = DEMOTE + 12;

  // 显影：blur + 淡入
  const rev = interpolate(frame, [REVEAL, REVEAL + 12], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  // 降格补间：scale 1 -> 0.3，中心 -> 左上
  const dem = interpolate(frame, [DEMOTE, DEMOTE_END], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });
  const scale = interpolate(dem, [0, 1], [1, 0.3]);
  // 用 left/top 补间：起点居中（由外层 flex 定位换算），终点左上角
  const x = interpolate(dem, [0, 1], [960, 150]);
  const y = interpolate(dem, [0, 1], [480, 110]);

  // 高亮块：从左扫入盖住文字，再从左撤掉
  let selLeft = 0;
  let selWidth = 0;
  if (withSelection) {
    const on = interpolate(frame, [SEL_ON, SEL_ON + 10], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.quad),
    });
    const off = interpolate(frame, [SEL_OFF, SEL_OFF + 8], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.in(Easing.quad),
    });
    selLeft = off * 100;
    selWidth = Math.max(0, on * 100 - selLeft);
  }

  const growT = interpolate(frame, [GROW, GROW + 40], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ background: G.bg }}>
      {/* 内容骨架区 */}
      <div style={{ position: 'absolute', left: 150, top: 210 }}>
        <RowsBlock t={growT} rows={rows} />
      </div>
      {/* 标题：transform-origin 左中，位置补间 */}
      <div
        style={{
          position: 'absolute',
          left: x,
          top: y,
          transform: `translate(${-(1 - dem) * 50}%, -50%) scale(${scale})`,
          transformOrigin: 'left center',
          opacity: rev,
          filter: `blur(${(1 - rev) * 12}px)`,
        }}
      >
        <div
          style={{
            position: 'relative',
            fontFamily: FONT_STACK,
            fontWeight: 800,
            fontSize: 128,
            color: G.ink,
            letterSpacing: -2,
            whiteSpace: 'nowrap',
            padding: '10px 18px',
          }}
        >
          {withSelection && selWidth > 0 && (
            <div
              style={{
                position: 'absolute',
                left: `${selLeft}%`,
                top: 8,
                width: `${selWidth}%`,
                height: 'calc(100% - 16px)',
                background: SEL,
                borderRadius: 6,
              }}
            />
          )}
          <span style={{ position: 'relative' }}>{title}</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export interface TitleDemoteToLabelProps {
  titleA?: string;
  titleB?: string;
  contentRows?: { label: string; value: string }[];
  revealAtSec?: number; // 口播对齐：A→B 切换（选中高亮登场）的段内秒；提供后忽略默认 92f
}

export const TitleDemoteToLabel: React.FC<TitleDemoteToLabelProps> = ({
  titleA = 'Overview',
  titleB = 'Details',
  contentRows = [
    { label: '指标一', value: '+18%' },
    { label: '指标二', value: '2.1×' },
    { label: '指标三', value: '96.4%' },
    { label: '指标四', value: '42ms' },
  ],
  revealAtSec,
}) => {
  const frame = useShotFrame(SHOT_TIME);
  const SPLIT = revealAtSec !== undefined ? Math.round(revealAtSec * 30) : 92; // 变体 A 时长

  if (frame < SPLIT) {
    return <DemoteScene frame={frame} title={titleA} withSelection={false} rows={contentRows} />;
  }
  // 变体 B：文本选中态高亮登场
  const f = frame - SPLIT;
  // 白闪转场 3f
  const flash = interpolate(f, [0, 4], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <AbsoluteFill>
      <DemoteScene frame={f} title={titleB} withSelection={true} rows={contentRows} />
      <AbsoluteFill style={{ background: G.card, opacity: flash, pointerEvents: 'none' }} />
    </AbsoluteFill>
  );
};
