// === 可调参数 ===
// DURATION: 180（总帧数，可调；弹性段随 DURATION 等比缩放）
// 色彩: 走纸墨 G 色板（src/_fixtures/Fixtures.tsx）——文字 G.ink / 背景 G.bg / 强调 G.accent
// 功能: 宣告,举证
// === 时间特性 ===
// 策略: 弹刚 ShotTime（整段弹性）
// 刚性（不可压缩）: 无
// 弹性（可伸缩）: 全程可等比缩放（时长适配语音）
// === 适配注意 ===
// 段长不足 60f 时回退原始帧（动画按原速、可能被截断）。
// sheen-sweep-retry —— 单点扫光（高标准重试）
// 深墨大卡居中，一道 45° 高光带在 40–68f 从左外扫到右外，仅此一次。
// 约束：单点(只扫主角卡)、圆角裁剪(overflow hidden)、扫前扫后完全静止。
import React from 'react';
import { G } from '../../_fixtures/Fixtures';
import { interpolate, Easing } from 'remotion';
import { FONT_STACK } from '../../_system/typography';

import { useShotFrame } from '../../../engine/useShotFrame';
import type { ShotTime } from '../../../engine/time';

// 时长画像：整段弹性（2026-08-14 精修）
const SHOT_TIME: ShotTime = {
  segments: [{ from: 0, to: 180, mode: 'elastic', minFrames: 60 }],
  minFrames: 60,
};

const CARD_W = 760;
const CARD_H = 420;
const SHEEN_W = CARD_W * 1.6; // 1216

export interface SheenSweepRetryProps {
  title?: string; // 卡片大字
  rows?: string[]; // 卡片指标行
}

export const SheenSweepRetry: React.FC<SheenSweepRetryProps> = ({
  title = '指标',
  rows = ['指标一 +18%', '指标二 2.1×'],
}) => {
  const frame = useShotFrame(SHOT_TIME);

  // 扫光：40–68f，从卡左外(-SHEEN_W)扫到卡右外(CARD_W)，inOut(cubic)，只一次
  const sweepActive = frame >= 40 && frame <= 68;
  const x = interpolate(frame, [40, 68], [-SHEEN_W, CARD_W], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        width: 1920,
        height: 1080,
        background: G.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: FONT_STACK,
      }}
    >
      <div
        style={{
          width: CARD_W,
          height: CARD_H,
          background: G.side,
          borderRadius: 24,
          overflow: 'hidden', // 圆角裁剪：高光带被卡的圆角裁住
          position: 'relative',
          boxShadow: '0 12px 40px rgba(0,0,0,0.22)',
          boxSizing: 'border-box',
          padding: '64px 72px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 28,
        }}
      >
        <div
          style={{
            fontSize: 130,
            fontWeight: 800,
            color: G.card,
            letterSpacing: 2,
            lineHeight: 1,
          }}
        >
          {title}
        </div>
        {rows.map((r, i) => (
          <div key={i} style={{ fontFamily: FONT_STACK, fontSize: 22, fontWeight: 600, color: G.card }}>{r}</div>
        ))}

        {/* 高光带：条件挂载，扫完即摘罩，收尾真静止 */}
        {sweepActive && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: SHEEN_W,
              height: CARD_H,
              transform: `translateX(${x}px)`,
              background:
                'linear-gradient(115deg, transparent 42%, rgba(255,255,255,0.32) 50%, transparent 58%)',
              pointerEvents: 'none',
            }}
          />
        )}
      </div>
    </div>
  );
};
