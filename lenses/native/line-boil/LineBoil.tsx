// === 可调参数 ===
// DURATION: 180（总帧数，可调；弹性段随 DURATION 等比缩放）
// 色彩: 走纸墨 G 色板（src/_fixtures/Fixtures.tsx）——文字 G.ink / 背景 G.bg / 强调 G.accent
// 功能: 展开
// === 时间特性 ===
// 策略: 弹刚 ShotTime（刚弹分段）
// 刚性（不可压缩）: 沸腾段 35–105f（70f 手绘抖动节奏固定，seed 每 3 帧换）
// 弹性（可伸缩）: 前段静止 0–35 / 后段真静止 105–180
// === 适配注意 ===
// 沸腾段固定不随段长伸缩（保持手绘抖动频率）；段长不足 86f（8+70+8）时回退原始帧。
// 线条沸腾（line-boil）——手绘动画 line boil 质感：静止线稿在"沸腾段"
// 边缘逐帧微颤，像手绘逐帧描线的抖动。SVG filter feTurbulence(baseFrequency
// 0.015, numOctaves 2, seed = Math.floor(f/3) 每 3 帧阶梯换) + feDisplacementMap
// scale=8（原案 3–6 已按可感性加码）作用于大标题 "ALIVE" 与描边卡整层。
// 结构靠"对比"可感：先静止（干净版）→ 沸腾 → 摘罩回静止；判例：feTurbulence
// 收尾必须整个 filter 移除（沸腾段外根本不渲染 filter 与 SVG def），
// 105f 起逐帧完全相同，真静止 ≥35f。
// 关键帧：0–35 完全静止(boil off) → 35–105 沸腾(boil on, seed 每 3 帧一换)
// → 105 摘罩 → 105–140 真静止(boil off)。
import React from 'react';

import { G } from '../../_fixtures/Fixtures';
import { FONT_STACK } from '../../_system/typography';

import { useShotFrame } from '../../../engine/useShotFrame';
import type { ShotTime } from '../../../engine/time';

  // 时长画像：沸腾段刚性（35–105f），前后静止弹性（2026-08-14 精修）
  const SHOT_TIME: ShotTime = {
    segments: [
      { from: 0, to: 35, mode: 'elastic', minFrames: 8 },
      { from: 35, to: 105, mode: 'rigid' },
      { from: 105, to: 180, mode: 'elastic', minFrames: 8 },
    ],
    minFrames: 86,
  };

const BOIL_START = 35;
const BOIL_END = 105;
const BOIL_SCALE = 8; // 原案 3–6 已按可感性加码；QA 看不出再加到 12

export interface LineBoilProps {
  text?: string;
  cardTitle?: string;
  cardRows?: { label: string; value: string }[];
}

export const LineBoil: React.FC<LineBoilProps> = ({
  text = 'ALIVE',
  cardTitle = 'PROJECT BRIEF',
  cardRows = [
    { label: 'Scope', value: 'Locked' },
    { label: 'Budget', value: 'Approved' },
    { label: 'Ship', value: 'Ready' },
  ],
}) => {
  const f = useShotFrame(SHOT_TIME);
  const boiling = f >= BOIL_START && f < BOIL_END;
  // seed 每 3 帧阶梯换 → 8~10Hz 的手绘颤动感；帧确定，无随机源
  const seed = Math.floor(f / 3);

  return (
    <div style={{ width: 1920, height: 1080, background: G.bg, position: 'relative', overflow: 'hidden' }}>
      {/* 沸腾段才渲染 filter 定义——摘罩即整个 SVG def 消失，收尾天然真静止 */}
      {boiling && (
        <svg width={0} height={0} style={{ position: 'absolute' }}>
          <defs>
            <filter id="boil" x="-15%" y="-15%" width="130%" height="130%">
              <feTurbulence
                type="fractalNoise"
                baseFrequency={0.015}
                numOctaves={2}
                seed={seed}
                result="noise"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="noise"
                scale={BOIL_SCALE}
                xChannelSelector="R"
                yChannelSelector="G"
              />
            </filter>
          </defs>
        </svg>
      )}

      {/* 被沸腾的整层：大标题 + 描边卡 */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 56,
          filter: boiling ? 'url(#boil)' : undefined,
        }}
      >
        <div
          style={{
            fontFamily: FONT_STACK,
            fontWeight: 800,
            fontSize: 170,
            color: G.ink,
            letterSpacing: 4,
            lineHeight: 1,
          }}
        >
          {text}
        </div>
        {/* 描边卡：透明底 3px ink 描边 + 标题 + 行列表（内容承载） */}
        <div
          style={{
            width: 520,
            height: 300,
            border: `3px solid ${G.ink}`,
            borderRadius: 20,
            boxSizing: 'border-box',
            padding: '28px 36px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ fontSize: 26, fontWeight: 700, color: G.ink, letterSpacing: 1, marginBottom: 14 }}>{cardTitle}</div>
          {(cardRows ?? []).map((r, i) => (
            <div
              key={i}
              style={{
                display: 'flex', alignItems: 'center', padding: '9px 0',
                borderBottom: i < (cardRows ?? []).length - 1 ? `2px solid ${G.line}` : 'none',
              }}
            >
              <span style={{ fontSize: 18, color: G.ink, fontWeight: 600 }}>{r.label}</span>
              <span style={{ marginLeft: 'auto', fontSize: 18, color: G.accent, fontWeight: 800 }}>{r.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
