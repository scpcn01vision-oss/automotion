// === 可调参数 ===
// DURATION: 180（总帧数，可调；弹性段随 DURATION 等比缩放）
// 色彩: 走纸墨 G 色板（src/_fixtures/Fixtures.tsx）——文字 G.ink / 背景 G.bg / 强调 G.accent
// 功能: 宣告
// === 时间特性 ===
// 刚性（不可压缩）: 刚性:120f
// 弹性（可伸缩）: 其余段（入场/过渡/收尾/hold）可等比缩放
// === 适配注意 ===
// 调 DURATION 时只动弹性段 interpolate 关键帧，刚性核心帧区间保持固定帧数。
// 求关注弹跳（attention-bounce）——macOS Dock 语汇：icon 原地起跳讨拍
// 半屏 app 图标（圆角方块+铃形符号）在地面线上连跳 4 次且一次比一次高
// （首跳 0.5 倍 icon 高 → 末跳 1.2 倍）；每次落地帧压扁（宽 1.2x 高 0.8x）
// + 落点尘点 2–3 颗；最高那跳镜头整体向 icon 轻推 8%（"被吸引"）；
// 落定后 icon 右侧弹开一张功能面板卡收尾。
// 节拍：0–12 静置 → 12 起跳（4 跳递增，各 16/18/20/24f）→ ~90 落定 →
// 92–104 面板卡弹出 → 110 后真静止 40f。帧确定，尘点用 sin 散列。
import React from 'react';
import { useCurrentFrame, interpolate, Easing } from 'remotion';
import { G, Card } from '../../_fixtures/Fixtures';

const AMBER = '#b45309';
const ICON = 400; // icon 边长（半屏级）
const GROUND = 940; // 地面线 y（末跳 1.2x 顶点 + 8% 推近后仍贴画面上沿不出框）
const CX = 760; // icon 中心 x（右侧留面板位）

// 4 跳：起跳帧、时长、峰高（相对 icon 高）
const JUMPS = [
  { start: 12, dur: 16, peak: 0.5 * ICON },
  { start: 30, dur: 18, peak: 0.75 * ICON },
  { start: 50, dur: 20, peak: 0.95 * ICON },
  { start: 72, dur: 24, peak: 1.2 * ICON },
];

export const AttentionBounce: React.FC = () => {
  const f = useCurrentFrame();

  // 弹跳高度 + 落地挤压
  let y = 0; // 离地高度
  let squash = 0; // 0–1 落地压扁强度
  let stretch = 0; // 空中拉伸强度（速度感）
  JUMPS.forEach((j) => {
    const t = (f - j.start) / j.dur;
    if (t > 0 && t < 1) {
      y = j.peak * 4 * t * (1 - t); // 抛物线
      stretch = Math.abs(1 - 2 * t) * 0.14; // 起跳/下落速度快时拉长
    }
    // 落地帧后 5f 内压扁回弹
    const land = j.start + j.dur;
    if (f >= land && f < land + 6) {
      squash = Math.max(squash, 1 - (f - land) / 6);
    }
  });
  // 起跳前的预压（第一跳前 3f 蹲一下）
  if (f >= 9 && f < 12) squash = Math.max(squash, (f - 9) / 3 * 0.7);

  const sx = 1 + squash * 0.2 - stretch * 0.5;
  const sy = 1 - squash * 0.2 + stretch;

  // 镜头推近：第 4 跳（最高）期间整体 scale 1→1.08，落定后保持
  const zoomT = interpolate(f, [72, 88], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.quad),
  });
  const zoom = 1 + 0.08 * zoomT;

  // 尘点：每次落地帧生成 3 颗，向两侧飞散淡出（12f 生命）
  const dusts: Array<{ x: number; y: number; r: number; op: number }> = [];
  JUMPS.forEach((j, ji) => {
    const land = j.start + j.dur;
    const life = (f - land) / 12;
    if (life <= 0 || life >= 1) return;
    for (let k = 0; k < 3; k++) {
      const seed = ji * 3 + k;
      const dir = k === 1 ? 0 : k === 0 ? -1 : 1;
      const spread = (60 + 40 * Math.abs(Math.sin(seed * 5.7))) * (ji + 2) * 0.45;
      const e = Easing.out(Easing.cubic)(life);
      dusts.push({
        x: CX + dir * (ICON * 0.42 + spread * e) + (dir === 0 ? 30 * Math.sin(seed * 3.1) * e : 0),
        y: GROUND - 14 - 46 * e * (0.6 + 0.5 * Math.abs(Math.sin(seed * 2.3))),
        r: 12 + 6 * Math.abs(Math.sin(seed * 4.9)) - 8 * life,
        op: (1 - life) * 0.8,
      });
    }
  });

  // 功能面板卡：落定后（f=98）从 icon 右侧弹出
  const panelT = interpolate(f, [98, 110], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.back(1.8)),
  });

  const iconTop = GROUND - ICON - y;

  return (
    <div style={{ width: 1920, height: 1080, background: G.bg, position: 'relative', overflow: 'hidden' }}>
      {/* 镜头层：整体向 icon 轻推 */}
      <div
        style={{
          width: 1920,
          height: 1080,
          transform: `scale(${zoom})`,
          transformOrigin: `${CX}px ${GROUND - ICON / 2}px`,
          position: 'relative',
        }}
      >
        {/* 地面线 */}
        <div style={{ position: 'absolute', left: 120, top: GROUND, width: 1680, height: 8, background: G.bar, borderRadius: 4 }} />

        {/* 落地尘点 */}
        {dusts.map((d, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: d.x - d.r,
              top: d.y - d.r,
              width: d.r * 2,
              height: d.r * 2,
              borderRadius: d.r,
              background: G.mid,
              opacity: d.op,
            }}
          />
        ))}

        {/* 影子：随高度缩小变淡 */}
        <div
          style={{
            position: 'absolute',
            left: CX - ICON * 0.42 * (1 - y / (ICON * 2.4)),
            top: GROUND + 16,
            width: ICON * 0.84 * (1 - y / (ICON * 2.4)),
            height: 30,
            borderRadius: '50%',
            background: 'rgba(0,0,0,0.18)',
            filter: 'blur(6px)',
            opacity: 1 - (y / (ICON * 1.6)) * 0.5,
          }}
        />

        {/* app icon：圆角方块 + 铃形符号（自绘 SVG，半屏特写） */}
        <svg
          width={ICON}
          height={ICON}
          viewBox="0 0 420 420"
          style={{
            position: 'absolute',
            left: CX - ICON / 2,
            top: iconTop,
            transform: `scale(${sx}, ${sy})`,
            transformOrigin: '50% 100%',
          }}
        >
          <rect x={14} y={14} width={392} height={392} rx={88} fill={G.card} stroke={G.ink} strokeWidth={18} />
          {/* 符号：简洁铃形 */}
          <path
            d="M 210 110 C 160 110 140 155 138 200 C 136 245 118 272 100 290 L 320 290 C 302 272 284 245 282 200 C 280 155 260 110 210 110 Z"
            fill="none"
            stroke={G.ink}
            strokeWidth={22}
            strokeLinejoin="round"
          />
          <circle cx={210} cy={322} r={22} fill={AMBER} />
        </svg>

        {/* 功能面板卡：落定后弹出 */}
        {panelT > 0 && (
          <div
            style={{
              position: 'absolute',
              left: CX + ICON / 2 + 60,
              top: GROUND - ICON - 40,
              transform: `scale(${panelT})`,
              transformOrigin: 'left bottom',
              opacity: Math.min(1, panelT * 1.5),
            }}
          >
            <Card w={520} h={330} seed={4} />
            <div
              style={{
                position: 'absolute',
                top: -28,
                left: 24,
                padding: '10px 24px',
                borderRadius: 24,
                background: AMBER,
                color: '#fff',
                fontFamily: 'Helvetica, Arial, sans-serif',
                fontWeight: 800,
                fontSize: 26,
              }}
            >
              New
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
