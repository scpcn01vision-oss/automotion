// === 可调参数 ===
// DURATION: 135（总帧数，可调；弹性段随 DURATION 等比缩放）
// 色彩: 走纸墨 G 色板（src/_fixtures/Fixtures.tsx）——文字 G.ink / 背景 G.bg / 强调 G.accent
// 功能: 展开,对比
// === 时间特性 ===
// 刚性（不可压缩）: 刚性:dolly 135f,multiplane 135f
// 弹性（可伸缩）: 其余段（入场/过渡/收尾/hold）可等比缩放
// === 适配注意 ===
// 调 DURATION 时只动弹性段 interpolate 关键帧，刚性核心帧区间保持固定帧数。
// dolly-zoom 滑动变焦（轮 F）——主体卡（card4-hires）大小锁定屏中，
// 背景真实卡群 + 整页反向膨胀逼近（scale + blur 渐深），
// "世界压过来"而主角纹丝不动。伪 dolly-zoom：无需 3D，分层反向补偿。
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, Easing } from 'remotion';
import layout from '../../_textures/live-layout.json';

export const DOLLYZOOM_DUR = 135;

const BG_CARDS = layout.projects.cards.filter((_, i) => i !== 3);

export const DollyZoomReal: React.FC = () => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [15, 110], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.bezier(0.4, 0, 0.3, 1),
  });
  const bgScale = 1 + t * 1.25;
  const bgBlur = t * 3.5;
  return (
    <AbsoluteFill style={{ backgroundColor: '#efece6', overflow: 'hidden' }}>
      {/* 背景：整页 + 卡群，从画面中心膨胀逼近 */}
      <div
        style={{
          position: 'absolute', inset: 0,
          transform: `scale(${bgScale})`, transformOrigin: '960px 540px',
          filter: `blur(${bgBlur}px) saturate(0.9)`,
        }}
      >
        <Img src={staticFile('textures/live/projects-full.png')} style={{ position: 'absolute', left: 0, top: -400, width: 1920, opacity: 0.55 }} />
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
        src={staticFile('textures/live/card4-hires.png')}
        style={{
          position: 'absolute', left: 960 - 260, top: 540 - 228, width: 520,
          borderRadius: 14,
          boxShadow: `0 ${12 + t * 16}px ${40 + t * 28}px rgba(31,28,23,${0.16 + t * 0.10})`,
        }}
      />
    </AbsoluteFill>
  );
};
