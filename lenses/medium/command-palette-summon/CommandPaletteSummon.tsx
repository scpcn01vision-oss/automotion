// === 可调参数 ===
// DURATION: 180（总帧数，可调；弹性段随 DURATION 等比缩放）
// 色彩: 走纸墨 G 色板（src/_fixtures/Fixtures.tsx）——文字 G.ink / 背景 G.bg / 强调 G.accent
// 功能: 展开
// props: scene（背景内容承载）
// === 时间特性 ===
// 策略: 弹刚 ShotTime（整段弹性）
// 刚性（不可压缩）: 无（全程弹性）
// 弹性（可伸缩）: 全程可等比缩放（时长适配语音）
// === 适配注意 ===
// 调 DURATION 时只动弹性段 interpolate 关键帧，刚性核心帧区间保持固定帧数。
// command-palette-summon —— 命令面板降临
// FakeDashboard 静置 → 整屏压暗+blur → ⌘K 面板从中心上方 20px 带 overshoot 弹落
// → 5 条候选行错峰浮现 → 模拟输入 2 字母（灰块当字符）候选 5→3→2 收窄
// → 高亮首条。f=110 后全静止（40f）。光标 f<104 闪烁、之后常亮。
import React from 'react';
import { interpolate, Easing, useCurrentFrame } from 'remotion';
import { G } from '../../_fixtures/Fixtures';
import { SceneContent, SceneContentData } from '../../_system/scene-content';
import { FONT_STACK } from '../../_system/typography';
import { useShotFrame } from '../../../engine/useShotFrame';
import type { ShotTime } from '../../../engine/time';

// 时长画像（lens-timings 无此镜头；按文件头「全程弹性」标）
const SHOT_TIME: ShotTime = {
  segments: [{ from: 0, to: 180, mode: 'elastic', minFrames: 50 }],
  minFrames: 50,
};

const CL = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

// 时间轴
const DIM0 = 12; // 压暗开始（前 12f 初始静置）
const DIM1 = 22;
const PANEL_IN = 18; // 面板开始弹落
const ROWS_START = 32; // 候选行开始错峰浮现
const HL = 94; // 高亮首条
const BLINK_END = 104; // 光标停止闪烁（常亮）

const PANEL_W = 780;
const PANEL_X = (1920 - PANEL_W) / 2;
const PANEL_Y = 330;
const ROW_H = 66;
const ROW_GAP = 6;

const PaletteRow: React.FC<{
  i: number;
  frame: number;
  cue: number; // 入场帧（口播对齐 cueSec 或固定错峰）
  rows: { icon: string; label: string; kbd: string }[];
}> = ({ i, frame, cue, rows }) => {
  const { icon, label, kbd } = rows[i];
  const inStart = cue;

  const inOp = interpolate(frame, [inStart, inStart + 8], [0, 1], CL);
  const inY = interpolate(frame, [inStart, inStart + 8], [12, 0], {
    easing: Easing.out(Easing.cubic),
    ...CL,
  });

  // 高亮首条
  const hl = i === 0 ? interpolate(frame, [HL, HL + 10], [0, 1], CL) : 0;

  return (
    <div
      style={{
        height: ROW_H + ROW_GAP,
        opacity: inOp,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          height: ROW_H,
          borderRadius: 12,
          background: hl > 0 ? `rgba(228,228,226,${hl})` : 'transparent',
          boxShadow: hl > 0 ? `inset 4px 0 0 rgba(47,47,47,${hl})` : 'none',
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          padding: '0 22px',
          boxSizing: 'border-box',
          transform: `translateY(${inY}px)`,
        }}
      >
        <div style={{ width: 36, height: 36, borderRadius: 9, background: G.mid, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: G.bg }}>{icon}</div>
        <div style={{ fontFamily: FONT_STACK, fontSize: 24, fontWeight: 600, color: G.ink }}>{label}</div>
        <div style={{ marginLeft: 'auto', padding: '4px 12px', borderRadius: 6, background: G.line, fontFamily: FONT_STACK, fontSize: 18, fontWeight: 700, color: G.ink }}>{kbd}</div>
      </div>
    </div>
  );
};

export interface CommandPaletteSummonProps {
  scene?: SceneContentData; // 背景内容
  query?: string; // 已键入字符
  placeholder?: string; // 输入提示
  commands?: { icon: string; label: string; kbd: string }[]; // 候选命令
  cueSec?: number[]; // 口播对齐：每条候选命令入场的段内秒（与 commands 一一对应）；提供后忽略固定错峰
}

export const CommandPaletteSummon: React.FC<CommandPaletteSummonProps> = ({
  scene = {
    title: '概览',
    type: 'rows',
    rows: [
      { label: '指标一', value: '+18%' },
      { label: '指标二', value: '2.1×' },
      { label: '指标三', value: '96.4%' },
    ],
  },
  query = 'AB',
  placeholder = '输入命令…',
  commands = [
    { icon: '◆', label: '新建文档', kbd: '⌘N' },
    { icon: '●', label: '打开文件', kbd: '⌘O' },
    { icon: '▲', label: '切换窗口', kbd: '⌘K' },
    { icon: '●', label: '搜索内容', kbd: '⌘P' },
    { icon: '◆', label: '运行命令', kbd: '⌘S' },
  ],
  cueSec,
}) => {
  const frameShot = useShotFrame(SHOT_TIME);
  const realFrame = useCurrentFrame();
  const cueMode = !!cueSec && cueSec.length === commands.length;
  const frame = cueMode ? realFrame : frameShot;

  // 背景压暗 + blur
  const dim = interpolate(frame, [DIM0, DIM1], [0, 0.45], CL);
  const blur = interpolate(frame, [DIM0, DIM1], [0, 10], CL);

  // 面板弹落：上方 20px → 过冲 +8px → 落回 0
  const panelY =
    frame < PANEL_IN + 9
      ? interpolate(frame, [PANEL_IN, PANEL_IN + 9], [-20, 8], {
          easing: Easing.out(Easing.cubic),
          ...CL,
        })
      : interpolate(frame, [PANEL_IN + 9, PANEL_IN + 15], [8, 0], {
          easing: Easing.inOut(Easing.cubic),
          ...CL,
        });
  const panelOp = interpolate(frame, [PANEL_IN, PANEL_IN + 7], [0, 1], CL);

  // 光标闪烁（周期 16f），BLINK_END 后常亮保证收尾静止
  const cursorOn = frame >= BLINK_END ? true : (frame - PANEL_IN) % 16 < 8;

  return (
    <div style={{ width: 1920, height: 1080, background: G.bg, position: 'relative', overflow: 'hidden' }}>
      {/* 背景 SceneContent：整体下移 130px，视觉重心下沉（Y 轴重新排版） */}
      <div style={{ filter: frame < DIM0 ? undefined : `blur(${blur}px)`, transform: 'translateY(130px)' }}>
        <SceneContent content={scene} />
      </div>
      <div style={{ position: 'absolute', inset: 0, background: `rgba(20,20,20,${dim})` }} />

      {frame >= PANEL_IN && (
        <div
          style={{
            position: 'absolute',
            left: PANEL_X,
            top: PANEL_Y,
            width: PANEL_W,
            transform: `translateY(${panelY}px)`,
            opacity: panelOp,
            background: G.card,
            borderRadius: 18,
            border: `2px solid ${G.border}`,
            boxShadow: '0 28px 90px rgba(0,0,0,0.4)',
            padding: 20,
            boxSizing: 'border-box',
          }}
        >
          {/* 输入框 */}
          <div
            style={{
              height: 68,
              borderBottom: `2px solid ${G.line}`,
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '0 10px 10px 10px',
              boxSizing: 'border-box',
            }}
          >
            <div style={{ width: 32, height: 32, borderRadius: 8, background: G.mid, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: G.bg }}>◆</div>
            {/* 输入内容：完整显示 query（2026-08-14 用户裁决：不按模拟按键截断） */}
            <div style={{ fontFamily: FONT_STACK, fontSize: 26, fontWeight: 700, color: G.ink }}>
              {query}
            </div>
            {/* 光标 */}
            {cursorOn && <div style={{ width: 4, height: 42, background: G.ink, borderRadius: 2 }} />}
            {/* 占位提示：query 为空时显示 */}
            {!query && (
              <div style={{ fontFamily: FONT_STACK, fontSize: 24, color: G.mid, opacity: 0.8 }}>{placeholder}</div>
            )}
          </div>
          {/* 候选行 */}
          <div style={{ paddingTop: 14 }}>
            {commands.map((_, i) => (
              <PaletteRow
                key={i}
                i={i}
                frame={frame}
                cue={cueMode ? Math.round(cueSec[i] * 30) : ROWS_START + i * 4}
                rows={commands}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
