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

// mask 放大原点：内容通用时取画面中心（字母 L 竖笔位置仅为演示字形优化）
const ORIGIN = '50% 50%';

// 遮罩内中性纹理：主题词重复网格 + 中央大字（内容即词本身，替代演示占位）
const MaskTexture: React.FC<{ word: string; driftX: number; scale: number }> = ({ word, driftX, scale }) => {
  const CELL_W = 480;
  const CELL_H = 270;
  const cols = 4;
  const rows = 4;
  return (
    <div style={{ width: 1920, height: 1080, background: G.bg, overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute',
          inset: -200,
          transform: `translateX(${driftX}px) scale(${scale})`,
          transformOrigin: '50% 50%',
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, ${CELL_W}px)`,
          gridTemplateRows: `repeat(${rows}, ${CELL_H}px)`,
        }}
      >
        {Array.from({ length: cols * rows }).map((_, i) => (
          <div
            key={i}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Helvetica, Arial, sans-serif', fontWeight: 800, fontSize: 96,
              letterSpacing: 4, color: i % 2 === 0 ? G.mid : G.bar,
            }}
          >
            {word}
          </div>
        ))}
      </div>
      <div
        style={{
          position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
          fontFamily: 'Helvetica, Arial, sans-serif', fontWeight: 900, fontSize: 220,
          letterSpacing: -6, color: G.ink, textShadow: '0 6px 24px rgba(211,146,60,0.35)',
        }}
      >
        {word}
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
  const MASK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080"><text x="960" y="666" font-family="Helvetica, Arial, sans-serif" font-size="${FONT}" font-weight="900" letter-spacing="-8" text-anchor="middle" fill="white">${text}</text></svg>`;
  const MASK_URL = `url("data:image/svg+xml,${encodeURIComponent(MASK_SVG)}")`;

  // 结尾撤场进度：100–130f 单段 bezier
  const endT = interpolate(f, [100, 130], [0, 1], {
    ...clamp,
    easing: Easing.bezier(0.4, 0, 0.2, 1),
  });

  // dashboard 内容运动：20–100f 匀速漂移，100–130f 归位到全屏
  const driftX = interpolate(f, [20, 100], [110, -110], clamp);
  const dx = f < 100 ? driftX : interpolate(endT, [0, 1], [-110, 0]);
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
            <MaskTexture word={text} driftX={dx} scale={dashS} />
          </div>
        </div>
      </div>

      {/* 接管层：同一运动变换的全屏 dashboard，撤场时淡入到 1 */}
      <div style={{ position: 'absolute', inset: 0, opacity: cover }}>
        <div style={dashMotion}>
          <MaskTexture word={text} driftX={dx} scale={dashS} />
        </div>
      </div>
    </div>
  );
};
