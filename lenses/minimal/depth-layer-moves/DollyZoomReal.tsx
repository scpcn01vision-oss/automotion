// === 可调参数 ===
// DURATION: 135（总帧数，可调；弹性段随 DURATION 等比缩放）
// 色彩: 走纸墨 G 色板（src/_fixtures/Fixtures.tsx）——文字 G.ink / 背景 G.bg / 强调 G.accent
// 功能: 举证
// === 时间特性 ===
// 策略: 弹刚 ShotTime（整段弹性）
// 刚性（不可压缩）: 无
// 弹性（可伸缩）: 全程可等比缩放（时长适配语音）
// === 适配注意 ===
// 段长不足 60f 时回退原始帧（动画按原速、可能被截断）。
// dolly-zoom 滑动变焦（轮 F）——主体卡（card4-hires）大小锁定屏中，
// 背景真实卡群 + 整页反向膨胀逼近（scale + blur 渐深），
// "世界压过来"而主角纹丝不动。伪 dolly-zoom：无需 3D，分层反向补偿。
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

export const DOLLYZOOM_DUR = 135;

const BG_CARDS = layout.projects.cards.filter((_, i) => i !== 3);

export interface DollyZoomRealProps {
  pageImage?: string;
  subjectImage?: string;
}

export const DollyZoomReal: React.FC<DollyZoomRealProps> = ({
  pageImage = 'textures/live/projects-full.png',
  subjectImage = 'textures/live/card4-hires.png',
}) => {
  const frame = useShotFrame(SHOT_TIME);
  const t = interpolate(frame, [15, 110], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.bezier(0.4, 0, 0.3, 1),
  });
  const bgScale = 1 + t * 1.25;
  const bgBlur = t * 3.5;
  return (
    <AbsoluteFill style={{ backgroundColor: G.panel, overflow: 'hidden' }}>
      {/* 背景：整页 + 卡群，从画面中心膨胀逼近 */}
      <div
        style={{
          position: 'absolute', inset: 0,
          transform: `scale(${bgScale})`, transformOrigin: '960px 540px',
          filter: `blur(${bgBlur}px) saturate(0.9)`,
        }}
      >
        <Img src={staticFile(pageImage)} style={{ position: 'absolute', left: 0, top: -400, width: 1920, opacity: 0.55 }} />
        {BG_CARDS.slice(0, 8).map((c, k) => (
          <Img
            key={c.file + k}
            src={staticFile(`textures/live/${c.file}`)}
            style={{
              position: 'absolute',
              left: [180, 1280, 240, 1220, 700, 760, 60, 1500][k],
              top: [140, 120, 700, 720, 60, 840, 420, 430][k],
              width: 320, borderRadius: 12, opacity: 0.9,
              boxShadow: '0 6px 20px rgba(31,28,23,0.12)',
            }}
          />
        ))}
      </div>
      {/* 主体：高清卡视觉大小恒定钉在屏中，落影渐深强调"世界在动我不动" */}
      <Img
        src={staticFile(subjectImage)}
        style={{
          position: 'absolute', left: 960 - 260, top: 540 - 228, width: 520,
          borderRadius: 14,
          boxShadow: `0 ${12 + t * 16}px ${40 + t * 28}px rgba(31,28,23,${0.16 + t * 0.10})`,
        }}
      />
    </AbsoluteFill>
  );
};
