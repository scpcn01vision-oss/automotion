// === 可调参数 ===
// DURATION: 180（总帧数，可调；弹性段随 DURATION 等比缩放）
// 色彩: 走纸墨 G 色板（src/_fixtures/Fixtures.tsx）——文字 G.ink / 背景 G.bg / 强调 G.accent
// 功能: 钩子,宣告
// === 时间特性 ===
// 刚性（不可压缩）: 无（全程弹性）
// 弹性（可伸缩）: 全程可等比缩放（时长适配语音）
// === 适配注意 ===
// 调 DURATION 时只动弹性段 interpolate 关键帧，刚性核心帧区间保持固定帧数。
// 文字视频遮罩（text-as-mask）——kinetische typografie
// 深底上超粗大字 "SCALE"，字形内部用 CSS alpha mask 套住 FakeDashboard：
// 0–20f hold 读布景；20–100f dashboard 在字内匀速 translateX +110→-110（scale 1.15）；
// 100–130f 单段 bezier：mask 层 scale 1→26 放大溢出（内容层用 1/S 反向抵消不畸变），
// 同时无遮罩全屏层淡入接管，dashboard 1.15→1.0 归位；130–150f 全屏静止收尾。
import React from 'react';
import { useCurrentFrame, interpolate, Easing } from 'remotion';
import { G } from '../../_fixtures/Fixtures';
import { FONT_STACK } from '../../_system/typography';

// mask 放大原点：内容通用时取画面中心（字母 L 竖笔位置仅为演示字形优化）
const ORIGIN = '50% 50%';

// 镂空字背后的内容层：静止的干净中性内容画面（统一 G 色板，不堆文字不混色）
const MaskTexture: React.FC = () => {
  const rows = [
    { label: 'Scope', value: 'Locked' },
    { label: 'Budget', value: 'Approved' },
    { label: 'Ship', value: 'Ready' },
  ];
  return (
    <div
      style={{
        width: 1920, height: 1080, background: G.bg, overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: 920, background: G.card, border: `2px solid ${G.border}`, borderRadius: 18,
          padding: '42px 54px', boxSizing: 'border-box',
          boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
        }}
      >
        <div style={{ fontSize: 40, fontWeight: 700, color: G.ink, marginBottom: 26 }}>PROJECT SNAPSHOT</div>
        {rows.map((r, i) => (
          <div
            key={i}
            style={{
              display: 'flex', alignItems: 'center', padding: '15px 0',
              borderBottom: i < rows.length - 1 ? `1px solid ${G.line}` : 'none',
            }}
          >
            <span style={{ fontSize: 26, color: G.ink, fontWeight: 600 }}>{r.label}</span>
            <span style={{ marginLeft: 'auto', fontSize: 27, color: G.accent, fontWeight: 800 }}>{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export interface TextAsMaskProps {
  text?: string;
}

export const TextAsMask: React.FC<TextAsMaskProps> = ({ text = 'SCALE' }) => {
  const f = useCurrentFrame();
  const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
  // 字号自适应：超粗大字按字符数缩放，上限 360
  const FONT = Math.min(360, Math.floor(1800 / Math.max(text.length, 1)));
  const MASK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080"><text x="960" y="666" font-family="${FONT_STACK}" font-size="${FONT}" font-weight="900" letter-spacing="-8" text-anchor="middle" fill="white">${text}</text></svg>`;
  const MASK_URL = `url("data:image/svg+xml,${encodeURIComponent(MASK_SVG)}")`;

  // 结尾撤场进度：100–130f 单段 bezier
  const endT = interpolate(f, [100, 130], [0, 1], {
    ...clamp,
    easing: Easing.bezier(0.4, 0, 0.2, 1),
  });

  // mask 层放大（内容层反向抵消，dashboard 不跟着几何畸变）
  const maskS = interpolate(endT, [0, 1], [1, 26]);
  // 无遮罩全屏层淡入，保证接管彻底
  const cover = interpolate(endT, [0.25, 0.9], [0, 1], clamp);

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
          <MaskTexture />
        </div>
      </div>

      {/* 接管层：同一运动变换的全屏 dashboard，撤场时淡入到 1 */}
      <div style={{ position: 'absolute', inset: 0, opacity: cover }}>
        <MaskTexture />
      </div>
    </div>
  );
};
