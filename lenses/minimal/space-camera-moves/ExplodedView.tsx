// === 可调参数 ===
// DURATION: 180（总帧数，可调；弹性段随 DURATION 等比缩放）
// 色彩: 走纸墨 G 色板（src/_fixtures/Fixtures.tsx）——文字 G.ink / 背景 G.bg / 强调 G.accent
// 功能: 展开
// props: cards（爆炸层六卡内容）
// === 时间特性 ===
// 刚性（不可压缩）: 无（全程弹性）
// 弹性（可伸缩）: 全程可等比缩放（时长适配语音）
// === 适配注意 ===
// 调 DURATION 时只动弹性段 interpolate 关键帧，刚性核心帧区间保持固定帧数。
import React from 'react';
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';
import { G } from '../../_fixtures/Fixtures';
import { FONT_STACK } from '../../_system/typography';

// exploded-view：整页 dashboard 带 3D 倾斜，咔地沿 Z 轴炸开——顶栏/侧栏/六卡
// 各自浮到不同深度悬停（近大而实、远略暗），层间透出投影；hold 一拍后
// 逆序咔哒合体，2f 震屏收口。
//
// 节拍：0–24 静止建立（已倾斜）→ 24–59 错峰炸开（每层 14f ease-out-back）
//      → 悬停 → 90–123 逆序合体（每层 12f ease-in）→ 123 震屏 → 静止到 150

const EXPLODE = 24; // 炸开起始帧
const ASSEMBLE = 90; // 合体起始帧
const STAGGER = 3; // 层间错峰
const N = 8; // 可动层数（顶栏 + 侧栏 + 6 卡）
const CLOSE = ASSEMBLE + (N - 1) * STAGGER + 12; // = 123，最后一层归位

// FakeDashboard variant A 的布局常量（绝对定位复刻）
const SIDE_W = 220;
const TOP_H = 72;
const PAD = 36;
const GAP = 28;
const CARD_W = (1920 - SIDE_W - PAD * 2 - GAP * 2) / 3; // 524
const CARD_H = (1080 - TOP_H - PAD * 2 - GAP) / 2; // 454

type Layer = {
  key: string;
  x: number;
  y: number;
  w: number;
  h: number;
  z: number; // 炸开深度 60–320
  order: number; // 错峰序
  radius: number;
  node: React.ReactNode;
};

const Sidebar: React.FC<{ items: { icon: string; label: string }[] }> = ({ items }) => (
  <div style={{ width: SIDE_W, height: 1080, background: G.side, padding: '28px 22px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 18 }}>
    <div style={{ width: 40, height: 40, borderRadius: 10, background: G.sideBar, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: G.side }}>◆</div>
    {items.map((it, i) => (
      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 26, height: 26, borderRadius: 6, background: G.sideBar, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: G.side }}>{it.icon}</div>
        <div style={{ fontSize: 16, fontWeight: 600, color: G.panel }}>{it.label}</div>
      </div>
    ))}
  </div>
);

const Topbar: React.FC<{ dashTitle: string; searchText: string; avatarText: string }> = ({ dashTitle, searchText, avatarText }) => (
  <div style={{ width: 1920 - SIDE_W, height: TOP_H, background: G.panel, borderBottom: `2px solid ${G.line}`, display: 'flex', alignItems: 'center', padding: '0 32px', gap: 20, boxSizing: 'border-box' }}>
    <div style={{ fontFamily: FONT_STACK, fontSize: 24, fontWeight: 700, color: G.ink }}>{dashTitle}</div>
    <div style={{ marginLeft: 'auto', height: 38, minWidth: 240, display: 'flex', alignItems: 'center', padding: '0 16px', background: G.card, border: `2px solid ${G.line}`, borderRadius: 19, boxSizing: 'border-box', fontSize: 18, color: G.mid }}>{searchText}</div>
    <div style={{ width: 38, height: 38, borderRadius: 19, background: G.mid, color: G.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 800 }}>{avatarText}</div>
  </div>
);

// 六卡深度：错落分布在 60–320，近的自然更大（perspective 缩放）
const CARD_Z = [150, 300, 80, 230, 320, 110];

const MiniCard: React.FC<{ w: number; h: number; label: string; value: string }> = ({ w, h, label, value }) => {
  // 字号随卡宽自适应（卡 524×454 时约 44/65px），Y 轴居中重排拉开层次
  const pad = Math.max(20, Math.floor(w * 0.06));
  const labelSize = Math.max(24, Math.floor(w * 0.085));
  const valueSize = Math.max(32, Math.floor(w * 0.125));
  const gapY = Math.max(14, Math.floor(h * 0.06));
  return (
    <div
      style={{
        width: w,
        height: h,
        background: G.card,
        border: `2px solid ${G.border}`,
        borderRadius: 14,
        padding: pad,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: gapY,
      }}
    >
      <div style={{ fontFamily: FONT_STACK, fontSize: labelSize, fontWeight: 800, color: G.ink, overflowWrap: 'break-word' }}>
        {label}
      </div>
      <div style={{ fontFamily: FONT_STACK, fontSize: valueSize, fontWeight: 800, color: G.accent }}>
        {value}
      </div>
    </div>
  );
};

const buildLayers = (
  cards: { label: string; value: string }[],
  sidebarItems: { icon: string; label: string }[],
  dashTitle: string,
  searchText: string,
  avatarText: string,
): Layer[] => [
  { key: 'top', x: SIDE_W, y: 0, w: 1920 - SIDE_W, h: TOP_H, z: 260, order: 0, radius: 0, node: <Topbar dashTitle={dashTitle} searchText={searchText} avatarText={avatarText} /> },
  { key: 'side', x: 0, y: 0, w: SIDE_W, h: 1080, z: 190, order: 1, radius: 0, node: <Sidebar items={sidebarItems} /> },
  ...Array.from({ length: 6 }).map((_, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const c = cards[i] ?? { label: '', value: '' };
    return {
      key: `card${i}`,
      x: SIDE_W + PAD + col * (CARD_W + GAP),
      y: TOP_H + PAD + row * (CARD_H + GAP),
      w: CARD_W,
      h: CARD_H,
      z: CARD_Z[i],
      order: 2 + i,
      radius: 14,
      node: <MiniCard w={CARD_W} h={CARD_H} label={c.label} value={c.value} />,
    };
  }),
];

export interface ExplodedViewProps {
  cards?: { label: string; value: string }[];
  sidebarItems?: { icon: string; label: string }[]; // 侧栏菜单
  dashTitle?: string; // 顶栏标题
  searchText?: string; // 搜索占位文字
  avatarText?: string; // 顶栏头像首字母
}

export const ExplodedView: React.FC<ExplodedViewProps> = ({
  cards = [
    { label: '指标一', value: '+18%' },
    { label: '指标二', value: '2.1×' },
    { label: '指标三', value: '96.4%' },
    { label: '节点', value: '4/4' },
    { label: '延迟', value: '42ms' },
    { label: '可用性', value: '99.98%' },
  ],
  sidebarItems = [
    { icon: '◆', label: '仪表盘' },
    { icon: '●', label: '任务' },
    { icon: '▲', label: '文档' },
    { icon: '●', label: '成员' },
    { icon: '▲', label: '设置' },
    { icon: '◆', label: '通知' },
    { icon: '●', label: '帮助' },
  ],
  dashTitle = '项目工作区',
  searchText = '搜索',
  avatarText = '我',
}) => {
  const frame = useCurrentFrame();
  const LAYERS = buildLayers(cards, sidebarItems, dashTitle, searchText, avatarText);

  // 每层进度：炸开 ease-out-back（带一点回弹的“咔”）× 合体逆序 ease-in
  const layerP = (order: number) => {
    const out = interpolate(
      frame,
      [EXPLODE + order * STAGGER, EXPLODE + order * STAGGER + 14],
      [0, 1],
      { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.back(1.7)) },
    );
    const back = interpolate(
      frame,
      [ASSEMBLE + (N - 1 - order) * STAGGER, ASSEMBLE + (N - 1 - order) * STAGGER + 12],
      [0, 1],
      { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.cubic) },
    );
    return out * (1 - back);
  };

  // 全局散开度（驱动底板变暗）
  const g =
    interpolate(frame, [EXPLODE, EXPLODE + 24], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) }) *
    (1 - interpolate(frame, [ASSEMBLE, CLOSE], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.cubic) }));

  // 合体收口：2f 震屏，指数衰减
  const since = frame - CLOSE;
  const env = since >= 0 ? 13 * Math.exp(-since / 1.3) : 0;
  const shakeX = env * Math.sin(since * 3.3);
  const shakeY = env * 0.7 * Math.sin(since * 4.7 + 1.1);

  return (
    <AbsoluteFill style={{ background: G.panel, overflow: 'hidden' }}>
      <AbsoluteFill style={{ perspective: 1600, transform: `translate(${shakeX}px, ${shakeY}px)` }}>
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: 1920,
            height: 1080,
            transform: 'scale(0.76) rotateX(18deg) rotateY(-12deg)',
            transformOrigin: '50% 50%',
            transformStyle: 'preserve-3d',
          }}
        >
          {/* 底板：页面背景留在 Z=0，炸开时整体压暗，衬出层间深度 */}
          <div style={{ position: 'absolute', inset: 0, background: G.bg, border: `2px solid ${G.border}`, boxSizing: 'border-box', filter: `brightness(${1 - g * 0.22})` }} />

          {/* 投到底板上的假投影：随层浮起而下移/变虚 */}
          {LAYERS.map((L) => {
            const p = Math.min(1, Math.max(0, layerP(L.order)));
            if (p <= 0.01) return null;
            return (
              <div
                key={`sh-${L.key}`}
                style={{
                  position: 'absolute',
                  left: L.x + L.z * 0.16 * p,
                  top: L.y + L.z * 0.26 * p,
                  width: L.w,
                  height: L.h,
                  borderRadius: L.radius,
                  background: 'rgba(0,0,0,0.30)',
                  filter: `blur(${8 + L.z * 0.09 * p}px)`,
                  opacity: 0.5 * p,
                  transform: 'translateZ(2px)',
                }}
              />
            );
          })}

          {/* 可动层：沿 Z 浮起，近的更大更实、远的略暗 */}
          {LAYERS.map((L) => {
            const p = layerP(L.order);
            const pc = Math.min(1, Math.max(0, p));
            const bright = 1 - (1 - L.z / 320) * 0.28 * pc; // 深度越浅（z 小=离底板近=远离镜头）越暗
            return (
              <div
                key={L.key}
                style={{
                  position: 'absolute',
                  left: L.x,
                  top: L.y,
                  width: L.w,
                  height: L.h,
                  borderRadius: L.radius,
                  transform: `translateZ(${L.z * p}px)`,
                  filter: `brightness(${bright})`,
                  boxShadow: pc > 0.02 ? `0 ${10 + L.z * 0.1 * pc}px ${16 + L.z * 0.14 * pc}px rgba(0,0,0,${0.12 + 0.1 * pc})` : 'none',
                }}
              >
                {L.node}
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
