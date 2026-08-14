// === 可调参数 ===
// DURATION: 180（总帧数，可调；弹性段随 DURATION 等比缩放）
// 色彩: 走纸墨 G 色板（src/_fixtures/Fixtures.tsx）——文字 G.ink / 背景 G.bg / 强调 G.accent
// 功能: 宣告,对比
// === 时间特性 ===
// 刚性（不可压缩）: 刚性:合拢36f
// 弹性（可伸缩）: 其余段（入场/过渡/收尾/hold）可等比缩放
// === 适配注意 ===
// 调 DURATION 时只动弹性段 interpolate 关键帧，刚性核心帧区间保持固定帧数。
// text-column-converge —— raycast-teams（实测素材 28–36s 段）重做版：
// 原片测量（1280 宽）：NEW 左缘钉死 x=412，特性词右缘钉死 x=867，
// 两词到左右屏边距相等（412 vs 413），轮换期间间距完全不收缩；
// 词换到 RAYCAST 后才发生唯一一次合拢——约 1.2s ease-in-out 连续滑动
// （左缘 412→554 / 右缘 867→725），"NEW RAYCAST" 以屏幕中线居中定格；
// 定格后约 0.6s，斜体 "COMING 2026" 在下方近乎硬切浮现。
import React from 'react';
import { AbsoluteFill, Easing, interpolate } from 'remotion';
import { G } from '../../_fixtures/Fixtures';

import { useShotFrame } from '../../../engine/useShotFrame';
import type { ShotTime } from '../../../engine/time';

// 时长画像（保守兜底：整段弹性；精修阶段按镜头关键帧画像刚弹分段）
const SHOT_TIME: ShotTime = {
  segments: [{ from: 0, to: 180, mode: 'elastic', minFrames: 4 }],
  minFrames: 4,
};

// 词轮换表默认（原版）：停留帧数不均（机器节奏），全程钉在右缘，不做间距收缩
const DEFAULT_STEPS: { word: string; dur: number }[] = [
  { word: 'LAUNCHER DESIGN', dur: 16 },
  { word: 'COMPACT MODE', dur: 12 },
  { word: 'HOTKEY RECORDER', dur: 9 },
  { word: 'HOTKEY TYPES', dur: 8 },
  { word: 'VOICE FEATURES', dur: 7 },
  { word: 'SETTINGS DESIGN', dur: 8 },
  { word: 'AI CHAT', dur: 10 },
  { word: 'FILE SEARCH', dur: 12 },
  { word: 'FINAL', dur: 999 }, // 最后一词：停稳后触发唯一一次合拢
];

const START = 8; // 开场黑场立静

// 原片 1280 宽 → 1920 宽换算（×1.5）
const NEW_LEFT_EDGE = 618; // 412×1.5：NEW 左缘（= 左屏边距）
const WORD_RIGHT_EDGE = 1302; // 868×1.5：特性词右缘（= 右屏边距，1920-1302=618 对称）

const FS = 42; // 原片字高很小（720p 下 cap ~20px → 1080p ~30px → 字号 ~42）
const LSP = 3; // letterSpacing
// 合拢终点按本字体实际步进计算（监视器等宽：0.6em + letterSpacing），
// 保证 "NEW RAYCAST" 恰好一个空格咬合、整行居中于 960，不会重叠
const CONVERGE_DUR = 36; // 合拢时长：原片 ~1.2s ≈ 36 帧
const CONVERGE_DELAY = 10; // RAYCAST 停稳后先静置 10 帧再合拢（原片 32.4→32.7s）
const SUB_DELAY = 18; // 合拢定格后 ~0.6s 出斜体小字

export interface TextColumnConvergeProps {
  leftWord?: string;
  rightWords?: { word: string; dur: number }[];
  subtitle?: string;
}

export const TextColumnConverge: React.FC<TextColumnConvergeProps> = ({
  leftWord = 'NEW',
  rightWords = DEFAULT_STEPS,
  subtitle = 'COMING 2026',
}) => {
  const f = useShotFrame(SHOT_TIME);
  const t = f - START;
  const STEPS = rightWords;

  // 合拢终点按实际字符数动态计算（左词 + 空格 + 末词）
  const ADV = 0.6 * FS + LSP; // 每字符步进
  const lastWord = STEPS[STEPS.length - 1].word;
  const CHAR_COUNT = leftWord.length + 1 + lastWord.length;
  const LINE_W = CHAR_COUNT * ADV;
  const MERGED_LEFT = 960 - LINE_W / 2; // 合拢后左词左缘
  const MERGED_RIGHT = 960 + LINE_W / 2; // 合拢后末词右缘

  // 定位当前步
  let acc = 0;
  let idx = 0;
  let stepStart = 0;
  for (let i = 0; i < STEPS.length; i++) {
    if (t >= acc) { idx = i; stepStart = acc; }
    acc += STEPS[i].dur;
  }
  const cur = STEPS[idx];
  const isLast = idx === STEPS.length - 1;
  const local = t - stepStart;

  // 唯一一次合拢：RAYCAST 停稳 CONVERGE_DELAY 帧后，ease-in-out 连续滑动
  const cvT = isLast ? local - CONVERGE_DELAY : -1;
  const cv = interpolate(cvT, [0, CONVERGE_DUR], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });

  // NEW 左缘：618 → 831；特性词右缘：1302 → 1088
  const newLeft = interpolate(cv, [0, 1], [NEW_LEFT_EDGE, MERGED_LEFT]);
  const wordRight = interpolate(cv, [0, 1], [WORD_RIGHT_EDGE, MERGED_RIGHT]);

  const converged = cv >= 1;

  // 斜体小字：合拢定格后 SUB_DELAY 帧，近乎硬切（4 帧快速淡入，无位移）
  const subT = converged ? cvT - CONVERGE_DUR - SUB_DELAY : -1;
  const subOp = interpolate(subT, [0, 4], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  const visible = t >= 0;

  const font: React.CSSProperties = {
    fontFamily: '"SF Mono", Menlo, monospace',
    fontWeight: 500,
    fontSize: FS,
    letterSpacing: 3,
    color: G.ink,
    whiteSpace: 'nowrap',
    lineHeight: 1,
  };

  return (
    <AbsoluteFill style={{ background: G.bg, overflow: 'hidden' }}>
      {visible && (
        <div style={{ position: 'absolute', inset: 0 }}>
          {/* 左固定词：左缘定位（轮换期间钉死在左屏边距处） */}
          <div style={{
            ...font, position: 'absolute',
            left: newLeft, top: 519,
          }}>
            {leftWord}
          </div>
          {/* 特性词：右缘定位（词换长换短，右缘不动） */}
          <div style={{
            ...font, position: 'absolute',
            right: 1920 - wordRight, top: 519,
          }}>
            {cur.word}
          </div>

          {/* 斜体小字：合拢后在整行正下方浮现，与整行同左缘 */}
          <div style={{
            ...font,
            fontStyle: 'italic',
            color: G.mid,
            position: 'absolute',
            left: MERGED_LEFT, top: 519 + FS + 14,
            opacity: subOp,
          }}>
            {subtitle}
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};
