// === 可调参数 ===
// DURATION: 180（总帧数，可调；弹性段随 DURATION 等比缩放）
// 色彩: 走纸墨 G 色板（src/_fixtures/Fixtures.tsx）——文字 G.ink / 背景 G.bg / 强调 G.accent
// 功能: 展开
// === 时间特性 ===
// 刚性（不可压缩）: 刚性:150f
// 弹性（可伸缩）: 其余段（入场/过渡/收尾/hold）可等比缩放
// === 适配注意 ===
// 调 DURATION 时只动弹性段 interpolate 关键帧，刚性核心帧区间保持固定帧数。
// changelog-scroll-brake —— Changelog 长卷急刹
// ~34 行灰阶条目（行高错落）从下往上高速掠过（easeOutExpo 指数减速），
// 高速段叠 blur（速度差分驱动，糊成色带），急刹精准停位后目标行抬升
// （scale 1.03 + 阴影加深）+ 高亮描边，其余行退暗。f=84 后全静止（56f）。
import React from 'react';
import { interpolate, Easing } from 'remotion';
import { G } from '../../_fixtures/Fixtures';

import { useShotFrame } from '../../../engine/useShotFrame';
import type { ShotTime } from '../../../engine/time';

// 时长画像（保守兜底：整段弹性；精修阶段按镜头关键帧画像刚弹分段）
const SHOT_TIME: ShotTime = {
  segments: [{ from: 0, to: 180, mode: 'elastic', minFrames: 0 }],
  minFrames: 0,
};

const CL = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

// 时间轴
const SCROLL0 = 14; // 前 14f 初始静置（停在长卷顶部）
const SCROLL1 = 64; // 急刹停位帧
const LIFT0 = 68; // 目标行抬升开始
const LIFT1 = 82;

const COL_W = 1000;
const COL_X = (1920 - COL_W) / 2;
const GAP = 20;
const N = 34;
const TARGET = 28;

// 行高错落（帧确定性：全由 i 决定）
const rowH = (i: number) => 72 + ((i * 29) % 3) * 22; // 72 / 94 / 116

// 中性 changelog 条目池（34 条默认，标题/标签/元信息均为中性占位内容）
const TAGS = ['修复', '新增', '优化', '发布'];
const TITLES = ['稳定性提升', '界面细节调整', '性能优化', '已知问题修复', '新功能上线'];
const METAS = ['2026-08', '已发布', '2 小时前', '审核中'];
const DEFAULT_ITEMS: { tag: string; title: string; meta: string }[] = Array.from(
  { length: 34 },
  (_, i) => ({
    tag: TAGS[i % TAGS.length],
    title: `${TITLES[i % TITLES.length]} #${34 - i}`,
    meta: METAS[i % METAS.length],
  }),
);

// 预计算每行 y
const rowY: number[] = [];
{
  let y = 0;
  for (let i = 0; i < N; i++) {
    rowY.push(y);
    y += rowH(i) + GAP;
  }
}
const TARGET_CY = rowY[TARGET] + rowH(TARGET) / 2;
const END_T = 540 - TARGET_CY; // 目标行停在画面正中
const START_T = 80; // 起始：长卷顶部略下

const scrollAt = (f: number): number =>
  interpolate(f, [SCROLL0, SCROLL1], [START_T, END_T], {
    easing: Easing.out(Easing.exp),
    ...CL,
  });

const Row: React.FC<{ i: number; frame: number; item: { tag: string; title: string; meta: string } }> = ({ i, frame, item }) => {
  const isTarget = i === TARGET;
  const h = rowH(i);

  // 目标行抬升 + 高亮；其余行退暗
  const t = interpolate(frame, [LIFT0, LIFT1], [0, 1], {
    easing: Easing.out(Easing.cubic),
    ...CL,
  });
  const lift = isTarget ? t : 0;
  const dim = isTarget ? 0 : t;

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: rowY[i],
        width: COL_W,
        height: h,
        background: G.card,
        border: isTarget && lift > 0 ? `3px solid rgba(47,47,47,${lift})` : `2px solid ${G.border}`,
        borderRadius: 14,
        display: 'flex',
        alignItems: 'center',
        gap: 24,
        padding: '0 30px',
        boxSizing: 'border-box',
        transform: `scale(${1 + 0.03 * lift})`,
        boxShadow:
          lift > 0
            ? `0 ${6 + 22 * lift}px ${16 + 44 * lift}px rgba(0,0,0,${0.08 + 0.28 * lift})`
            : '0 2px 8px rgba(0,0,0,0.06)',
        opacity: 1 - 0.62 * dim,
        zIndex: isTarget ? 2 : 1,
      }}
    >
      <div style={{ width: 88, height: 26, borderRadius: 13, background: isTarget ? G.ink : G.mid, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: G.card }}>{item.tag}</div>
      <div style={{ flex: 1, fontSize: 16, fontWeight: 600, color: G.ink, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{item.title}</div>
      <div style={{ flexShrink: 0, fontSize: 13, color: G.mid }}>{item.meta}</div>
    </div>
  );
};

export interface ChangelogScrollBrakeProps {
  items?: { tag: string; title: string; meta: string }[];
}

export const ChangelogScrollBrake: React.FC<ChangelogScrollBrakeProps> = ({
  items = DEFAULT_ITEMS,
}) => {
  const frame = useShotFrame(SHOT_TIME);
  const T = scrollAt(frame);

  // 速度差分驱动模糊：v 达 60px/f 即满 6px blur
  const v = Math.abs(scrollAt(frame) - scrollAt(frame - 1));
  const blur = Math.min(v / 60, 1) * 6;

  return (
    <div style={{ width: 1920, height: 1080, background: G.bg, position: 'relative', overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute',
          left: COL_X,
          top: 0,
          width: COL_W,
          height: 1080,
          transform: `translateY(${T}px)`,
          filter: blur > 0.15 ? `blur(${blur}px)` : undefined,
        }}
      >
        {Array.from({ length: N }).map((_, i) => (
          <Row key={i} i={i} frame={frame} item={items[i % items.length]} />
        ))}
      </div>
    </div>
  );
};
