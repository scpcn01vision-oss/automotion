// === 可调参数 ===
// DURATION: 120（总帧数，可调；弹性段随 DURATION 等比缩放）
// 色彩: 走纸墨 G 色板（src/_fixtures/Fixtures.tsx）——文字 G.ink / 背景 G.bg / 强调 G.accent
// 功能: 承接,转折
// props: pageImage（整页素材，A/B 景取同页上下 section）
// === 时间特性 ===
// 刚性（不可压缩）: 无（全程弹性）
// 弹性（可伸缩）: 全程可等比缩放（时长适配语音）
// === 适配注意 ===
// 调 DURATION 时只动弹性段 interpolate 关键帧，刚性核心帧区间保持固定帧数。
// E 式基本款 whip-pan——真实整页冻结纹理（demos/_textures/）。
// 世界：projects-full 顶部 section（A 景）与同页底部 section（B 景）横向并排
// ——模拟"功能段之间的区块交棒"，相机 8f 甩 2880px（峰值 ~540px/f），
// blur 只包甩动段。节拍：0–35 A hold → 35–43 甩（糊）→ 43–120 B hold（真静止）。
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, Easing } from 'remotion';
import { CameraMotionBlur } from '@remotion/motion-blur';
import { G } from '../../_fixtures/Fixtures';

export const WHIPPAN_DUR = 120;

const SWING = 2880; // 1.5 屏
// 观察窗都对准 cards 网格区（页面空间 y≈247 起），viewport 顶对 y=180
const VIEW_Y = -180;

const Scene: React.FC<{ pageImage: string }> = ({ pageImage }) => {
  const frame = useCurrentFrame();
  const dx = interpolate(frame, [35, 43], [0, SWING], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.6, 0, 0.4, 1),
  });
  return (
    <AbsoluteFill style={{ backgroundColor: G.panel, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', transform: `translateX(${-dx}px)` }}>
        {/* A 景：项目板全满 */}
        <Img
          src={staticFile(pageImage)}
          style={{ position: 'absolute', left: 0, top: VIEW_Y, width: 1920 }}
        />
        {/* 缝隙纸色空场 960px——甩动中段一晃而过，全糊 */}
        {/* B 景：同页底部 section（PERCEPTION & SENSING 区），换景可辨且内容饱满 */}
        <Img
          src={staticFile(pageImage)}
          style={{ position: 'absolute', left: SWING, top: -666, width: 1920 }}
        />
      </div>
    </AbsoluteFill>
  );
};

export interface WhipPanRealProps {
  pageImage?: string;
}

export const WhipPanReal: React.FC<WhipPanRealProps> = ({
  pageImage = 'textures/live/projects-full.png',
}) => (
  // 峰值 ~540px/f：采样按"回波间距 ≤ 字高"配，20 samples 拖影连续
  <CameraMotionBlur shutterAngle={200} samples={20}>
    <Scene pageImage={pageImage} />
  </CameraMotionBlur>
);
