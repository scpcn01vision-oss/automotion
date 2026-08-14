// === 可调参数 ===
// DURATION: 180（总帧数，可调；弹性段随 DURATION 等比缩放）
// 色彩: 走纸墨 G 色板（src/_fixtures/Fixtures.tsx）——文字 G.ink / 背景 G.bg / 强调 G.accent
// 功能: 展开,举证
// props: title（砸落标题）、cards（多米诺卡片内容数组，数量自适应）
// === 时间特性 ===
// 策略: 弹刚 ShotTime（整段弹性）
// 刚性（不可压缩）: 无
// 弹性（可伸缩）: 全程可等比缩放（时长适配语音）
// === 适配注意 ===
// 段长不足 60f 时回退原始帧（动画按原速、可能被截断）。
// 多米诺连锁入场（domino-cascade）——Rube Goldberg / OK Go MV。
// 三级动量链，每级 startFrame = 上一级 impact 帧：
// ① 帧 36–51 标题 "CHAIN REACTION" 从画外顶 ease-in(cubic) 砸落上半屏，
//    impact 帧 51 全画面竖向震一拍（4f 衰减）；
// ② 帧 51 起下方 4 张卡片被震得依次（隔 5f）向上弹 60px 抛物线落回（12f），
//    末卡落地帧 78 = 第二次撞击（再震一拍 + 末卡向左歪 3° 给出横向动量）；
// ③ 帧 78–100 左侧深色侧边栏被横向撞滑进场，Easing.out(cubic) 带过冲回弹；帧 100–150 全体真静止。
import React from 'react';
import { interpolate, Easing } from 'remotion';
import { G } from '../../_fixtures/Fixtures';
import { FONT_STACK } from '../../_system/typography';

import { useShotFrame } from '../../../engine/useShotFrame';
import type { ShotTime } from '../../../engine/time';

// 时长画像：整段弹性（2026-08-14 精修）
const SHOT_TIME: ShotTime = {
  segments: [{ from: 0, to: 180, mode: 'elastic', minFrames: 0 }],
  minFrames: 0,
};

const easeInCubic = Easing.in(Easing.cubic);
const easeOutCubic = Easing.out(Easing.cubic);

// —— 关键帧 ——
const TITLE_START = 36; // 砸落开始（前 36f hold 读布景）
const IMPACT_1 = 51; // 标题落地 = 第一次撞击
const CARD_STAGGER = 5;
const CARD_DUR = 12;

// 撞击震动：一拍，4f 内衰减归零
const shake = (f: number, at: number, amp: number) => {
  if (f < at || f > at + 4) return 0;
  const seq = [amp, -amp * 0.6, amp * 0.3, -amp * 0.12, 0];
  return seq[f - at];
};

// 卡片行几何：内容中心 1080（给左侧 240 侧边栏留出位置）
const CARD_W = 340;
const CARD_H = 220;
const GAP = 40;
const CARD_TOP = 730; // 卡片底边 950，落在地板线上

const DominoCard: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div
    style={{
      width: CARD_W,
      height: CARD_H,
      background: G.card,
      border: `2px solid ${G.border}`,
      borderRadius: 16,
      padding: 22,
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      gap: 10,
      boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
    }}
  >
    <div style={{ fontFamily: FONT_STACK, fontSize: 26, fontWeight: 800, color: G.ink, overflowWrap: 'break-word' }}>
      {label}
    </div>
    <div style={{ fontFamily: FONT_STACK, fontSize: 40, fontWeight: 800, color: G.accent }}>
      {value}
    </div>
  </div>
);

export interface DominoCascadeProps {
  title?: string;
  cards?: { label: string; value: string }[];
  menuItems?: { icon: string; label: string }[]; // 侧栏菜单
}

export const DominoCascade: React.FC<DominoCascadeProps> = ({
  title = 'START',
  cards = [
    { label: '指标一', value: '+18%' },
    { label: '指标二', value: '2.1×' },
    { label: '指标三', value: '96.4%' },
    { label: '节点', value: '4/4' },
  ],
  menuItems = [
    { icon: '◆', label: '仪表盘' },
    { icon: '●', label: '任务' },
    { icon: '▲', label: '文档' },
    { icon: '●', label: '成员' },
    { icon: '▲', label: '设置' },
    { icon: '◆', label: '通知' },
    { icon: '●', label: '帮助' },
    { icon: '▲', label: '归档' },
  ],
}) => {
  const frame = useShotFrame(SHOT_TIME);
  const n = cards.length;
  const IMPACT_2 = IMPACT_1 + (n - 1) * CARD_STAGGER + CARD_DUR; // 末卡落地
  const SIDE_END = IMPACT_2 + 14; // 侧边栏到位（过冲点）
  const SIDE_SETTLE = SIDE_END + 8; // 回弹结束，此后真静止
  const ROW_W = n * CARD_W + (n - 1) * GAP;
  const ROW_LEFT = 1080 - ROW_W / 2;

  // ① 标题砸落：画外顶 → 上半屏，ease-in 加速读作"砸"
  const titleTop = interpolate(frame, [TITLE_START, IMPACT_1], [-260, 320], {
    easing: easeInCubic,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // 两次撞击的全画面竖向震动
  const shakeY = shake(frame, IMPACT_1, 10) + shake(frame, IMPACT_2, 6);

  // ② 卡片弹跳：抛物线 4t(1-t)，依次隔 5f
  const cardDy = (i: number) => {
    const s = IMPACT_1 + i * CARD_STAGGER;
    const t = Math.min(1, Math.max(0, (frame - s) / CARD_DUR));
    return -60 * 4 * t * (1 - t);
  };
  // 末卡落地时向左歪 3°（横向动量的可见出处），随后回正
  const lastCardRot = interpolate(
    frame,
    [IMPACT_2 - 9, IMPACT_2, SIDE_END],
    [0, -3, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  // ③ 侧边栏横向撞滑：带初速滑入 + 过冲回弹
  let sideX: number;
  if (frame < IMPACT_2) {
    sideX = -260;
  } else if (frame < SIDE_END) {
    const t = (frame - IMPACT_2) / (SIDE_END - IMPACT_2);
    sideX = -260 + 272 * easeOutCubic(t); // 冲到 +12（约 5% 过冲）
  } else if (frame < SIDE_SETTLE) {
    const t = (frame - SIDE_END) / (SIDE_SETTLE - SIDE_END);
    sideX = 12 * (1 - Easing.inOut(Easing.quad)(t));
  } else {
    sideX = 0;
  }

  return (
    <div style={{ width: 1920, height: 1080, background: G.bg, overflow: 'hidden', position: 'relative' }}>
      {/* 全画面震动容器 */}
      <div style={{ position: 'absolute', inset: 0, transform: `translateY(${shakeY}px)` }}>
        {/* 地板线：卡片落点 */}
        <div style={{ position: 'absolute', left: ROW_LEFT - 30, top: 958, width: ROW_W + 60, height: 6, background: G.bar, borderRadius: 3 }} />

        {/* ① 砸落的标题 */}
        <div style={{ position: 'absolute', left: 240, width: 1680, top: titleTop, display: 'flex', justifyContent: 'center' }}>
          <div style={{ fontFamily: FONT_STACK, fontWeight: 800, fontSize: 120, color: G.ink, letterSpacing: -1 }}>
            {title}
          </div>
        </div>

        {/* ② 被震弹起的卡片（数量自适应） */}
        {cards.map((c, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: ROW_LEFT + i * (CARD_W + GAP),
              top: CARD_TOP,
              transform: `translateY(${cardDy(i)}px)${i === 3 ? ` rotate(${lastCardRot}deg)` : ''}`,
              transformOrigin: '50% 100%',
            }}
          >
            <DominoCard label={c.label} value={c.value} />
          </div>
        ))}

        {/* ③ 被撞滑进场的侧边栏 */}
        <div
          style={{
            position: 'absolute', left: 0, top: 0, width: 240, height: 1080,
            background: G.side, transform: `translateX(${sideX}px)`,
            padding: '32px 24px', boxSizing: 'border-box',
            display: 'flex', flexDirection: 'column', gap: 22,
          }}
        >
          <div style={{ width: 44, height: 44, borderRadius: 10, background: G.sideBar, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: G.side }}>◆</div>
          {menuItems.map((it, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 26, height: 26, borderRadius: 6, background: G.sideBar, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: G.side }}>{it.icon}</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: G.panel }}>{it.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
