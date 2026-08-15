// === 可调参数 ===
// DURATION: 135（总帧数，可调；弹性段随 DURATION 等比缩放）
// 色彩: 走纸墨 G 色板（src/_fixtures/Fixtures.tsx）——文字 G.ink / 背景 G.bg / 强调 G.accent
// 功能: 展开,举证
// props: pageImage（背景整页）、foregroundImage（前景浮块）、subjectImage（前景高清卡）
// === 时间特性 ===
// 策略: 弹刚 ShotTime（整段弹性）
// 刚性（不可压缩）: 无
// 弹性（可伸缩）: 全程可等比缩放（时长适配语音）
// === 适配注意 ===
// 段长不足 60f 时回退原始帧（动画按原速、可能被截断）。
// multiplane parallax（轮 E）——真实页面拆 3 层深度横移：
// 背景整页（0.35x，微 blur 退后）+ 中景真实卡组（0.7x）+
// 前景浮块（1.4x，search 切片 + 高清卡，轻 blur 拉焦平面）。
// 系数克制（背景不动排版，卡组独立成层）防"排版散架"。
import { AbsoluteFill, Img, interpolate, staticFile, Easing } from 'remotion';
import layout from '../../_textures/live-layout.json';
import { G } from '../../_fixtures/Fixtures';

import { useShotFrame } from '../../../engine/useShotFrame';
import type { ShotTime } from '../../../engine/time';

// 时长画像：整段弹性（2026-08-14 精修）
const SHOT_TIME: ShotTime = {
  segments: [{ from: 0, to: 135, mode: 'elastic', minFrames: 60 }],
  minFrames: 60,
};

export const MULTIPLANE_DUR = 135;

const CARDS = layout.projects.cards.slice(0, 6);

export interface MultiplaneRealProps {
  pageImage?: string;
  foregroundImage?: string;
  subjectImage?: string;
}

export const MultiplaneReal: React.FC<MultiplaneRealProps> = ({
  pageImage = 'textures/live/projects-full.png',
  foregroundImage = 'textures/live/float-search.png',
  subjectImage = 'textures/live/card4-hires.png',
}) => {
  const frame = useShotFrame(SHOT_TIME);
  const drive = interpolate(frame, [10, 125], [0, 1000], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.bezier(0.35, 0, 0.25, 1),
  });
  return (
    <AbsoluteFill style={{ backgroundColor: G.panel, overflow: 'hidden' }}>
      {/* 背景层 0.35x：整页微退焦 */}
      <div style={{ position: 'absolute', inset: 0, transform: `translateX(${-drive * 0.35}px) scale(1.05)`, filter: 'blur(2px) saturate(0.92)', opacity: 0.85 }}>
        <Img src={staticFile(pageImage)} style={{ position: 'absolute', left: 0, top: -300, width: 2100 }} />
      </div>
      {/* 中景层 0.7x：真实卡组横排（主阅读层） */}
      <div style={{ position: 'absolute', top: 330, transform: `translateX(${-drive * 0.7}px)` }}>
        {CARDS.map((c, k) => (
          <Img
            key={c.file}
            src={staticFile(`textures/live/${c.file}`)}
            style={{
              position: 'absolute', left: 200 + k * 480, top: (k % 2) * 40,
              width: 420, borderRadius: 12,
              boxShadow: '0 8px 28px rgba(31,28,23,0.14)',
            }}
          />
        ))}
      </div>
      {/* 前景层 1.4x：浮块掠过（search 切片 + 高清卡），轻 blur */}
      <div style={{ position: 'absolute', inset: 0, transform: `translateX(${-drive * 1.4}px)`, filter: 'blur(3px)' }}>
        <Img src={staticFile(foregroundImage)} style={{ position: 'absolute', left: 900, top: 150, width: 700, borderRadius: 22, boxShadow: '0 12px 36px rgba(31,28,23,0.18)' }} />
        <Img src={staticFile(subjectImage)} style={{ position: 'absolute', left: 2100, top: 700, width: 380, borderRadius: 12, boxShadow: '0 12px 36px rgba(31,28,23,0.20)' }} />
      </div>
    </AbsoluteFill>
  );
};
