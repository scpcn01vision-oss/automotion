// === 可调参数 ===
// DURATION: 180（总帧数，可调；弹性段随 DURATION 等比缩放）
// 色彩: 走纸墨 G 色板（src/_fixtures/Fixtures.tsx）——文字 G.ink / 背景 G.bg / 强调 G.accent
// 功能: 收束
// === 时间特性 ===
// 刚性（不可压缩）: 刚性:剥离14f
// 弹性（可伸缩）: 其余段（入场/过渡/收尾/hold）可等比缩放
// === 适配注意 ===
// 调 DURATION 时只动弹性段 interpolate 关键帧，刚性核心帧区间保持固定帧数。
// ui-strip-away-outro —— framer-ai 33–36.5s
// 满屏灰阶"编辑器"里光标点击高亮 Publish 按钮 → UI 层层错峰蒸发退场
// （每层 fade + 轻微位移，从外围到中心）→ 黑场只剩按钮 → 按钮淡出交棒字标。
import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, Easing } from 'remotion';
import { G } from '../../_fixtures/Fixtures';
import { NeutralCard } from '../../_system/neutral-card';
import type { SceneContentData } from '../../_system/scene-content';
import { FONT_STACK } from '../../_system/typography';

const CLICK = 34; // 点击时刻
// 蒸发层级（点击后延迟，外围先走）
const STRIP = {
  sidebar: CLICK + 4,
  leftPanel: CLICK + 8,
  canvasCards: CLICK + 12,
  topbarEnds: CLICK + 16,
  canvasBg: CLICK + 20,
  toolbarShell: CLICK + 24,
};
const STRIP_DUR = 14;
const BTN_FADE = CLICK + 52;
const LOGO_IN = CLICK + 62;

// 某层的蒸发进度 → {opacity, offset}
const useStrip = (frame: number, start: number, dx: number, dy: number) => {
  const p = interpolate(frame, [start, start + STRIP_DUR], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.in(Easing.quad), // 离场加速
  });
  return {
    opacity: 1 - p,
    transform: `translate(${dx * p}px, ${dy * p}px)`,
  };
};

export interface UiStripAwayOutroProps {
  buttonText?: string;
  wordmark?: string;
  cards?: SceneContentData[];
  sidebarItems?: { icon: string; label: string }[]; // 左侧栏条目
  toolbarChips?: string[]; // 顶部工具条 chips
  panelFields?: { label: string; value: string }[]; // 右侧面板字段
  canvasTitle?: string; // 顶部工具条中段标题
  canvasAddress?: string; // 画布地址条
  inviteLabel?: string; // 顶部右段按钮
}

export const UiStripAwayOutro: React.FC<UiStripAwayOutroProps> = ({
  buttonText = 'Publish',
  wordmark = 'WORDMARK',
  cards = [
    { title: '概览', rows: [{ label: '指标一', value: '+18%' }, { label: '指标二', value: '2.4×' }] },
    { title: '明细', rows: [{ label: '指标三', value: '99%' }, { label: '指标四', value: '45%' }] },
    { title: '汇总', rows: [{ label: '指标五', value: '7.1×' }, { label: '指标六', value: '88%' }] },
    { title: '备注', rows: [{ label: '指标七', value: '✓' }, { label: '指标八', value: '—' }] },
  ],
  sidebarItems = [
    { icon: '◧', label: '图层 01' },
    { icon: '◨', label: '图层 02' },
    { icon: '▣', label: '图层 03' },
    { icon: '◫', label: '图层 04' },
    { icon: '▤', label: '图层 05' },
    { icon: '▥', label: '图层 06' },
    { icon: '◱', label: '图层 07' },
    { icon: '◲', label: '图层 08' },
    { icon: '▦', label: '图层 09' },
  ],
  toolbarChips = ['搜索', '筛选', '排序', '视图', '导出'],
  panelFields = [
    { label: '名称', value: '未命名项目' },
    { label: '尺寸', value: '1920 × 1080' },
    { label: '帧率', value: '30 fps' },
    { label: '背景', value: '纸色' },
  ],
  canvasTitle = '未命名项目',
  canvasAddress = 'https://workspace.example/design',
  inviteLabel = '邀请',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 背景：编辑器灰底 → 黑场（随 canvasBg 层蒸发压黑）
  const bgDark = interpolate(frame, [STRIP.canvasBg, STRIP.canvasBg + STRIP_DUR + 6], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.quad),
  });

  const sidebar = useStrip(frame, STRIP.sidebar, -140, 0);
  const leftPanel = useStrip(frame, STRIP.leftPanel, -90, 20);
  const topLeft = useStrip(frame, STRIP.topbarEnds, -80, -60);
  const topRight = useStrip(frame, STRIP.topbarEnds, 80, -60);
  const toolbarShell = useStrip(frame, STRIP.toolbarShell, 0, -50);
  const canvasFrame = useStrip(frame, STRIP.canvasBg, 0, 40);

  // 画布卡片错峰蒸发
  const cardStrip = (i: number) => useStripStatic(frame, STRIP.canvasCards + i * 3, (i % 2 ? 70 : -70), 50 + i * 10);

  // 按钮：点击脉冲 + 最后淡出
  const press = spring({ frame: frame - CLICK, fps, config: { damping: 12, stiffness: 220 } });
  const pressScale = frame < CLICK ? 1 : 1 - 0.12 * Math.sin(Math.min(1, press) * Math.PI);
  const btnOp = interpolate(frame, [BTN_FADE, BTN_FADE + 12], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  // 蒸发期间按钮从工具条位置滑向屏幕中心，独占黑场
  const btnCenter = interpolate(frame, [STRIP.toolbarShell, STRIP.toolbarShell + 18], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });
  const btnX = 1560 + (960 - 88 - 1560) * btnCenter;
  const btnY = 30 + (540 - 30 - 30) * btnCenter;
  const btnScale = 1 + 0.5 * btnCenter;

  // 字标接棒
  const logoP = spring({ frame: frame - LOGO_IN, fps, config: { damping: 14, stiffness: 90 } });

  // 光标移向按钮
  const curX = interpolate(frame, [4, CLICK - 2], [820, 1636], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.quad),
  });
  const curY = interpolate(frame, [4, CLICK - 2], [640, 64], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.quad),
  });
  const curOp = interpolate(frame, [CLICK + 6, CLICK + 16], [1, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ background: '#111110', overflow: 'hidden' }}>
      {/* 编辑器灰底（作为一层可蒸发的背景） */}
      <AbsoluteFill style={{ background: G.bg, opacity: 1 - bgDark }} />

      {/* 左侧栏（图层面板） */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 240, background: G.side, padding: '90px 24px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 20, ...sidebar }}>
        {sidebarItems.map((it, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 22, height: 22, borderRadius: 6, background: G.sideBar, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: G.side }}>{it.icon}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: G.panel }}>{it.label}</div>
          </div>
        ))}
      </div>

      {/* 右侧属性面板 */}
      <div style={{ position: 'absolute', right: 0, top: 60, bottom: 0, width: 300, background: G.panel, borderLeft: `2px solid ${G.line}`, padding: 28, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 18, ...leftPanel }}>
        {panelFields.map((f, i) => (
          <React.Fragment key={i}>
            <div style={{ fontSize: 13, fontWeight: 600, color: G.ink }}>{f.label}</div>
            <div style={{ height: 34, display: 'flex', alignItems: 'center', padding: '0 10px', background: '#fff', border: `2px solid ${G.line}`, borderRadius: 8, boxSizing: 'border-box', fontSize: 13, color: G.mid }}>{f.value}</div>
          </React.Fragment>
        ))}
      </div>

      {/* 顶部工具条左半（logo + 工具 chips） */}
      <div style={{ position: 'absolute', left: 0, top: 0, width: 760, height: 60, background: G.panel, borderBottom: `2px solid ${G.line}`, display: 'flex', alignItems: 'center', gap: 16, padding: '0 24px', boxSizing: 'border-box', ...topLeft }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: G.mid, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: G.bg }}>✦</div>
        {toolbarChips.map((t, i) => (
          <div key={i} style={{ padding: '5px 12px', borderRadius: 7, background: G.line, fontSize: 13, fontWeight: 600, color: G.ink }}>{t}</div>
        ))}
      </div>
      {/* 顶部工具条中段（标题） */}
      <div style={{ position: 'absolute', left: 760, top: 0, right: 400, height: 60, background: G.panel, borderBottom: `2px solid ${G.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box', ...toolbarShell }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: G.ink, letterSpacing: 1 }}>{canvasTitle}</div>
      </div>
      {/* 顶部工具条右段底板（Invite 假按钮；Publish 单独渲染在最上层） */}
      <div style={{ position: 'absolute', right: 0, top: 0, width: 400, height: 60, background: G.panel, borderBottom: `2px solid ${G.line}`, display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 14, padding: '0 24px', boxSizing: 'border-box', ...topRight }}>
        <div style={{ height: 32, padding: '0 16px', borderRadius: 16, border: `2px solid ${G.bar}`, display: 'flex', alignItems: 'center', fontSize: 13, fontWeight: 600, color: G.ink }}>{inviteLabel}</div>
      </div>

      {/* 画布区：一张浏览器式大卡 + 两张小卡 */}
      <div style={{ position: 'absolute', left: 320, top: 130, width: 1180, height: 850, ...canvasFrame }}>
        <div style={{ position: 'absolute', inset: 0, background: G.card, border: `2px solid ${G.border}`, borderRadius: 18, boxShadow: '0 10px 40px rgba(0,0,0,0.08)' }}>
          <div style={{ height: 46, borderBottom: `2px solid ${G.line}`, display: 'flex', alignItems: 'center', gap: 8, padding: '0 18px' }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{ width: 14, height: 14, borderRadius: 7, background: G.line }} />
            ))}
            <div style={{ marginLeft: 16, height: 22, flex: 1, maxWidth: 440, display: 'flex', alignItems: 'center', padding: '0 12px', background: G.bg, borderRadius: 10, fontSize: 12, color: G.mid }}>{canvasAddress}</div>
          </div>
        </div>
        {[0, 1, 2, 3].map((i) => {
          const s = cardStrip(i);
          return (
            <div key={i} style={{ position: 'absolute', left: 70 + (i % 2) * 560, top: 120 + Math.floor(i / 2) * 340, ...s }}>
              <NeutralCard w={480} h={280} content={cards[i % cards.length]} />
            </div>
          );
        })}
      </div>

      {/* Publish 按钮（高亮层，最后退场） */}
      <div
        style={{
          position: 'absolute',
          left: btnX,
          top: btnY,
          width: 176,
          height: 44,
          opacity: btnOp,
          transform: `scale(${pressScale})`,
          zIndex: 30,
        }}
      >
        <div
          style={{
            width: 176 * btnScale,
            height: 44 * btnScale,
            marginLeft: -((176 * btnScale - 176) / 2),
            marginTop: -((44 * btnScale - 44) / 2),
            borderRadius: 22 * btnScale,
            background: '#f2f2f0',
            boxShadow: `0 0 ${30 + 40 * btnCenter}px rgba(255,255,255,${0.25 + 0.3 * btnCenter * bgDark})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: FONT_STACK,
            fontWeight: 700,
            fontSize: 20 * btnScale,
            color: '#161615',
          }}
        >
          {buttonText}
        </div>
      </div>

      {/* 字标接棒 */}
      {frame >= LOGO_IN && (
        <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
          <div
            style={{
              opacity: logoP,
              transform: `scale(${0.86 + 0.14 * logoP})`,
              fontFamily: FONT_STACK,
              fontWeight: 800,
              fontSize: 110,
              letterSpacing: 6,
              color: '#f2f2f0',
            }}
          >
            {wordmark}
          </div>
        </AbsoluteFill>
      )}

      {/* 光标 */}
      <svg width={40} height={44} viewBox="0 0 20 22" style={{ position: 'absolute', left: curX, top: curY, opacity: curOp, zIndex: 40 }}>
        <path d="M2 1 L2 17 L6.5 13.2 L9.4 20 L12.4 18.7 L9.5 12 L15 11.6 Z" fill={G.ink} stroke="#fff" strokeWidth="1.4" />
      </svg>
    </AbsoluteFill>
  );
};

// hook 规则外的静态版本（供 map 内调用）
const useStripStatic = (frame: number, start: number, dx: number, dy: number) => {
  const p = interpolate(frame, [start, start + STRIP_DUR], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.in(Easing.quad),
  });
  return {
    opacity: 1 - p,
    transform: `translate(${dx * p}px, ${dy * p}px)`,
  };
};
