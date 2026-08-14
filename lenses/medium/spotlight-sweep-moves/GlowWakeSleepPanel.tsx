// === 可调参数 ===
// DURATION: 180（总帧数，可调；弹性段随 DURATION 等比缩放）
// 色彩: 走纸墨 G 色板（src/_fixtures/Fixtures.tsx）——文字 G.ink / 背景 G.bg / 强调 G.accent
// 功能: 展开,承接
// === 时间特性 ===
// 刚性（不可压缩）: 刚性:sweep 110f,reveal 125f
// 弹性（可伸缩）: 其余段（入场/过渡/收尾/hold）可等比缩放
// === 适配注意 ===
// 调 DURATION 时只动弹性段 interpolate 关键帧，刚性核心帧区间保持固定帧数。
// glow-wake-sleep-panel v3 —— 扫光方向改为从左向右（用户裁决）：
// 聚光灯从左向右"扫过"斜置面板；一条带辉光的紫色光线贴着 UI 顶边/边框/
// logo 划过，光到即亮、光走即暗，尾段沉回黑暗（右缘残留蓝紫）。
import React from 'react';
import { G } from '../../_fixtures/Fixtures';
import { AbsoluteFill, interpolate } from 'remotion';
import { FONT_STACK } from '../../_system/typography';

import { useShotFrame } from '../../../engine/useShotFrame';
import type { ShotTime } from '../../../engine/time';

// 时长画像（保守兜底：整段弹性；精修阶段按镜头关键帧画像刚弹分段）
const SHOT_TIME: ShotTime = {
  segments: [{ from: 0, to: 180, mode: 'elastic', minFrames: 60 }],
  minFrames: 60,
};

const W = 1250;
const H = 860;
const R = 26;

const ink = G.ink;
const line = G.line;

const Row: React.FC<{ label: string; icon: string }> = ({ label, icon }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, height: 30 }}>
    <div style={{ width: 18, height: 18, borderRadius: 5, background: G.bar, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: G.side }}>{icon}</div>
    <div style={{ fontFamily: FONT_STACK, fontSize: 14, fontWeight: 600, color: G.ink }}>{label}</div>
  </div>
);

const TaskCard: React.FC<{ title: string; sub: string; status?: string }> = ({ title, sub, status }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '14px 0', borderBottom: `1px solid ${line}` }}>
    <div style={{ fontFamily: FONT_STACK, fontSize: 15, fontWeight: 700, color: G.ink }}>{title}</div>
    <div style={{ fontFamily: FONT_STACK, fontSize: 12, color: G.mid }}>{sub}</div>
    {status ? <div style={{ fontFamily: FONT_STACK, fontSize: 11, color: G.bar }}>{status}</div> : null}
  </div>
);

// 中性面板（侧栏 + 双列任务板；原 ClickUp 灰阶骨架已换文字内容）
interface PanelProps {
  panelTitle: string;
  sidebarItems: { icon: string; label: string }[];
  sectionLabel: string;
  subItems: { icon: string; label: string }[];
  searchText: string;
  columns: { title: string; rows: { title: string; sub: string; status?: string }[] }[];
}

const Panel: React.FC<PanelProps> = ({ panelTitle, sidebarItems, sectionLabel, subItems, searchText, columns }) => (
  <div style={{
    width: W, height: H, background: G.panel, borderRadius: R,
    display: 'flex', overflow: 'hidden', boxSizing: 'border-box',
  }}>
    <div style={{ width: 300, borderRight: `2px solid ${line}`, padding: '30px 28px', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 34 }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: ink, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 800, color: G.panel }}>◆</div>
        <div style={{ fontFamily: FONT_STACK, fontSize: 17, fontWeight: 700, color: G.ink }}>{panelTitle}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {sidebarItems.map((it, i) => <Row key={i} label={it.label} icon={it.icon} />)}
      </div>
      <div style={{ fontFamily: FONT_STACK, fontSize: 13, fontWeight: 700, color: G.mid, margin: '34px 0 16px' }}>{sectionLabel}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {subItems.map((it, i) => <Row key={i} label={it.label} icon={it.icon} />)}
      </div>
    </div>
    <div style={{ flex: 1, padding: '30px 36px', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 30 }}>
        <div style={{ fontFamily: FONT_STACK, fontSize: 20, fontWeight: 800, color: G.ink }}>{panelTitle}</div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontFamily: FONT_STACK, fontSize: 13, color: G.mid }}>{searchText}</div>
          <div style={{ width: 22, height: 22, borderRadius: 11, border: `2px solid ${line}` }} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 44 }}>
        {columns.map((col, ci) => (
          <div key={ci} style={{ flex: 1 }}>
            <div style={{ borderTop: `4px solid ${G.accent}`, paddingTop: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ fontFamily: FONT_STACK, fontSize: 15, fontWeight: 700, color: G.ink }}>{col.title}</div>
              <div style={{ width: 22, height: 22, borderRadius: 11, border: `2px solid ${line}` }} />
            </div>
            {col.rows.map((r, i) => <TaskCard key={i} title={r.title} sub={r.sub} status={r.status} />)}
          </div>
        ))}
      </div>
    </div>
  </div>
);

// 贴边紫色光线（多层辉光：宽糊层+中层+亮芯），水平段，中心在 cx
const EdgeStreak: React.FC<{ cx: number; y: number; len: number; opacity: number; vertical?: boolean }> =
  ({ cx, y, len, opacity, vertical = false }) => {
    const long = { position: 'absolute' as const, left: 0, top: 0, opacity };
    const grad = (c: string) => vertical
      ? `linear-gradient(180deg, rgba(0,0,0,0) 0%, ${c} 45%, ${c} 55%, rgba(0,0,0,0) 100%)`
      : `linear-gradient(90deg, rgba(0,0,0,0) 0%, ${c} 45%, ${c} 55%, rgba(0,0,0,0) 100%)`;
    if (vertical) {
      return (
        <div style={long}>
          <div style={{ position: 'absolute', left: y - 30, top: cx - len / 2, width: 60, height: len, background: grad('rgba(211,146,60,0.55)'), filter: 'blur(26px)' }} />
          <div style={{ position: 'absolute', left: y - 11, top: cx - len / 2, width: 22, height: len, background: grad('rgba(232,184,120,0.85)'), filter: 'blur(9px)' }} />
          <div style={{ position: 'absolute', left: y - 2.5, top: cx - len * 0.4, width: 5, height: len * 0.8, background: grad('#f0deff'), filter: 'blur(1.4px)' }} />
        </div>
      );
    }
    return (
      <div style={long}>
        <div style={{ position: 'absolute', left: cx - len / 2, top: y - 34, width: len, height: 68, background: grad('rgba(211,146,60,0.60)'), filter: 'blur(26px)' }} />
        <div style={{ position: 'absolute', left: cx - len / 2, top: y - 12, width: len, height: 24, background: grad('rgba(242,201,138,0.9)'), filter: 'blur(9px)' }} />
        <div style={{ position: 'absolute', left: cx - len * 0.4, top: y - 3, width: len * 0.8, height: 6, background: grad('#f4e4ff'), filter: 'blur(1.6px)' }} />
        {/* 粉色偏移层：截图里光带紫中带粉 */}
        <div style={{ position: 'absolute', left: cx - len * 0.3, top: y - 7, width: len * 0.6, height: 12, background: grad('rgba(242,201,138,0.75)'), filter: 'blur(5px)' }} />
      </div>
    );
  };

export interface GlowWakeSleepPanelProps {
  panelTitle?: string; // 工作区名
  sidebarItems?: { icon: string; label: string }[]; // 侧栏主菜单
  sectionLabel?: string; // 侧栏分区标签
  subItems?: { icon: string; label: string }[]; // 侧栏次级菜单
  searchText?: string; // 搜索占位
  columns?: { title: string; rows: { title: string; sub: string; status?: string }[] }[]; // 任务列
}

export const GlowWakeSleepPanel: React.FC<GlowWakeSleepPanelProps> = ({
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
  columns = [
    {
      title: '进行中',
      rows: [
        { title: '任务 01', sub: '说明 01', status: '待办' },
        { title: '任务 02', sub: '说明 02', status: '进行' },
        { title: '任务 03', sub: '说明 03', status: '完成' },
      ],
    },
    {
      title: '待处理',
      rows: [
        { title: '任务 04', sub: '说明 04', status: '待办' },
        { title: '任务 05', sub: '说明 05', status: '待办' },
        { title: '任务 06', sub: '说明 06', status: '进行' },
      ],
    },
  ],
}) => {
  const frame = useShotFrame(SHOT_TIME);

  // 聚光沿面板顶边从左向右匀速扫过（面板本地座标）
  const sx = interpolate(frame, [4, 120], [-260, W + 260], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const sy = 150; // 聚光照在面板上部

  // 全局明暗包络：醒 → 展示 → 睡
  const env = interpolate(frame, [0, 16, 100, 130], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  // 尾段右缘残光：最后只剩右缘一线蓝紫
  const rightNear = Math.max(0, Math.min(1, (sx - (W - 420)) / 420));
  const tailBlue = interpolate(frame, [100, 116, 132], [0, 0.8, 0.25], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  // logo 描光：聚光经过 logo（本地 x≈60）时点亮
  const logoGlow = Math.exp(-((sx - 60) ** 2) / (2 * 230 ** 2)) * env;

  // 摄影机慢漂移：面板随扫光从左上往右下走（对应扫光方向）
  const drift = interpolate(frame, [0, 132], [-150, 150]);
  const driftY = interpolate(frame, [0, 132], [-36, 36]);

  return (
    <AbsoluteFill style={{ background: '#040308', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, perspective: 1700, perspectiveOrigin: '46% 40%' }}>
        <div style={{
          position: 'absolute', left: 400, top: 150,
          transform: `translate(${drift}px, ${driftY}px) scale(1.05) rotateY(-13deg) rotateX(9deg) rotateZ(-17deg)`,
          transformStyle: 'preserve-3d',
        }}>
          {/* 聚光环境雾光：跟随光头，泛在面板后黑场 */}
          <div style={{
            position: 'absolute', left: sx - 520, top: -300, width: 1040, height: 700,
            background: 'radial-gradient(ellipse at 50% 55%, rgba(184,122,46,0.42), rgba(184,122,46,0) 65%)',
            filter: 'blur(34px)', opacity: env,
          }} />
          {/* 后层重影面板（截图④⑤双层） */}
          <div style={{ position: 'absolute', left: -46, top: 34 }}>
            <div style={{ position: 'relative', filter: 'brightness(0.92)' }}>
              <Panel
                panelTitle={panelTitle}
                sidebarItems={sidebarItems}
                sectionLabel={sectionLabel}
                subItems={subItems}
                searchText={searchText}
                columns={columns}
              />
              {/* 重影面板同样受聚光范围控制 */}
              <div style={{
                position: 'absolute', inset: 0, borderRadius: R,
                background: `radial-gradient(circle 680px at ${sx - 46}px ${sy + 34}px, rgba(4,3,8,${1 - 0.45 * env}) 0%, rgba(4,3,8,${1 - 0.14 * env}) 55%, rgba(4,3,8,0.99) 88%)`,
              }} />
            </div>
          </div>
          {/* 面板本体：聚光范围内显影，范围外沉黑 */}
          <div style={{ position: 'relative' }}>
            <Panel
              panelTitle={panelTitle}
              sidebarItems={sidebarItems}
              sectionLabel={sectionLabel}
              subItems={subItems}
              searchText={searchText}
              columns={columns}
            />
            <div style={{
              position: 'absolute', inset: 0, borderRadius: R,
              background: `radial-gradient(circle 640px at ${sx}px ${sy}px, rgba(4,3,8,${0.12 * (1 - env)}) 0%, rgba(4,3,8,${1 - 0.72 * env}) 58%, rgba(4,3,8,0.985) 92%)`,
            }} />
            {/* 尾段右缘蓝紫残光罩 */}
            <div style={{
              position: 'absolute', inset: 0, borderRadius: R,
              background: 'linear-gradient(260deg, rgba(211,146,60,0.30) 0%, rgba(211,146,60,0) 16%)',
              opacity: tailBlue,
            }} />
          </div>
          {/* 贴顶边划过的紫色光线（本体） */}
          <EdgeStreak cx={sx} y={-2} len={980} opacity={env} />
          {/* 右缘竖直光线：聚光接近右侧时点亮，尾段转蓝紫 */}
          <EdgeStreak cx={260} y={W + 2} len={620} opacity={Math.max(rightNear * env, tailBlue * 0.9)} vertical />
          {/* logo 一圈描光（截图⑤：光经过 logo 时） */}
          <div style={{
            position: 'absolute', left: 8, top: 12, width: 150, height: 66, borderRadius: 16,
            boxShadow: '0 0 26px 8px rgba(242,201,138,0.75), 0 0 60px 22px rgba(211,146,60,0.4)',
            opacity: logoGlow,
          }} />
          {/* 光头本体眩光：贴着顶边的亮团 */}
          <div style={{
            position: 'absolute', left: sx - 190, top: -84, width: 380, height: 170,
            background: 'radial-gradient(ellipse, rgba(236,205,255,0.95), rgba(232,184,120,0.35) 45%, rgba(0,0,0,0) 72%)',
            filter: 'blur(12px)', opacity: env * 0.95,
          }} />
        </div>
      </div>
    </AbsoluteFill>
  );
};
