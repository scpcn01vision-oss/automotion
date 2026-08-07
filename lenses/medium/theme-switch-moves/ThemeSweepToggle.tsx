// === 可调参数 ===
// DURATION: 180（总帧数，可调；弹性段随 DURATION 等比缩放）
// 色彩: 走纸墨 G 色板（src/_fixtures/Fixtures.tsx）——文字 G.ink / 背景 G.bg / 强调 G.accent
// 功能: 转折
// props: 无内容可变项（深浅主题色为表现，自绘 UI 结构保留）
// === 时间特性 ===
// 刚性（不可压缩）: 刚性:dim 15f,ripple 95f
// 弹性（可伸缩）: 其余段（入场/过渡/收尾/hold）可等比缩放
// === 适配注意 ===
// 调 DURATION 时只动弹性段 interpolate 关键帧，刚性核心帧区间保持固定帧数。
// theme-sweep-toggle —— 深浅模式扫场
// 同一 dashboard 深浅两版叠放（深版手工映射 G 色板），上层深版用 clip-path
// polygon 15° 斜边从左上扫到右下（先快后缓），边界带 2px 亮线；
// 扫完深版整体 scale 0.995→1 "坐实"。f=70 后全静止（70f）。
import React from 'react';
import { useCurrentFrame, interpolate, Easing } from 'remotion';
import { G } from '../../_fixtures/Fixtures';
import { FONT_STACK } from '../../_system/typography';

const CL = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

// 浅色板 = G 色板（v7 唯一风格权威）；深色板为深色主题对照（表现需要，保持深色）
type Pal = {
  bg: string; panel: string; line: string; bar: string;
  mid: string; card: string; border: string; side: string; sideBar: string;
};
const LIGHT: Pal = {
  bg: G.bg, panel: G.panel, line: G.line, bar: G.bar,
  mid: G.mid, card: G.card, border: G.border, side: G.side, sideBar: G.sideBar,
};
const DARK: Pal = {
  bg: '#1c1c1b', panel: '#242423', line: '#3a3a38', bar: '#6e6e6c',
  mid: '#8f8f8d', card: '#2c2c2b', border: '#454543', side: '#0f0f0e', sideBar: '#6a6a68',
};

// 带色板参数的 dashboard（结构同原 FakeDashboard variant A，占位条已换文字内容）
const Dash: React.FC<{
  p: Pal;
  appName: string;
  menuItems: { icon: string; label: string }[];
  mainTitle: string;
  searchText: string;
  avatarText: string;
  cards: { title: string; rows: string[] }[];
}> = ({ p, appName, menuItems, mainTitle, searchText, avatarText, cards }) => (
  <div style={{ width: 1920, height: 1080, background: p.bg, display: 'flex', fontFamily: FONT_STACK }}>
    <div style={{ width: 220, background: p.side, padding: '28px 22px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: p.sideBar, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: p.bg }}>◆</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: p.sideBar }}>{appName}</div>
      </div>
      {menuItems.map((it, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, height: 30 }}>
          <div style={{ width: 18, height: 18, borderRadius: 5, background: p.sideBar, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: p.bg }}>{it.icon}</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: p.sideBar }}>{it.label}</div>
        </div>
      ))}
    </div>
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div style={{ height: 72, background: p.panel, borderBottom: `2px solid ${p.line}`, display: 'flex', alignItems: 'center', padding: '0 32px', gap: 20, boxSizing: 'border-box' }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: p.sideBar }}>{mainTitle}</div>
        <div style={{ marginLeft: 'auto', height: 36, minWidth: 320, display: 'flex', alignItems: 'center', padding: '0 18px', background: p.card, border: `2px solid ${p.line}`, borderRadius: 18, boxSizing: 'border-box', fontSize: 14, color: p.bar }}>{searchText}</div>
        <div style={{ width: 36, height: 36, borderRadius: 18, background: p.mid, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 800, color: p.bg }}>{avatarText}</div>
      </div>
      <div style={{ flex: 1, padding: 36, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gridAutoRows: '1fr', gap: 28, boxSizing: 'border-box' }}>
        {cards.map((c, i) => (
          <div key={i} style={{ background: p.card, border: `2px solid ${p.border}`, borderRadius: 14, padding: 18, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: p.sideBar }}>{c.title}</div>
            {c.rows.map((r, j) => (
              <div key={j} style={{ fontSize: 13, color: p.bar }}>{r}</div>
            ))}
            <div style={{ marginTop: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ width: 26, height: 26, borderRadius: 13, background: p.mid, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: p.bg }}>{c.title.charAt(0)}</div>
              <div style={{ fontSize: 12, color: p.line }}>成员 {i + 1}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// 时间轴
const SWEEP0 = 14; // 扫场开始（前 14f 初始静置）
const SWEEP1 = 52; // 扫场结束
const SETTLE0 = 52;
const SETTLE1 = 64; // 坐实结束 → 之后全静止

const SLANT = 1080 * Math.tan((15 * Math.PI) / 180); // ≈ 289px，15° 斜边

export interface ThemeSweepToggleProps {
  appName?: string; // 侧栏品牌文字
  menuItems?: { icon: string; label: string }[]; // 侧栏主菜单
  mainTitle?: string; // 顶栏标题
  searchText?: string; // 搜索占位
  avatarText?: string; // 头像文字
  cards?: { title: string; rows: string[] }[]; // 卡片组
}

export const ThemeSweepToggle: React.FC<ThemeSweepToggleProps> = ({
  appName = '工作台',
  menuItems = [
    { icon: '◆', label: '仪表盘' },
    { icon: '●', label: '任务' },
    { icon: '▲', label: '文档' },
    { icon: '●', label: '成员' },
    { icon: '▲', label: '设置' },
    { icon: '◆', label: '通知' },
    { icon: '●', label: '帮助' },
  ],
  mainTitle = '项目工作区',
  searchText = '搜索',
  avatarText = '我',
  cards = [
    { title: '指标一', rows: ['明细 01', '明细 02'] },
    { title: '指标二', rows: ['明细 01', '明细 02', '明细 03'] },
    { title: '指标三', rows: ['明细 01', '明细 02'] },
    { title: '指标四', rows: ['明细 01', '明细 02', '明细 03', '明细 04'] },
    { title: '指标五', rows: ['明细 01', '明细 02', '明细 03'] },
    { title: '指标六', rows: ['明细 01', '明细 02'] },
  ],
}) => {
  const frame = useCurrentFrame();

  // 边界顶端 x：先快后缓（poly(3) out）；从左外扫到右外+SLANT 保证底边也扫尽
  const p = interpolate(frame, [SWEEP0, SWEEP1], [-20, 1920 + SLANT + 40], {
    easing: Easing.out(Easing.poly(3)),
    ...CL,
  });

  // 坐实：0.995 → 1
  const settle = interpolate(frame, [SETTLE0, SETTLE0 + 1, SETTLE1], [1, 0.995, 1], {
    easing: Easing.out(Easing.cubic),
    ...CL,
  });

  // 亮线透明度：扫场期间可见，扫完 6f 内淡出
  const lineOp = interpolate(frame, [SWEEP0, SWEEP0 + 4, SWEEP1 - 4, SWEEP1 + 2], [0, 1, 1, 0], CL);
  const sweeping = frame >= SWEEP0 && frame < SWEEP1 + 2;

  return (
    <div style={{ width: 1920, height: 1080, position: 'relative', overflow: 'hidden', background: LIGHT.bg }}>
      {/* 底层浅色版 */}
      <Dash p={LIGHT} appName={appName} menuItems={menuItems} mainTitle={mainTitle} searchText={searchText} avatarText={avatarText} cards={cards} />
      {/* 上层深色版，clip-path 斜切揭出 */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          clipPath: `polygon(0 0, ${p}px 0, ${p - SLANT}px 1080px, 0 1080px)`,
          transform: `scale(${settle})`,
          transformOrigin: '50% 50%',
        }}
      >
        <Dash p={DARK} appName={appName} menuItems={menuItems} mainTitle={mainTitle} searchText={searchText} avatarText={avatarText} cards={cards} />
      </div>
      {/* 2px 亮线边界（条件卸载） */}
      {sweeping && (
        <div
          style={{
            position: 'absolute',
            left: p - SLANT / 2 - 2,
            top: 540 - 620,
            width: 4,
            height: 1240,
            background: '#ffffff',
            boxShadow: '0 0 18px 4px rgba(255,255,255,0.75)',
            transform: 'rotate(15deg)',
            transformOrigin: '50% 50%',
            opacity: lineOp,
          }}
        />
      )}
    </div>
  );
};
