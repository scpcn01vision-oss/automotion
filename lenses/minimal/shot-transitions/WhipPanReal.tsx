// === 可调参数 ===
// DURATION: 120（总帧数，可调；弹性段随 DURATION 等比缩放）
// 色彩: 走纸墨 G 色板（src/_fixtures/Fixtures.tsx）——文字 G.ink / 背景 G.bg / 强调 G.accent
// 功能: 转折,承接
// === 时间特性 ===
// 刚性（不可压缩）: 刚性:maskwipe 120f,whippan 120f
// 弹性（可伸缩）: 其余段（入场/过渡/收尾/hold）可等比缩放
// === 适配注意 ===
// 调 DURATION 时只动弹性段 interpolate 关键帧，刚性核心帧区间保持固定帧数。
// E 式基本款 whip-pan——真实整页冻结纹理（demos/_textures/）。
// 世界：projects-full 顶部 section（A 景）与同页底部 section（B 景）横向并排
// ——模拟"功能段之间的区块交棒"，相机 8f 甩 2880px（峰值 ~540px/f），
// blur 只包甩动段。节拍：0–35 A hold → 35–43 甩（糊）→ 43–120 B hold（真静止）。
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, Easing } from 'remotion';
import { CameraMotionBlur } from '@remotion/motion-blur';

export const WHIPPAN_DUR = 120;

const SWING = 2880; // 1.5 屏
// 观察窗都对准 cards 网格区（页面空间 y≈247 起），viewport 顶对 y=180
const VIEW_Y = -180;

const Scene: React.FC = () => {
  const frame = useCurrentFrame();
  const dx = interpolate(frame, [35, 43], [0, SWING], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.6, 0, 0.4, 1),
  });
  return (
    <AbsoluteFill style={{ backgroundColor: '#f9f6f1', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', transform: `translateX(${-dx}px)` }}>
        {/* A 景：项目板全满 */}
        <Img
          src={staticFile('textures/live/projects-full.png')}
          style={{ position: 'absolute', left: 0, top: VIEW_Y, width: 1920 }}
        />
        {/* 缝隙纸色空场 960px——甩动中段一晃而过，全糊 */}
        {/* B 景：同页底部 section（PERCEPTION & SENSING 区），换景可辨且内容饱满 */}
        <Img
          src={staticFile('textures/live/projects-full.png')}
          style={{ position: 'absolute', left: SWING, top: -666, width: 1920 }}
        />
      </div>
    </AbsoluteFill>
  );
};

export const WhipPanReal: React.FC = () => (
  // 峰值 ~540px/f：采样按"回波间距 ≤ 字高"配，20 samples 拖影连续
  <CameraMotionBlur shutterAngle={200} samples={20}>
    <Scene />
  </CameraMotionBlur>
);
