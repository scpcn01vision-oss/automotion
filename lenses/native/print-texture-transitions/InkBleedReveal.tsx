// === 可调参数 ===
// DURATION: 180（总帧数，可调；弹性段随 DURATION 等比缩放）
// 色彩: 走纸墨 G 色板（src/_fixtures/Fixtures.tsx）——文字 G.ink / 背景 G.bg / 强调 G.accent
// 功能: 转折,承接
// === 时间特性 ===
// 刚性（不可压缩）: 刚性:墨渗边78f
// 弹性（可伸缩）: 其余段（入场/过渡/收尾/hold）可等比缩放
// === 适配注意 ===
// 调 DURATION 时只动弹性段 interpolate 关键帧，刚性核心帧区间保持固定帧数。
// 墨渗揭示（ink-bleed-reveal）——水墨转场（轨道遮罩法）。
// 旧景：G.bg 纸底 + 居中 TitleBlock "BEFORE"；新景 FakeDashboard(A) 放进
// SVG <foreignObject>，套 <mask>：中心偏左上 (800,420) 的白圆当轨道遮罩。
// 圆本身套 feTurbulence(baseFrequency 0.02, octaves 3, seed 7 固定) +
// feDisplacementMap（scale 60→160 随帧涨）造须状渗边——filter 只作用在
// mask 形状上，新景内容始终清晰。帧 0–20 hold 旧景；帧 20–98 半径
// 0→1450（Easing.out(quad)）再叠 ±8% 低频正弦扰动（帧 78–98 扰动衰减到 0，
// 洇满全屏）；帧 100–130 摘掉 mask 直接铺新景，真静止 30f。
import React from 'react';
import { interpolate, Easing, Img, staticFile, useCurrentFrame } from 'remotion';
import { G } from '../../_fixtures/Fixtures';
import { FONT_STACK } from '../../_system/typography';
import { useShotFrame } from '../../../engine/useShotFrame';
import type { ShotTime } from '../../../engine/time';

// 时长画像（迁移自 013 lens-timings.json；墨渗刚性 20-98）
const SHOT_TIME: ShotTime = {
  segments: [
    { from: 0, to: 20, mode: 'elastic', minFrames: 6 },
    { from: 20, to: 98, mode: 'rigid' },
    { from: 98, to: 130, mode: 'elastic', minFrames: 10 },
  ],
  minFrames: 94,
};

export interface InkBleedRevealNewScene {
  title?: string;
  type?: 'rows' | 'image';
  rows?: { label: string; value: string }[];
  image?: string;
}

export interface InkBleedRevealProps {
  oldTitle?: string;
  newScene?: InkBleedRevealNewScene;
  revealAtSec?: number; // 口播对齐：墨渗揭幕完成（全屏铺满）的段内秒；提供后旧景展示到该时刻前
}

// 新景内容渲染器：标题 + 行列表（默认）/ 标题 + 圆角图片
const NewScene: React.FC<{ scene: InkBleedRevealNewScene }> = ({ scene }) => {
  const { title, type = 'rows', rows, image } = scene;
  return (
    <div
      style={{
        width: 1920, height: 1080, background: G.bg, position: 'relative', overflow: 'hidden',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 48,
      }}
    >
      {title ? (
        <div style={{ fontFamily: FONT_STACK, fontWeight: 800, fontSize: 88, color: G.ink, letterSpacing: -1 }}>
          {title}
        </div>
      ) : null}
      {type === 'image' && image ? (
        <Img
          src={staticFile(image)}
          style={{
            width: 1200, height: 675, objectFit: 'cover', borderRadius: 24,
            border: `2px solid ${G.border}`, boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          }}
        />
      ) : (
        <div
          style={{
            width: 1200, background: G.card, border: `2px solid ${G.border}`, borderRadius: 24,
            padding: '40px 56px', display: 'flex', flexDirection: 'column',
          }}
        >
          {(rows ?? []).map((r, i) => (
            <div
              key={i}
              style={{
                display: 'flex', alignItems: 'center', padding: '22px 0',
                borderBottom: i < (rows ?? []).length - 1 ? `1px solid ${G.line}` : 'none',
              }}
            >
              <span style={{ fontSize: 34, color: G.ink, fontWeight: 600 }}>{r.label}</span>
              <span style={{ marginLeft: 'auto', fontSize: 36, color: G.accent, fontWeight: 800 }}>{r.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const InkBleedReveal: React.FC<InkBleedRevealProps> = ({
  oldTitle = 'BEFORE',
  newScene = {
    title: '状态说明',
    type: 'rows',
    rows: [
      { label: 'Metric', value: '+25%' },
      { label: 'Growth', value: '2.4×' },
      { label: 'Uptime', value: '99.9%' },
    ],
  },
  revealAtSec,
}) => {
  const frameShot = useShotFrame(SHOT_TIME);
  const realFrame = useCurrentFrame();
  const cueMode = revealAtSec !== undefined;
  const frame = cueMode ? realFrame : frameShot;
  const OFFSET = cueMode ? Math.round(revealAtSec * 30) - 98 : 0;

  // 墨滴落点：画面中心偏左上
  const cx = 800;
  const cy = 420;

  // 基础半径：帧 20–98，0 → 1450px（最远角 ~1300px + 渗边位移余量 150px）
  const baseR = interpolate(frame, [20 + OFFSET, 98 + OFFSET], [0, 1450], {
    easing: Easing.out(Easing.quad),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // ±8% 低频正弦扰动 = 快慢不匀的洇开；帧 78–98 幅度衰减到 0，保证吃满后能真静止
  const wobbleEnv = interpolate(frame, [78 + OFFSET, 98 + OFFSET], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const r = Math.max(0, baseR * (1 + 0.08 * Math.sin(frame * 0.32) * wobbleEnv));

  // 渗边发散度：displacement scale 60 → 160（边缘越洇越散、指尖分叉越长）
  const dispScale = interpolate(frame, [20 + OFFSET, 98 + OFFSET], [60, 160], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // 帧 100 起 mask 已全白：摘掉 SVG 直接铺新景，确保结尾像素级真静止
  const settled = frame >= 100 + OFFSET;

  return (
    <div style={{ width: 1920, height: 1080, background: G.bg, position: 'relative', overflow: 'hidden' }}>
      {/* 旧景：纸底 + BEFORE 标题 */}
      <div style={{ position: 'absolute', inset: 0, background: G.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: FONT_STACK, fontWeight: 800, fontSize: 120, color: G.ink, letterSpacing: -1 }}>
          {oldTitle}
        </div>
      </div>

      {settled ? (
        <div style={{ position: 'absolute', inset: 0 }}>
          <NewScene scene={newScene} />
        </div>
      ) : (
        <svg
          width={1920}
          height={1080}
          viewBox="0 0 1920 1080"
          style={{ position: 'absolute', inset: 0, display: 'block' }}
        >
          <defs>
            {/* filter 只挂在 mask 的圆上——揉的是遮罩边，不是画面内容 */}
            <filter id="inkBleed" x="-40%" y="-40%" width="180%" height="180%">
              <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="3" seed="7" result="noise" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale={dispScale} xChannelSelector="R" yChannelSelector="G" />
            </filter>
            <mask id="inkMask" maskUnits="userSpaceOnUse" x="0" y="0" width="1920" height="1080">
              <rect x="0" y="0" width="1920" height="1080" fill="black" />
              {r > 0.5 && <circle cx={cx} cy={cy} r={r} fill="white" filter="url(#inkBleed)" />}
            </mask>
          </defs>
          <g mask="url(#inkMask)">
            <foreignObject x="0" y="0" width="1920" height="1080">
              <NewScene scene={newScene} />
            </foreignObject>
          </g>
        </svg>
      )}
    </div>
  );
};
