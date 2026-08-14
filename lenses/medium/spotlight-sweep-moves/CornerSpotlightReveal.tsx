// === 可调参数 ===
// DURATION: 180（总帧数，可调；弹性段随 DURATION 等比缩放）
// 色彩: 走纸墨 G 色板（src/_fixtures/Fixtures.tsx）——文字 G.ink / 背景 G.bg / 强调 G.accent
// 功能: 展开,承接
// === 时间特性 ===
// 刚性（不可压缩）: 刚性:sweep 110f,reveal 125f
// 弹性（可伸缩）: 其余段（入场/过渡/收尾/hold）可等比缩放
// === 适配注意 ===
// 调 DURATION 时只动弹性段 interpolate 关键帧，刚性核心帧区间保持固定帧数。
// corner-spotlight-reveal —— 对标 clickup-30.mp4 41.5–44.6s：
// 黑场上，左上角径向聚光从小到大扩张，把界面逐步"点亮"，
// 照到的区域显影、照不到的沉黑，最终全屏亮起。光即转场。
// v7 全参数化：面板标题、标签组、高亮标签、内容行全部可传（原 Inbox/All/Tasks 外壳已参数化）。
import React from 'react';
import { G } from '../../_fixtures/Fixtures';
import { AbsoluteFill, interpolate } from 'remotion';
import { FONT_STACK } from '../../_system/typography';
import { useShotFrame } from '../../../engine/useShotFrame';
import type { ShotTime } from '../../../engine/time';

// 时长画像（lens-timings 无此镜头；按文件头「刚性:sweep 110f,reveal 125f」标）
const SHOT_TIME: ShotTime = {
  segments: [
    { from: 0, to: 110, mode: 'rigid' },
    { from: 110, to: 180, mode: 'elastic', minFrames: 20 },
  ],
  minFrames: 130,
};

const FONT = '"Avenir Next", "Helvetica Neue", Helvetica, sans-serif';

// 灰阶界面（自绘，替代真 UI；标题/标签组/高亮/内容行全部参数化）
const Panel: React.FC<{
  rows: { title: string; meta: string; detail: string; note: string }[];
  panelTitle: string;
  tabs: string[];
  activeTab: number;
}> = ({ rows, panelTitle, tabs, activeTab }) => (
  <div
    style={{
      width: 1920,
      height: 1080,
      background: G.bg,
      fontFamily: FONT,
      padding: '90px 120px',
      boxSizing: 'border-box',
      color: G.ink,
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 26 }}>
      <div style={{ fontSize: 118, fontWeight: 700, letterSpacing: -2 }}>{panelTitle}</div>
      <div
        style={{
          width: 0, height: 0, marginTop: 26,
          borderLeft: '16px solid transparent',
          borderRight: '16px solid transparent',
          borderTop: `20px solid ${G.ink}`,
        }}
      />
    </div>
    <div style={{ display: 'flex', gap: 64, marginTop: 90, fontSize: 44, color: G.mid }}>
      {tabs.map((t, i) => (
        <div
          key={i}
          style={{
            background: i === activeTab ? G.nav : 'transparent',
            color: i === activeTab ? G.accent : G.mid,
            padding: i === activeTab ? '10px 34px' : '10px 0',
            borderRadius: 14,
            fontWeight: 600,
          }}
        >
          {t}
        </div>
      ))}
    </div>
    {rows.map((r, i) => (
      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 30, marginTop: i === 0 ? 96 : 64 }}>
        <div style={{ width: 42, height: 42, border: `3px solid ${G.border}`, borderRadius: 10 }} />
        <div style={{ width: 14, height: 14, borderRadius: 7, background: G.accent }} />
        <div style={{ width: 56, height: 56, borderRadius: 28, background: G.panel }} />
        <div>
          <div style={{ display: 'flex', gap: 22, alignItems: 'center' }}>
            <div style={{ fontFamily: FONT_STACK, fontSize: 24, fontWeight: 700, color: G.ink }}>{r.title}</div>
            <div style={{ width: 8, height: 8, borderRadius: 4, background: G.mid }} />
            <div style={{ fontFamily: FONT_STACK, fontSize: 18, color: G.mid }}>{r.meta}</div>
          </div>
          <div style={{ display: 'flex', gap: 14, marginTop: 16 }}>
            <div style={{ fontFamily: FONT_STACK, fontSize: 16, color: G.ink, opacity: 0.85 }}>{r.detail}</div>
            <div style={{ fontFamily: FONT_STACK, fontSize: 16, color: G.mid }}>{r.note}</div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

export interface CornerSpotlightRevealProps {
  panelTitle?: string; // 面板标题（原 Inbox 外壳，已参数化）
  tabs?: string[]; // 标签组（原 All/Tasks/Docs/People/Chat 外壳，已参数化）
  activeTab?: number; // 高亮标签索引
  rows?: { title: string; meta: string; detail: string; note: string }[]; // 内容行
}

export const CornerSpotlightReveal: React.FC<CornerSpotlightRevealProps> = ({
  panelTitle = '工作台',
  tabs = ['全部', '任务', '文档', '成员', '聊天'],
  activeTab = 0,
  rows = [
    { title: '任务 01', meta: '说明 01', detail: '负责人 甲', note: '备注 01' },
    { title: '任务 02', meta: '说明 02', detail: '负责人 乙', note: '备注 02' },
    { title: '任务 03', meta: '说明 03', detail: '负责人 丙', note: '备注 03' },
  ],
}) => {
  const frame = useShotFrame(SHOT_TIME);

  // 聚光半径扩张：全程匀速（用户裁决"整个过程要匀速"——严格 linear，无缓动）
  // r+feather=1.85r 是光前沿；1.85*1300≈2400 恰在片尾盖满全屏对角，
  // 保证扩张动作占满全片时长而不是前 1/3 就饱和
  const r = interpolate(frame, [0, 100], [160, 1300], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // 光心沿左上角匀速游移（linear）
  const cx = interpolate(frame, [0, 96], [140, 420], { extrapolateRight: 'clamp' });
  const cy = interpolate(frame, [0, 96], [90, 260], { extrapolateRight: 'clamp' });

  // 软边宽度：扩张时边缘更羽化
  const feather = r * 0.85;

  // UI 轻微透视漂移（原片相机贴着界面缓推）
  const drift = interpolate(frame, [0, 100], [0, 1]);
  const scale = 1.75 - 0.28 * drift;
  const tx = -40 + 70 * drift;
  const ty = -30 + 50 * drift;

  const mask = `radial-gradient(circle ${r + feather}px at ${cx}px ${cy}px, rgba(255,255,255,1) ${Math.max(
    0,
    ((r - feather * 0.25) / (r + feather)) * 100,
  )}%, rgba(255,255,255,0) 100%)`;

  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <AbsoluteFill
        style={{
          WebkitMaskImage: mask,
          maskImage: mask,
          transform: `scale(${scale}) translate(${tx}px, ${ty}px) rotate(${-1.2 + 1.2 * drift}deg)`,
          transformOrigin: '18% 12%',
        }}
      >
        <Panel rows={rows} panelTitle={panelTitle} tabs={tabs} activeTab={activeTab} />
      </AbsoluteFill>
      {/* 聚光自身的白热光晕（叠在界面上方，光心最亮） */}
      <div
        style={{
          position: 'absolute',
          left: cx - r * 0.7,
          top: cy - r * 0.7,
          width: r * 1.4,
          height: r * 1.4,
          borderRadius: '50%',
          background: 'radial-gradient(closest-side, rgba(255,255,255,0.85), rgba(255,255,255,0.25) 45%, transparent 75%)',
          filter: 'blur(26px)',
          opacity: interpolate(frame, [0, 10, 60, 90], [0, 0.9, 0.55, 0], {
            extrapolateRight: 'clamp',
          }),
          pointerEvents: 'none',
        }}
      />
    </AbsoluteFill>
  );
};
