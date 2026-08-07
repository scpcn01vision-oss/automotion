// === 可调参数 ===
// DURATION: 180（总帧数，可调；弹性段随 DURATION 等比缩放）
// 色彩: 走纸墨 G 色板（src/_fixtures/Fixtures.tsx）——文字 G.ink / 背景 G.bg / 强调 G.accent
// 功能: 转折
// === 时间特性 ===
// 刚性（不可压缩）: 刚性:dim 15f,ripple 95f
// 弹性（可伸缩）: 其余段（入场/过渡/收尾/hold）可等比缩放
// === 适配注意 ===
// 调 DURATION 时只动弹性段 interpolate 关键帧，刚性核心帧区间保持固定帧数。
// 组合：命令面板 × 深浅扫场（palette-theme-ripple）
// FakeDashboard 静置 → 整屏压暗+blur → ⌘K 面板弹落 → 模拟输入"dark"
// （灰块字符逐个弹出）→ 回车帧面板 5f 收缩成一个亮点 → 深色扫场边界
// **从该亮点位置**荡开（clip-path 圆扩张 + 亮边缘环）扫过全 UI 变深色版 → 真静止。
// 组合命门：扫场起点必须是面板收缩点（960,470），收缩完成帧=扫场起始帧
// （RIPPLE=73），从别处/别帧开始就断了因果。
// 关键帧：0–15 浅色静置 → 15–22 压暗 blur → 22–30 面板弹落（超调）→
// 38–62 逐字输入 d/a/r/k → 68 回车 → 68–73 面板收缩成亮点 → 73–95 扫场
// 荡开 → 95–170 深色真静止 75f。深色版为手工反转 G 色板的本地 DarkDashboard。
// 帧确定，无随机源。
import React from 'react';
import { useCurrentFrame, interpolate, Easing } from 'remotion';
import { G } from '../../_fixtures/Fixtures';
import { SceneContent, SceneContentData } from '../../_system/scene-content';
import { FONT_STACK } from '../../_system/typography';

const DIM_START = 15;
const PANEL_IN = 22;
const TYPE_FRAMES = [38, 46, 54, 62]; // d a r k
const ENTER = 68;
const RIPPLE = 73; // 面板收缩完成帧 = 扫场起始帧（组合命门）
const RIPPLE_END = 95;
const ORIGIN = { x: 960, y: 470 }; // 面板中心 = 收缩点 = 扫场圆心
const MAX_R = 1250;

// 手工反转 G 色板的深色版
const D = {
  bg: '#1a1a1c', panel: '#232325', line: '#3a3a38', bar: '#6f6f6d',
  ink: '#e8e8e6', mid: '#7a7a78', card: '#262628', border: '#454543',
  side: '#0e0e10', sideBar: '#555553',
};

const DarkCard: React.FC<{ title: string; rows: string[] }> = ({ title, rows }) => (
  <div style={{ width: '100%', height: '100%', background: D.card, border: `2px solid ${D.border}`, borderRadius: 14, padding: 18, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 10 }}>
    <div style={{ fontFamily: FONT_STACK, fontSize: 16, fontWeight: 700, color: D.ink }}>{title}</div>
    {rows.map((r, i) => (
      <div key={i} style={{ fontFamily: FONT_STACK, fontSize: 13, color: D.mid }}>{r}</div>
    ))}
    <div style={{ marginTop: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
      <div style={{ width: 26, height: 26, borderRadius: 13, background: D.mid, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: D.bg }}>{title.charAt(0)}</div>
      <div style={{ fontFamily: FONT_STACK, fontSize: 12, color: D.line }}>成员</div>
    </div>
  </div>
);

// 与 FakeDashboard variant A 布局逐像素一致的深色版——扫场读作"同一 UI 换肤"
const DarkDashboard: React.FC<{
  appName: string;
  menuItems: { icon: string; label: string }[];
  mainTitle: string;
  searchText: string;
  avatarText: string;
  cards: { title: string; rows: string[] }[];
}> = ({ appName, menuItems, mainTitle, searchText, avatarText, cards }) => (
  <div style={{ width: 1920, height: 1080, background: D.bg, display: 'flex', fontFamily: FONT_STACK }}>
    <div style={{ width: 220, background: D.side, padding: '28px 22px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: D.sideBar, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: D.bg }}>◆</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: D.sideBar }}>{appName}</div>
      </div>
      {menuItems.map((it, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, height: 30 }}>
          <div style={{ width: 18, height: 18, borderRadius: 5, background: D.sideBar, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: D.bg }}>{it.icon}</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: D.sideBar }}>{it.label}</div>
        </div>
      ))}
    </div>
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div style={{ height: 72, background: D.panel, borderBottom: `2px solid ${D.line}`, display: 'flex', alignItems: 'center', padding: '0 32px', gap: 20, boxSizing: 'border-box' }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: D.ink }}>{mainTitle}</div>
        <div style={{ marginLeft: 'auto', height: 36, minWidth: 320, display: 'flex', alignItems: 'center', padding: '0 18px', background: D.card, border: `2px solid ${D.line}`, borderRadius: 18, boxSizing: 'border-box', fontSize: 14, color: D.mid }}>{searchText}</div>
        <div style={{ width: 36, height: 36, borderRadius: 18, background: D.mid, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 800, color: D.bg }}>{avatarText}</div>
      </div>
      <div style={{ flex: 1, padding: 36, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gridAutoRows: '1fr', gap: 28, boxSizing: 'border-box' }}>
        {cards.map((c, i) => (
          <DarkCard key={i} title={c.title} rows={c.rows} />
        ))}
      </div>
    </div>
  </div>
);

export interface PaletteThemeRippleProps {
  scene?: SceneContentData; // 浅色层内容
  query?: string; // 面板输入文字
  appName?: string; // 深色层侧栏品牌
  menuItems?: { icon: string; label: string }[]; // 深色层菜单
  mainTitle?: string; // 深色层顶栏标题
  searchText?: string; // 深色层搜索
  avatarText?: string; // 深色层头像
  cards?: { title: string; rows: string[] }[]; // 深色层卡片组
  commands?: { icon: string; label: string }[]; // 面板结果行
}

export const PaletteThemeRipple: React.FC<PaletteThemeRippleProps> = ({
  scene = {
    title: '概览',
    type: 'rows',
    rows: [
      { label: '指标一', value: '+18%' },
      { label: '指标二', value: '2.1×' },
      { label: '指标三', value: '96.4%' },
    ],
  },
  query = 'dark',
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
  commands = [
    { icon: '◆', label: '切换主题' },
    { icon: '●', label: '新建文档' },
    { icon: '▲', label: '打开设置' },
  ],
}) => {
  const f = useCurrentFrame();

  // 压暗 + blur：面板阶段生效，扫场完成后浅色层已被卸载
  const dim = interpolate(f, [DIM_START, DIM_START + 7], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  // 面板弹落（back-out 超调）
  const panelT = interpolate(f, [PANEL_IN, PANEL_IN + 8], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.out(Easing.back(1.9)),
  });
  // 回车后 5f 收缩成一点（ease-in，越缩越快）
  const shrink = interpolate(f, [ENTER, RIPPLE], [1, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.in(Easing.cubic),
  });
  const panelMounted = f >= PANEL_IN && f < RIPPLE;
  const panelScale = f < ENTER ? panelT : shrink;
  const panelDropY = f < ENTER ? interpolate(panelT, [0, 1], [-120, 0]) : 0;

  // 逐字输入：每个灰块 4f 内弹出
  const charScale = (i: number) =>
    interpolate(f, [TYPE_FRAMES[i], TYPE_FRAMES[i] + 4], [0, 1], {
      extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
      easing: Easing.out(Easing.back(2.2)),
    });
  const typedCount = TYPE_FRAMES.filter((t) => f >= t).length;

  // 扫场：圆从收缩点荡开（ease-out，先快后缓），边缘带亮环
  const r = interpolate(f, [RIPPLE, RIPPLE_END], [12, MAX_R], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const rippling = f >= RIPPLE && f < RIPPLE_END;
  const done = f >= RIPPLE_END;
  const ringOpacity = interpolate(f, [RIPPLE, RIPPLE_END], [0.95, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  // 亮点：收缩完成前后 3f 的高光核（把"收缩点=扫场起点"钉死给观众看）
  const dotOn = f >= ENTER + 2 && f < RIPPLE + 3;

  return (
    <div style={{ width: 1920, height: 1080, background: D.bg, position: 'relative', overflow: 'hidden' }}>
      {/* 浅色层：扫场完成后条件卸载（真静止） */}
      {!done && (
        <div style={{ position: 'absolute', inset: 0, filter: dim > 0 ? `brightness(${1 - dim * 0.45}) blur(${dim * 6}px)` : 'none' }}>
          <SceneContent content={scene} />
        </div>
      )}

      {/* 深色层：从收缩点起被圆形 clip 揭开；完成后铺满且无 clip */}
      {(rippling || done) && (
        <div style={{ position: 'absolute', inset: 0, clipPath: done ? 'none' : `circle(${r}px at ${ORIGIN.x}px ${ORIGIN.y}px)` }}>
          <DarkDashboard
            appName={appName}
            menuItems={menuItems}
            mainTitle={mainTitle}
            searchText={searchText}
            avatarText={avatarText}
            cards={cards}
          />
        </div>
      )}

      {/* 扫场亮边缘环 */}
      {rippling && (
        <div
          style={{
            position: 'absolute',
            left: ORIGIN.x - r,
            top: ORIGIN.y - r,
            width: r * 2,
            height: r * 2,
            borderRadius: '50%',
            border: '5px solid rgba(255,255,255,0.9)',
            opacity: ringOpacity,
            boxShadow: '0 0 40px rgba(255,255,255,0.5), inset 0 0 30px rgba(255,255,255,0.35)',
          }}
        />
      )}

      {/* 收缩亮点 */}
      {dotOn && (
        <div
          style={{
            position: 'absolute',
            left: ORIGIN.x - 11,
            top: ORIGIN.y - 11,
            width: 22,
            height: 22,
            borderRadius: 11,
            background: '#ffffff',
            boxShadow: '0 0 46px 14px rgba(255,255,255,0.85)',
          }}
        />
      )}

      {/* ⌘K 命令面板 */}
      {panelMounted && (
        <div
          style={{
            position: 'absolute',
            left: ORIGIN.x - 340,
            top: ORIGIN.y - 130 + panelDropY,
            width: 680,
            height: 260,
            transform: `scale(${Math.max(panelScale, 0.001)})`,
            transformOrigin: 'center center',
            background: G.card,
            border: `2px solid ${G.border}`,
            borderRadius: 18,
            boxShadow: '0 30px 80px rgba(0,0,0,0.4)',
            padding: 24,
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          {/* 输入行：⌘K 标识 + 逐字灰块 */}
          <div style={{ height: 62, border: `2px solid ${G.line}`, borderRadius: 12, display: 'flex', alignItems: 'center', gap: 14, padding: '0 18px', boxSizing: 'border-box' }}>
            <div style={{ padding: '6px 12px', borderRadius: 8, background: G.side, color: G.card, fontFamily: FONT_STACK, fontWeight: 800, fontSize: 22 }}>⌘K</div>
            {TYPE_FRAMES.map((_, i) => (
              <div key={i} style={{ fontFamily: FONT_STACK, fontSize: 26, fontWeight: 700, color: G.ink, transform: `scale(${charScale(i)})` }}>{query[i] ?? ''}</div>
            ))}
            {/* 光标：帧确定闪烁（每 8f 翻转） */}
            <div style={{ width: 4, height: 34, background: G.ink, opacity: Math.floor(f / 8) % 2 === 0 ? 1 : 0 }} />
          </div>
          {/* 结果行：输入完成后首行加深表示选中 */}
          {commands.map((c, i) => (
            <div key={i} style={{ height: 44, borderRadius: 10, background: i === 0 && typedCount === 4 ? G.line : G.panel, display: 'flex', alignItems: 'center', gap: 14, padding: '0 16px', boxSizing: 'border-box' }}>
              <div style={{ width: 24, height: 24, borderRadius: 6, background: G.mid, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: G.bg }}>{c.icon}</div>
              <div style={{ fontFamily: FONT_STACK, fontSize: 16, fontWeight: 600, color: G.ink }}>{c.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
