// === 可调参数 ===
// DURATION: 180（总帧数，可调；弹性段随 DURATION 等比缩放）
// 色彩: 走纸墨 G 色板（src/_fixtures/Fixtures.tsx）——文字 G.ink / 背景 G.bg / 强调 G.accent
// 功能: 钩子,宣告
// === 时间特性 ===
// 策略: 弹刚 ShotTime（整段弹性）
// 刚性（不可压缩）: 无（全程弹性）
// 弹性（可伸缩）: 全程可等比缩放（时长适配语音）
// === 适配注意 ===
// 调 DURATION 时只动弹性段 interpolate 关键帧，刚性核心帧区间保持固定帧数。
// 文字视频遮罩（text-as-mask）——kinetische typografie
// 深墨整屏上超粗大字（text prop，默认 SCALE），字形内部用 CSS alpha mask 套住中性 dashboard：
// 0–20f hold 读布景；20–100f dashboard 在字内匀速 translateX +110→-110（scale 1.15）；
// 100–130f 单段 bezier：mask 层 scale 1→26 放大溢出（内容层用 1/S 反向抵消不畸变），
// 同时无遮罩全屏层淡入接管，dashboard 1.15→1.0 归位；130–150f 全屏静止收尾。
// 2026-08-06 占位图形参数化：FakeDashboard A 灰条 → 中性文字/图标
// （sidebarItems / dashTitle / searchText / avatarText / cards），配色走 v7 G 色板；
// 网站版底部「TEXT AS MASK」手法名标签已去掉。
import React from 'react';
import { interpolate, Easing, useCurrentFrame } from 'remotion';
import { G } from '../../_fixtures/Fixtures';
import { FONT_STACK } from '../../_system/typography';
import { NeutralCard } from '../../_system/neutral-card';
import type { SceneContentData } from '../../_system/scene-content';
import { useShotFrame } from '../../../engine/useShotFrame';
import type { ShotTime } from '../../../engine/time';

// 时长画像（迁移自 013 lens-timings.json；全弹性）
const SHOT_TIME: ShotTime = {
  segments: [{ from: 0, to: 180, mode: 'elastic', minFrames: 80 }],
  minFrames: 80,
};

// 中性 dashboard 占位：侧栏（图标+文字菜单）/ 顶栏（标题+搜索+头像首字母）/ 3×2 指标卡（NeutralCard）
// 替代网站版 FakeDashboard A 的灰条占位，布局与动效坐标保持一致。
const DASH_CARD_W = 524;
const DASH_CARD_H = 454;

const MaskDashboard: React.FC<{
  sidebarItems: { icon: string; label: string }[];
  dashTitle: string;
  searchText: string;
  avatarText: string;
  cards: SceneContentData[];
}> = ({ sidebarItems, dashTitle, searchText, avatarText, cards }) => (
  <div style={{ width: 1920, height: 1080, background: G.bg, display: 'flex', fontFamily: FONT_STACK }}>
    {/* 侧栏：logo 图标 + 菜单（图标方块 + 文字） */}
    <div style={{ width: 220, background: G.side, padding: '28px 22px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: G.sideBar, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: G.side }}>◆</div>
      {sidebarItems.map((it, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 26, height: 26, borderRadius: 6, background: G.sideBar, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: G.side }}>{it.icon}</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: G.panel }}>{it.label}</div>
        </div>
      ))}
    </div>
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      {/* 顶栏：标题 + 搜索占位 + 头像首字母 */}
      <div style={{ height: 72, background: G.panel, borderBottom: `2px solid ${G.line}`, display: 'flex', alignItems: 'center', padding: '0 32px', gap: 20, boxSizing: 'border-box' }}>
        <div style={{ fontSize: 24, fontWeight: 700, color: G.ink }}>{dashTitle}</div>
        <div style={{ marginLeft: 'auto', height: 38, minWidth: 240, display: 'flex', alignItems: 'center', padding: '0 16px', background: G.card, border: `2px solid ${G.line}`, borderRadius: 19, boxSizing: 'border-box', fontSize: 18, color: G.mid }}>{searchText}</div>
        <div style={{ width: 38, height: 38, borderRadius: 19, background: G.mid, color: G.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 800 }}>{avatarText}</div>
      </div>
      {/* 3×2 指标卡：NeutralCard（标题 + label/value 行） */}
      <div style={{ flex: 1, padding: 36, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gridAutoRows: '1fr', gap: 28, boxSizing: 'border-box' }}>
        {cards.map((c, i) => (
          <NeutralCard key={i} w={DASH_CARD_W} h={DASH_CARD_H} content={c} style={{ width: '100%', height: '100%' }} />
        ))}
      </div>
    </div>
  </div>
);

export interface TextAsMaskProps {
  text?: string; // 遮罩大字（中性占位词）
  sidebarItems?: { icon: string; label: string }[]; // 侧栏菜单
  dashTitle?: string; // 顶栏标题
  searchText?: string; // 搜索框占位文字
  avatarText?: string; // 顶栏头像首字母
  cards?: SceneContentData[]; // 3×2 指标卡内容
  revealAtSec?: number; // 口播对齐：mask 放大（字内→全屏接管）的开始段内秒；
  //                   提供后前段（hold+平移）压缩到该时刻前，放大动画本体不变，之后全屏静止到段尾
}

export const TextAsMask: React.FC<TextAsMaskProps> = ({
  text = 'SCALE',
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
  cards = [
    { title: '概览', rows: [{ label: '指标一', value: '+18%' }, { label: '指标二', value: '2.4×' }] },
    { title: '明细', rows: [{ label: '指标三', value: '99%' }, { label: '指标四', value: '45%' }] },
    { title: '汇总', rows: [{ label: '指标五', value: '7.1×' }, { label: '指标六', value: '88%' }] },
    { title: '进度', rows: [{ label: '指标七', value: '32%' }, { label: '指标八', value: '64%' }] },
    { title: '风险', rows: [{ label: '指标九', value: '21%' }, { label: '指标十', value: '57%' }] },
    { title: '备注', rows: [{ label: '指标十一', value: '✓' }, { label: '指标十二', value: '–' }] },
  ],
  revealAtSec,
}) => {
  const frameShot = useShotFrame(SHOT_TIME);
  const realFrame = useCurrentFrame();
  const cueMode = revealAtSec !== undefined;
  const f = cueMode ? realFrame : frameShot;
  const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
  // 放大动画本体时长（2s：保持 bezier 平滑，接管不拖沓；可随 params 微调）
  const REVEAL_DUR = 2;

  // 遮罩 SVG：超粗大字按 text prop 渲染，字号 360（网站版默认）
  const MASK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080"><text x="960" y="666" font-family="${FONT_STACK}" font-size="360" font-weight="900" letter-spacing="-8" text-anchor="middle" fill="white">${text}</text></svg>`;
  const MASK_URL = `url("data:image/svg+xml,${encodeURIComponent(MASK_SVG)}")`;
  // mask 放大原点：取字母 L 的竖笔位置（约 61.5% 处），保证放大时原点落在实心笔画内
  const ORIGIN = '61.5% 50%';

  // 撤场/接管进度（单段 bezier）：
  // 默认模式：原始坐标 100–130f；口播对齐模式：从 revealAtSec 起 2s
  let endT: number;
  if (cueMode) {
    endT = interpolate(realFrame, [revealAtSec * 30, revealAtSec * 30 + REVEAL_DUR * 30], [0, 1], {
      ...clamp,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    });
  } else {
    endT = interpolate(f, [100, 130], [0, 1], {
      ...clamp,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    });
  }

  // dashboard 内容运动：默认模式 20–100f 匀速漂移；口播对齐模式压缩到 revealAtSec 前（hold 20% + 平移 80%）
  let driftX: number;
  if (cueMode) {
    const sec = realFrame / 30;
    const holdEnd = revealAtSec * 0.2;
    if (sec < holdEnd) {
      driftX = 110; // hold：静止在平移起点
    } else if (sec < revealAtSec) {
      driftX = interpolate(sec, [holdEnd, revealAtSec], [110, -110], clamp);
    } else {
      driftX = interpolate(endT, [0, 1], [-110, 0]); // 放大时归位（与默认模式一致）
    }
  } else {
    driftX = interpolate(f, [20, 100], [110, -110], clamp);
  }
  const dx = cueMode ? driftX : f < 100 ? driftX : interpolate(endT, [0, 1], [-110, 0]);
  const dashS = interpolate(endT, [0, 1], [1.15, 1]);

  // mask 层放大（内容层反向抵消，dashboard 不跟着几何畸变）
  const maskS = interpolate(endT, [0, 1], [1, 26]);
  // 无遮罩全屏层淡入，保证接管彻底
  const cover = interpolate(endT, [0.25, 0.9], [0, 1], clamp);

  const dashMotion: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    transform: `translateX(${dx}px) scale(${dashS})`,
    transformOrigin: '50% 50%',
  };

  return (
    <div style={{ width: 1920, height: 1080, background: G.ink, position: 'relative', overflow: 'hidden' }}>
      {/* 遮罩层：wrapper 负责 mask + 放大；inner 用 1/S 反向缩放抵消内容形变 */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: `scale(${maskS})`,
          transformOrigin: ORIGIN,
          WebkitMaskImage: MASK_URL,
          maskImage: MASK_URL,
          WebkitMaskRepeat: 'no-repeat',
          maskRepeat: 'no-repeat',
          WebkitMaskSize: '1920px 1080px',
          maskSize: '1920px 1080px',
        }}
      >
        <div style={{ position: 'absolute', inset: 0, transform: `scale(${1 / maskS})`, transformOrigin: ORIGIN }}>
          <div style={dashMotion}>
            <MaskDashboard sidebarItems={sidebarItems} dashTitle={dashTitle} searchText={searchText} avatarText={avatarText} cards={cards} />
          </div>
        </div>
      </div>

      {/* 接管层：同一运动变换的全屏 dashboard，撤场时淡入到 1 */}
      <div style={{ position: 'absolute', inset: 0, opacity: cover }}>
        <div style={dashMotion}>
          <MaskDashboard sidebarItems={sidebarItems} dashTitle={dashTitle} searchText={searchText} avatarText={avatarText} cards={cards} />
        </div>
      </div>
    </div>
  );
};
