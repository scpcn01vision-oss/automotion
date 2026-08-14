// === 可调参数 ===
// DURATION: 180（总帧数，可调；弹性段随 DURATION 等比缩放）
// 色彩: 走纸墨 G 色板（src/_fixtures/Fixtures.tsx）——文字 G.ink / 背景 G.bg / 强调 G.accent
// 功能: 展开,承接
// === 时间特性 ===
// 策略: 弹刚 ShotTime（整段弹性）
// 刚性（不可压缩）: 无
// 弹性（可伸缩）: 全程可等比缩放（时长适配语音）
// === 适配注意 ===
// 段长不足 60f 时回退原始帧（动画按原速、可能被截断）。
// slide-spotlight-pan v2 —— 按用户截图 clickup03 重做：
// 紫色光线贴着 UI 面板边缘泛光（先绕左上角竖缘、再沿顶边横走），
// 聚光头匀速右移，照到处显影、离开处沉暗；面板匀速左滑（相机右摇感）。
// 用户裁决："紫色的光线是贴着ui界面泛光的，聚光的移动是匀速的"。
import React from 'react';
import { G } from '../../_fixtures/Fixtures';
import { AbsoluteFill, interpolate } from 'remotion';
import { FONT_STACK } from '../../_system/typography';

import { useShotFrame } from '../../../engine/useShotFrame';
import type { ShotTime } from '../../../engine/time';

// 时长画像：整段弹性（2026-08-14 精修）
const SHOT_TIME: ShotTime = {
  segments: [{ from: 0, to: 180, mode: 'elastic', minFrames: 60 }],
  minFrames: 60,
};

const ink = G.ink;
const mid = G.mid;
const line = G.line;

const PW = 3000;
const PH = 1400;
const TOP = 150;   // 面板顶边在屏幕座标的 y
const CR = 60;     // 面板圆角

const SideRow: React.FC<{ label: string; icon: string }> = ({ label, icon }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 16, height: 44 }}>
    <div style={{ width: 26, height: 26, borderRadius: 7, background: mid, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: G.panel }}>{icon}</div>
    <div style={{ fontFamily: FONT_STACK, fontSize: 17, fontWeight: 600, color: G.ink }}>{label}</div>
  </div>
);

const Task: React.FC<{ title: string; sub: string }> = ({ title, sub }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '26px 0', borderBottom: `1px solid ${line}` }}>
    <div style={{ fontFamily: FONT_STACK, fontSize: 16, fontWeight: 700, color: G.ink }}>{title}</div>
    <div style={{ fontFamily: FONT_STACK, fontSize: 14, color: G.mid }}>{sub}</div>
  </div>
);

const Col: React.FC<{ accent: string; title: string; rows: { title: string; sub: string }[]; w: number }> = ({ accent, title, rows, w }) => (
  <div style={{ width: w, flexShrink: 0 }}>
    <div style={{ borderTop: `6px solid ${accent}`, paddingTop: 24, display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ fontFamily: FONT_STACK, fontSize: 20, fontWeight: 700, color: G.ink }}>{title}</div>
      <div style={{ width: 32, height: 32, borderRadius: 16, border: `3px solid ${line}` }} />
      <div style={{ marginLeft: 'auto', fontFamily: FONT_STACK, fontSize: 14, color: G.mid }}>查看全部</div>
    </div>
    {rows.map((r, i) => <Task key={i} title={r.title} sub={r.sub} />)}
  </div>
);

// 超宽面板内容（放大特写级别）：侧栏 + 顶栏 + 三列看板（占位条已换文字）
const WidePanel: React.FC<{
  panelTitle: string;
  sidebarItems: { icon: string; label: string }[];
  sectionLabel: string;
  subItems: { icon: string; label: string }[];
  searchText: string;
  actions: string[];
  columns: { title: string; rows: { title: string; sub: string }[] }[];
}> = ({ panelTitle, sidebarItems, sectionLabel, subItems, searchText, actions, columns }) => (
  <div style={{
    width: PW, height: PH, background: G.panel,
    display: 'flex', boxSizing: 'border-box',
    borderRadius: `${CR}px ${CR}px 0 0`,
    fontFamily: FONT_STACK,
  }}>
    <div style={{ width: 560, borderRight: `3px solid ${line}`, padding: '52px 48px', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 56 }}>
        <div style={{ width: 46, height: 46, borderRadius: 12, background: ink, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: G.panel }}>◆</div>
        <div style={{ fontFamily: FONT_STACK, fontSize: 24, fontWeight: 700, color: G.ink }}>{panelTitle}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {sidebarItems.map((it, i) => <SideRow key={i} label={it.label} icon={it.icon} />)}
      </div>
      <div style={{ fontFamily: FONT_STACK, fontSize: 18, fontWeight: 700, color: G.mid, margin: '58px 0 24px' }}>{sectionLabel}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {subItems.map((it, i) => <SideRow key={i} label={it.label} icon={it.icon} />)}
      </div>
    </div>
    <div style={{ flex: 1, padding: '52px 64px', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 22, marginBottom: 48 }}>
        <div style={{ fontFamily: FONT_STACK, fontSize: 26, fontWeight: 800, color: G.ink }}>{searchText}</div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 16 }}>
          {actions.map((a, i) => (
            <div key={i} style={{ fontFamily: FONT_STACK, fontSize: 16, fontWeight: 600, color: G.mid, padding: '8px 18px', borderRadius: 10, border: `2px solid ${line}` }}>{a}</div>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 84 }}>
        {columns.map((c, i) => (
          <Col key={i} accent={[G.accent, G.mid, G.bar][i % 3]} title={c.title} rows={c.rows} w={620} />
        ))}
      </div>
    </div>
  </div>
);

export interface SlideSpotlightPanProps {
  panelTitle?: string; // 工作区名
  sidebarItems?: { icon: string; label: string }[]; // 侧栏主菜单
  sectionLabel?: string; // 侧栏分区标签
  subItems?: { icon: string; label: string }[]; // 侧栏次级菜单
  searchText?: string; // 顶栏搜索
  actions?: string[]; // 顶栏操作
  columns?: { title: string; rows: { title: string; sub: string }[] }[]; // 看板列
}

export const SlideSpotlightPan: React.FC<SlideSpotlightPanProps> = ({
  panelTitle = '项目工作区',
  sidebarItems = [
    { icon: '◆', label: '仪表盘' },
    { icon: '●', label: '任务' },
    { icon: '▲', label: '文档' },
    { icon: '●', label: '成员' },
    { icon: '▲', label: '设置' },
    { icon: '◆', label: '通知' },
  ],
  sectionLabel = '常用',
  subItems = [
    { icon: '●', label: '消息' },
    { icon: '▲', label: '收藏' },
    { icon: '◆', label: '最近' },
    { icon: '●', label: '归档' },
  ],
  searchText = '搜索',
  actions = ['新建', '筛选', '排序'],
  columns = [
    {
      title: '进行中',
      rows: [
        { title: '任务 01', sub: '说明 01' },
        { title: '任务 02', sub: '说明 02' },
      ],
    },
    {
      title: '待处理',
      rows: [
        { title: '任务 03', sub: '说明 03' },
        { title: '任务 04', sub: '说明 04' },
      ],
    },
    {
      title: '已完成',
      rows: [
        { title: '任务 05', sub: '说明 05' },
        { title: '任务 06', sub: '说明 06' },
      ],
    },
  ],
}) => {
  const frame = useShotFrame(SHOT_TIME);
  // 面板匀速左滑（相机右摇）——严格 linear
  const slide = interpolate(frame, [0, 132], [180, -1100]);
  // 聚光头在面板本地座标沿顶边匀速右移——严格 linear
  // 起点在左上角竖缘（负值=还在左缘竖直段），随后转过角沿顶边走
  const head = interpolate(frame, [0, 132], [-360, 2600]);
  const onTop = Math.max(0, head);            // 顶边段进度
  const cornerT = Math.min(1, Math.max(0, (head + 360) / 360)); // 竖缘段 0→1
  const vertHeadY = TOP + 620 - cornerT * 620; // 左缘光头从下往上爬到角

  // 屏幕座标的光头位置
  const headScreenX = slide + onTop;
  // 光头在竖缘阶段贴着面板左缘
  const leftEdgeX = slide;

  // 竖缘光线强度：角前满、转角后衰减
  const vGlow = head < 0 ? 1 : Math.max(0, 1 - head / 900);
  // 顶边光线强度：转角后满
  const hGlow = Math.min(1, Math.max(0, (head + 120) / 240));

  const grad = (dir: string, c: string) =>
    `linear-gradient(${dir}, rgba(0,0,0,0) 0%, ${c} 42%, ${c} 58%, rgba(0,0,0,0) 100%)`;

  return (
    <AbsoluteFill style={{ background: '#050409', overflow: 'hidden' }}>
      {/* 面板层：聚光范围内显影 */}
      <div style={{ position: 'absolute', left: 0, top: TOP, transform: `translateX(${slide}px)` }}>
        <WidePanel
          panelTitle={panelTitle}
          sidebarItems={sidebarItems}
          sectionLabel={sectionLabel}
          subItems={subItems}
          searchText={searchText}
          actions={actions}
          columns={columns}
        />
        {/* 贴面泛光：光头下方的紫光晕染进 UI 顶部（贴着界面泛光的关键层） */}
        <div style={{
          position: 'absolute', left: onTop - 620, top: -30, width: 1240, height: 380,
          background: 'radial-gradient(ellipse 620px 190px at 50% 0%, rgba(211,146,60,0.5), rgba(184,122,46,0.16) 55%, rgba(0,0,0,0) 78%)',
          filter: 'blur(6px)', opacity: hGlow,
        }} />
        {/* 左缘贴面泛光（竖缘阶段） */}
        <div style={{
          position: 'absolute', left: -30, top: vertHeadY - TOP - 320, width: 340, height: 780,
          background: 'radial-gradient(ellipse 170px 390px at 0% 50%, rgba(211,146,60,0.45), rgba(184,122,46,0.14) 55%, rgba(0,0,0,0) 78%)',
          filter: 'blur(6px)', opacity: vGlow,
        }} />
        {/* 聚光范围外压暗：以光头为中心的显影罩（面板本地座标，跟光头走） */}
        <div style={{
          position: 'absolute', inset: -60,
          background: `radial-gradient(ellipse 1350px 1000px at ${onTop + 60}px ${(head < 0 ? vertHeadY - TOP : 40) + 260}px, rgba(0,0,0,0) 26%, rgba(0,0,0,0.55) 60%, rgba(5,4,9,0.96) 100%)`,
        }} />
      </div>

      {/* ===== 贴边紫色光线本体（屏幕层，贴着面板边缘） ===== */}
      {/* 顶边横向光线：三层辉光 + 亮芯，中心=光头 */}
      <div style={{ opacity: hGlow }}>
        <div style={{
          position: 'absolute', left: headScreenX - 640, top: TOP - 56, width: 1280, height: 112,
          background: grad('90deg', 'rgba(211,146,60,0.55)'), filter: 'blur(30px)',
        }} />
        <div style={{
          position: 'absolute', left: headScreenX - 470, top: TOP - 17, width: 940, height: 34,
          background: grad('90deg', 'rgba(242,201,138,0.9)'), filter: 'blur(10px)',
        }} />
        <div style={{
          position: 'absolute', left: headScreenX - 330, top: TOP - 8, width: 660, height: 16,
          background: grad('90deg', 'rgba(242,201,138,0.85)'), filter: 'blur(5px)',
        }} />
        <div style={{
          position: 'absolute', left: headScreenX - 300, top: TOP - 3, width: 600, height: 6,
          background: grad('90deg', '#f6e8ff'), filter: 'blur(1.5px)',
        }} />
      </div>
      {/* 左上角竖缘光线（起始阶段，贴面板左缘） */}
      <div style={{ opacity: vGlow }}>
        <div style={{
          position: 'absolute', left: leftEdgeX - 52, top: vertHeadY - 420, width: 104, height: 840,
          background: grad('180deg', 'rgba(211,146,60,0.5)'), filter: 'blur(28px)',
        }} />
        <div style={{
          position: 'absolute', left: leftEdgeX - 14, top: vertHeadY - 330, width: 28, height: 660,
          background: grad('180deg', 'rgba(242,201,138,0.9)'), filter: 'blur(9px)',
        }} />
        <div style={{
          position: 'absolute', left: leftEdgeX - 3, top: vertHeadY - 260, width: 6, height: 520,
          background: grad('180deg', '#f6e8ff'), filter: 'blur(1.5px)',
        }} />
      </div>

      {/* 顶上方黑檐：光带以上纯黑（截图里顶边之上是黑场） */}
      <div style={{
        position: 'absolute', left: 0, top: 0, width: 1920, height: TOP - 4,
        background: 'linear-gradient(180deg, #050409 78%, rgba(5,4,9,0) 100%)',
      }} />
    </AbsoluteFill>
  );
};
