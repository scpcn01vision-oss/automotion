// === 可调参数 ===
// DURATION: 180（总帧数，可调；弹性段随 DURATION 等比缩放）
// 色彩: 走纸墨 G 色板（src/_fixtures/Fixtures.tsx）——文字 G.ink / 背景 G.bg / 强调 G.accent
// 功能: 钩子,宣告
// props: title（左上角标题）、content（卡片内容承载 rows/image）
// === 时间特性 ===
// 策略: 弹刚 ShotTime（整段弹性）
// 刚性（不可压缩）: 无
// 弹性（可伸缩）: 全程可等比缩放（时长适配语音）
// === 适配注意 ===
// 段长不足 60f 时回退原始帧（动画按原速、可能被截断）。
// 描边生长圈注（draw-svg-trace）——DrawSVG 惯用的入场退场。
// 屏心 560×380 卡片位置先空着，一条 G.ink 4px 描边沿圆角矩形轮廓跑一整圈
// 把轮廓"画"出来（rect pathLength=1，dasharray=1，dashoffset 1→0）；
// 线头叠一段 0.045 长的 6px 粗短 dash 当"笔头"跑在最前。闭合瞬间轮廓闪一次
// 加深加粗，卡片内容 8f 淡入，描边淡出换成卡片自身 border；随后标题下划线
// 再来一次短版描边生长（第二用法）。
// 关键帧：0–8 空场 hold → 8–48 轮廓描边生长 40f（inOut cubic）→
// 48–56 闪黑加粗（48–50 上 50–56 回）+ 内容 8f 淡入 →
// 54–64 描边淡出 / 自身 border 淡入 → 68–86 下划线短版生长 → 90–140 真静止 50f。
import React from 'react';
import { interpolate, Easing, Img, staticFile } from 'remotion';
import { G } from '../../_fixtures/Fixtures';
import { FONT_STACK } from '../../_system/typography';

import { useShotFrame } from '../../../engine/useShotFrame';
import type { ShotTime } from '../../../engine/time';

// 时长画像：整段弹性（2026-08-14 精修）
const SHOT_TIME: ShotTime = {
  segments: [{ from: 0, to: 180, mode: 'elastic', minFrames: 60 }],
  minFrames: 60,
};

const CW = 560;
const CH = 380;
const CX = (1920 - CW) / 2; // 680
const CY = (1080 - CH) / 2; // 350
const PEN = 0.045; // 笔头 dash 长度（占整圈比例）

export interface DrawSvgTraceContent {
  title?: string;
  type?: 'rows' | 'image';
  rows?: { label: string; value: string }[];
  image?: string;
}

export interface DrawSvgTraceProps {
  content?: DrawSvgTraceContent;
  revealAtSec?: number; // 口播对齐：轮廓描边开始时刻（段内秒）；提供后忽略默认 8f
}

// 卡片内容渲染器：标题条 + 行列表（默认）/ 标题条 + 圆角图片
const CardContent: React.FC<{ content: DrawSvgTraceContent }> = ({ content }) => {
  const { title, type = 'rows', rows, image } = content;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, height: '100%' }}>
      <div
        style={{
          height: 24, borderRadius: 10, background: G.bar, overflow: 'hidden',
          display: 'flex', alignItems: 'center', padding: '0 12px',
        }}
      >
        {title ? (
          <span style={{ fontFamily: FONT_STACK, fontSize: 15, fontWeight: 700, color: G.card }}>
            {title}
          </span>
        ) : null}
      </div>
      {/* 下划线占位：由下方 SVG 画出，这里留 6px 空隙 */}
      <div style={{ height: 6 }} />
      {type === 'image' && image ? (
        <Img
          src={staticFile(image)}
          style={{
            flex: 1, width: '100%', objectFit: 'cover', borderRadius: 8,
            border: `1px solid ${G.border}`,
          }}
        />
      ) : (
        <>
          {(rows ?? []).map((r, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 16, color: G.ink, fontWeight: 600 }}>{r.label}</span>
              <span style={{ marginLeft: 'auto', fontSize: 17, color: G.accent, fontWeight: 800 }}>{r.value}</span>
            </div>
          ))}
        </>
      )}
    </div>
  );
};

export const DrawSvgTrace: React.FC<DrawSvgTraceProps> = ({
  content = {
    title: '标题',
    type: 'rows',
    rows: [
      { label: '指标一', value: '+18%' },
      { label: '指标二', value: '2.1×' },
      { label: '指标三', value: '96.4%' },
      { label: '指标四', value: '42ms' },
    ],
  },
  revealAtSec,
}) => {
  const frame = useShotFrame(SHOT_TIME);
  const DRAW_START = revealAtSec !== undefined ? Math.round(revealAtSec * 30) : 8;

  // 轮廓描边进度：8–48，40f，inOut cubic
  const p = interpolate(frame, [DRAW_START, DRAW_START + 40], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });

  // 闭合闪烁：48–50 冲到峰值，50–56 回落。峰值 = 纯黑 + 4→8px 加粗
  const flashUp = interpolate(frame, [DRAW_START + 40, DRAW_START + 42], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const flashDown = interpolate(frame, [DRAW_START + 42, DRAW_START + 48], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad),
  });
  const flash = frame < DRAW_START + 42 ? flashUp : flashDown;
  const strokeW = 4 + flash * 4;
  const strokeColor = G.ink;

  // 内容淡入：48–56（8f）
  const contentOp = interpolate(frame, [DRAW_START + 40, DRAW_START + 48], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad),
  });

  // 描边淡出 / 卡片自身 border 淡入：54–64
  const traceOp = interpolate(frame, [DRAW_START + 46, DRAW_START + 56], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const borderOp = 1 - traceOp;

  // 笔头：短 dash 覆盖 [p-PEN, p]，只在描边期可见
  const penOp = p > 0.02 && p < 0.985 ? 1 : 0;

  // 第二用法：标题下划线短版生长 68–86（18f，out cubic）
  const up = interpolate(frame, [DRAW_START + 60, DRAW_START + 78], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const upenOp = up > 0.03 && up < 0.97 ? 1 : 0;
  const UW = 300; // 下划线长度

  return (
    <div style={{ width: 1920, height: 1080, background: G.bg, position: 'relative', overflow: 'hidden' }}>

      {/* 卡片内容（标题条 + rows/image 承载），闭合后 8f 淡入 */}
      <div
        style={{
          position: 'absolute',
          left: CX,
          top: CY,
          width: CW,
          height: CH,
          borderRadius: 14,
          background: G.card,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          padding: 32,
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          opacity: contentOp,
        }}
      >
        <CardContent content={content} />
      </div>

      {/* 卡片自身 border：描边淡出时接棒 */}
      <div
        style={{
          position: 'absolute',
          left: CX,
          top: CY,
          width: CW,
          height: CH,
          borderRadius: 14,
          border: `2px solid ${G.border}`,
          boxSizing: 'border-box',
          opacity: borderOp,
        }}
      />

      {/* 描边生长层：主线 4px + 笔头 6px 短 dash */}
      {traceOp > 0.001 && (
        <svg
          width={CW}
          height={CH}
          style={{ position: 'absolute', left: CX, top: CY, overflow: 'visible', opacity: traceOp }}
        >
          <rect
            x={1}
            y={1}
            width={CW - 2}
            height={CH - 2}
            rx={14}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeW}
            pathLength={1}
            strokeDasharray="1"
            strokeDashoffset={1 - p}
            strokeLinecap="round"
          />
          {penOp > 0 && (
            <rect
              x={1}
              y={1}
              width={CW - 2}
              height={CH - 2}
              rx={14}
              fill="none"
              stroke={G.ink}
              strokeWidth={7}
              pathLength={1}
              strokeDasharray={`${PEN} ${1 - PEN}`}
              strokeDashoffset={PEN - p}
              strokeLinecap="round"
            />
          )}
        </svg>
      )}

      {/* 第二用法：标题下划线短版描边生长（画完常驻） */}
      {up > 0.001 && (
        <svg
          width={UW}
          height={8}
          style={{ position: 'absolute', left: CX + 32, top: CY + 32 + 24 + 10, overflow: 'visible' }}
        >
          <line
            x1={0}
            y1={4}
            x2={UW}
            y2={4}
            stroke={G.ink}
            strokeWidth={4}
            pathLength={1}
            strokeDasharray="1"
            strokeDashoffset={1 - up}
            strokeLinecap="round"
          />
          {upenOp > 0 && (
            <line
              x1={0}
              y1={4}
              x2={UW}
              y2={4}
              stroke={G.ink}
              strokeWidth={7}
              pathLength={1}
              strokeDasharray={`${PEN * 2} ${1 - PEN * 2}`}
              strokeDashoffset={PEN * 2 - up}
              strokeLinecap="round"
            />
          )}
        </svg>
      )}
    </div>
  );
};
