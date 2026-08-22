// === 可调参数 ===
// DURATION: 180（总帧数，可调；弹性段随 DURATION 等比缩放）
// 色彩: 走纸墨 G 色板（src/_fixtures/Fixtures.tsx）——文字 G.ink / 背景 G.bg / 强调 G.accent
// 功能: 展开
// === 时间特性 ===
// 策略: 弹刚 ShotTime（整段弹性）
// 刚性（不可压缩）: 无
// 弹性（可伸缩）: 全程可等比缩放（时长适配语音）
// === 适配注意 ===
// 段长不足 60f 时回退原始帧（动画按原速、可能被截断）。
// panel-to-canvas-materialize —— miro-promo 84–92s
// 侧面板表格行复选框自动逐个打勾 → 按钮按下 → 三行内容飞出面板、
// 物化成画布上三张独立卡片落位（行→卡跨容器形态迁移，尺寸/形状插值）。
import React from 'react';
import { AbsoluteFill, interpolate, spring, useVideoConfig, Easing } from 'remotion';
import { G } from '../../_fixtures/Fixtures';
import { FONT_STACK } from '../../_system/typography';

import { useShotFrame } from '../../../engine/useShotFrame';
import type { ShotTime } from '../../../engine/time';

// 时长画像：整段弹性（2026-08-14 精修）
const SHOT_TIME: ShotTime = {
  segments: [{ from: 0, to: 180, mode: 'elastic', minFrames: 0 }],
  minFrames: 0,
};

const PANEL_X = 1210;
const PANEL_Y = 90;
const PANEL_W = 620;
const ROW_H = 92;
const ROWS_TOP = 210; // 面板内第一行的画面 y
const CARD_W = 480;
const CARD_H = 240;

const CHECK_FIRST = 12; // 首框打勾帧
const CHECK_GAP = 10;   // 打勾间隔（随数量自适应收缩）
const FLY_AFTER = 30;   // 打勾后起飞帧差

// 行 → 卡的目标位：画布左侧自适应网格（数量随 cards/rows 变化）
const computeTargets = (n: number) => {
  if (n <= 0) return [];
  const areaX = 120, areaY = 120, areaW = 620, areaH = 760, gut = 50;
  const cols = Math.min(2, n);
  const rows = Math.ceil(n / cols);
  const cw = Math.min(CARD_W, (areaW - (cols - 1) * gut) / cols);
  const ch = Math.min(CARD_H, (areaH - (rows - 1) * gut) / rows);
  const gridW = cols * cw + (cols - 1) * gut;
  const gridH = rows * ch + (rows - 1) * gut;
  const startX = areaX + (areaW - gridW) / 2;
  const startY = areaY + (areaH - gridH) / 2;
  return Array.from({ length: n }, (_, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    return { x: startX + col * (cw + gut), y: startY + row * (ch + gut), rot: i % 2 === 0 ? -2 : 1.5 };
  });
};

// 动画帧：打勾/起飞逐张错峰，随数量自适应（避免末张超出时长）
const computeTiming = (n: number) => {
  const gap = Math.max(6, Math.min(CHECK_GAP, Math.floor((150 - CHECK_FIRST) / Math.max(1, n))));
  const checks = Array.from({ length: n }, (_, i) => CHECK_FIRST + i * gap);
  const flies = checks.map((c) => c + FLY_AFTER);
  return { checks, flies };
};

export interface PanelToCanvasMaterializeProps {
  panelTitle?: string; // 面板标题
  panelSubtitle?: string; // 面板副标题
  buttonText?: string; // 底部按钮文字
  rows?: { icon: string; title: string; value: string }[]; // 面板行（3 条）
  cards?: { title: string; rows: { label: string; value: string }[]; name: string }[]; // 飞卡卡态内容（3 张）
}

export const PanelToCanvasMaterialize: React.FC<PanelToCanvasMaterializeProps> = ({
  panelTitle = '待办面板',
  panelSubtitle = '3 项待添加',
  buttonText = '全部添加到画布',
  rows = [
    { icon: '●', title: '任务一', value: '今天' },
    { icon: '▲', title: '任务二', value: '明天' },
    { icon: '◆', title: '任务三', value: '本周' },
  ],
  cards = [
    { title: '概览', rows: [{ label: '指标一', value: '+18%' }, { label: '指标二', value: '2.4×' }], name: '成员 01' },
    { title: '明细', rows: [{ label: '指标三', value: '99%' }, { label: '指标四', value: '45%' }], name: '成员 02' },
    { title: '汇总', rows: [{ label: '指标五', value: '7.1×' }, { label: '指标六', value: '88%' }], name: '成员 03' },
  ],
}) => {
  const frame = useShotFrame(SHOT_TIME);
  const { fps } = useVideoConfig();
  const n = Math.max(cards.length, rows.length);
  const targets = computeTargets(n);
  const { checks, flies } = computeTiming(n);
  const buttonFrame = Math.max(46, (checks[n - 1] ?? 12) + 4);
  const rowOf = (i: number) => rows[i % Math.max(1, rows.length)] ?? { icon: '', title: '', value: '' };
  const cardOf = (i: number) =>
    cards[i % Math.max(1, cards.length)] ?? { title: '', rows: [] as { label: string; value: string }[], name: '' };

  const btnPress = interpolate(frame, [buttonFrame, buttonFrame + 3, buttonFrame + 9], [0, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ background: G.bg, overflow: 'hidden' }}>
      {/* 画布点阵底 */}
      <AbsoluteFill
        style={{
          backgroundImage: `radial-gradient(${G.line} 3px, transparent 3px)`,
          backgroundSize: '52px 52px',
        }}
      />

      {/* 侧面板 */}
      <div
        style={{
          position: 'absolute',
          left: PANEL_X,
          top: PANEL_Y,
          width: PANEL_W,
          height: 900,
          background: G.panel,
          border: `2px solid ${G.border}`,
          borderRadius: 20,
          boxShadow: '0 8px 32px rgba(0,0,0,0.10)',
          boxSizing: 'border-box',
          padding: 28,
        }}
      >
        {/* 面板标题 */}
        <div style={{ fontFamily: FONT_STACK, fontSize: 30, fontWeight: 700, color: G.ink }}>{panelTitle}</div>
        <div style={{ fontFamily: FONT_STACK, fontSize: 20, color: G.mid, marginBottom: 16 }}>{panelSubtitle}</div>
        {/* 表头 */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '8px 20px', marginBottom: 8, background: G.line, borderRadius: 8, opacity: 0.7 }}>
          <span style={{ fontFamily: FONT_STACK, fontSize: 18, fontWeight: 700, color: G.ink }}>事项</span>
          <span style={{ marginLeft: 'auto', fontFamily: FONT_STACK, fontSize: 18, fontWeight: 700, color: G.ink }}>状态</span>
        </div>
        {/* 行槽位（行飞走后留白）——数量随 n */}
        {Array.from({ length: n }).map((_, i) => (
          <RowSlot key={i} idx={i} frame={frame} fps={fps} row={rowOf(i)} checkF={checks[i] ?? null} flyF={flies[i] ?? null} />
        ))}
        {/* 面板底部按钮 */}
        <div
          style={{
            position: 'absolute',
            left: 28,
            bottom: 28,
            right: 28,
            height: 64,
            borderRadius: 14,
            background: btnPress > 0 ? G.ink : G.side,
            transform: `scale(${1 - btnPress * 0.06})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ fontFamily: FONT_STACK, fontWeight: 700, fontSize: 22, color: G.card, letterSpacing: 0.5 }}>
            {buttonText}
          </div>
        </div>
      </div>

      {/* 飞行中/落位的卡（行→卡形态插值）——数量随 n */}
      {Array.from({ length: n }).map((_, i) => (
        <FlyingCard key={i} idx={i} frame={frame} fps={fps} row={rowOf(i)} card={cardOf(i)} tgt={targets[i]} flyF={flies[i] ?? 0} />
      ))}

      {/* 光标 */}
      <Cursor frame={frame} buttonFrame={buttonFrame} />
    </AbsoluteFill>
  );
};

// 面板内的一行：复选框自动打勾；起飞后槽位塌陷成虚线留白
const RowSlot: React.FC<{
  idx: number;
  frame: number;
  fps: number;
  row: { icon: string; title: string; value: string };
  checkF: number | null;
  flyF: number | null;
}> = ({ idx, frame, fps, row, checkF, flyF }) => {
  const checked = checkF != null && frame >= checkF;
  const checkPop = spring({ frame: frame - (checkF ?? 0), fps, config: { damping: 10, stiffness: 260 } });
  const flown = flyF != null && frame >= flyF;
  const title = row?.title ?? '';
  const value = row?.value ?? '';

  return (
    <div
      style={{
        height: ROW_H - 12,
        marginBottom: 12,
        borderRadius: 10,
        border: flown ? `2px dashed ${G.line}` : `2px solid ${G.border}`,
        background: flown ? 'transparent' : G.card,
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        gap: 18,
        padding: '0 20px',
        opacity: flown ? 0.7 : 1,
      }}
    >
      {!flown && (
        <>
          {/* 复选框 */}
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              border: `3px solid ${checked ? G.ink : G.bar}`,
              background: checked ? G.ink : 'transparent',
              boxSizing: 'border-box',
              transform: checked ? `scale(${0.8 + 0.2 * checkPop})` : 'scale(1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {checked && (
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path d="M3 9.5 L7.2 13.5 L15 4.5" stroke="#fff" strokeWidth="3.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
          <div style={{ fontFamily: FONT_STACK, fontSize: 24, fontWeight: 600, color: G.ink }}>{title}</div>
          <div style={{ marginLeft: 'auto', fontFamily: FONT_STACK, fontSize: 20, fontWeight: 700, color: G.accent }}>{value}</div>
        </>
      )}
    </div>
  );
};

// 行→卡：位置沿贝塞尔弧线飞、尺寸/圆角/内容布局同步插值
const FlyingCard: React.FC<{
  idx: number;
  frame: number;
  fps: number;
  row: { icon: string; title: string; value: string };
  card: { title: string; rows: { label: string; value: string }[]; name: string };
  tgt: { x: number; y: number; rot: number };
  flyF: number;
}> = ({ idx, frame, fps, row, card, tgt, flyF }) => {
  if (frame < flyF) return null;

  const t = spring({ frame: frame - flyF, fps, config: { damping: 16, stiffness: 60 }, durationInFrames: 34 });

  // 起点：面板内该行的屏幕位置/尺寸
  const sx = PANEL_X + 30;
  const sy = ROWS_TOP + idx * ROW_H;
  const sw = PANEL_W - 60;
  const sh = ROW_H - 12;
  const tx = tgt?.x ?? 150;
  const ty = tgt?.y ?? 300;
  const trot = tgt?.rot ?? 0;

  // 弧线：中点向上抬，像被"倒"出来
  const mx = (sx + tx) / 2;
  const my = Math.min(sy, ty) - 170;
  const u = t;
  const x = (1 - u) * (1 - u) * sx + 2 * (1 - u) * u * mx + u * u * tx;
  const y = (1 - u) * (1 - u) * sy + 2 * (1 - u) * u * my + u * u * ty;

  const w = sw + (CARD_W - sw) * u;
  const h = sh + (CARD_H - sh) * u;
  const rot = trot * u;
  const radius = 10 + 8 * u;
  const shadow = interpolate(u, [0, 1], [0.08, 0.16]);
  // 行内容(单行水平) → 卡内容(标题+行+footer) 交叉淡化
  const rowOp = Math.max(0, 1 - u * 2.2);
  const cardOp = Math.max(0, (u - 0.45) / 0.55);

  // 字段容错：行/卡内容缺省兜底，杜绝 map 崩溃
  const rowsC = card?.rows ?? [];
  const cardTitle = card?.title ?? '';
  const cardName = card?.name ?? '';
  const rIcon = row?.icon ?? '';
  const rTitle = row?.title ?? '';

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: w,
        height: h,
        background: G.card,
        border: `2px solid ${G.border}`,
        borderRadius: radius,
        boxShadow: `0 ${10 + 14 * u}px ${24 + 20 * u}px rgba(0,0,0,${shadow})`,
        transform: `rotate(${rot}deg)`,
        boxSizing: 'border-box',
        overflow: 'hidden',
        zIndex: 10 + idx,
      }}
    >
      {/* 行形态内容 */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', gap: 18, padding: '0 20px', opacity: rowOp }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: G.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: G.card }}>{rIcon}</div>
        <div style={{ fontFamily: FONT_STACK, fontSize: 22, fontWeight: 600, color: G.ink }}>{rTitle}</div>
      </div>
      {/* 卡形态内容 */}
      <div style={{ position: 'absolute', inset: 0, padding: 24, display: 'flex', flexDirection: 'column', gap: 12, opacity: cardOp, boxSizing: 'border-box' }}>
        <div style={{ fontFamily: FONT_STACK, fontSize: 26, fontWeight: 700, color: G.ink }}>{cardTitle}</div>
        {rowsC.map((r, ri) => (
          <div key={ri} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontFamily: FONT_STACK, fontSize: 18, fontWeight: 600, color: G.ink }}>{r?.label ?? ''}</span>
            <span style={{ marginLeft: 'auto', fontFamily: FONT_STACK, fontSize: 18, fontWeight: 700, color: G.accent }}>{r?.value ?? ''}</span>
          </div>
        ))}
        <div style={{ marginTop: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ width: 28, height: 28, borderRadius: 14, background: G.mid, color: G.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800 }}>{cardName.charAt(0)}</div>
          <div style={{ fontFamily: FONT_STACK, fontSize: 16, fontWeight: 600, color: G.mid }}>{cardName}</div>
        </div>
      </div>
    </div>
  );
};

const Cursor: React.FC<{ frame: number; buttonFrame: number }> = ({ frame, buttonFrame }) => {
  // 光标：从画面中部移到按钮上并停留按下
  const bx = PANEL_X + PANEL_W / 2;
  const by = PANEL_Y + 900 - 60;
  const x = interpolate(frame, [8, buttonFrame - 4], [900, bx], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.quad),
  });
  const y = interpolate(frame, [8, buttonFrame - 4], [560, by], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.quad),
  });
  const press = interpolate(frame, [buttonFrame, buttonFrame + 3, buttonFrame + 8], [1, 0.78, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <svg
      width={40}
      height={44}
      viewBox="0 0 20 22"
      style={{ position: 'absolute', left: x, top: y, transform: `scale(${press})`, zIndex: 40 }}
    >
      <path d="M2 1 L2 17 L6.5 13.2 L9.4 20 L12.4 18.7 L9.5 12 L15 11.6 Z" fill={G.ink} stroke="#fff" strokeWidth="1.4" />
    </svg>
  );
};
