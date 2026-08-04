// === 可调参数 ===
// DURATION: 120（总帧数，可调；弹性段随 DURATION 等比缩放）
// 色彩: 走纸墨 G 色板（src/_fixtures/Fixtures.tsx）——文字 G.ink / 背景 G.bg / 强调 G.accent
// 功能: 钩子,宣告
// === 时间特性 ===
// 刚性（不可压缩）: 刚性核心:疾推11f
// 弹性（可伸缩）: 其余段（入场/过渡/收尾/hold）可等比缩放
// === 适配注意 ===
// 调 DURATION 时只动弹性段 interpolate 关键帧，刚性核心帧区间保持固定帧数。
// crash-zoom 急推——真实 projects 页全景一拍推到 card4（高清纹理槽位）。
// 节拍：0–40 全景 hold → 40–46 急推 6f（ease-in，峰值放大 2.6x）→
// 46–51 过冲回弹（2.6→2.45）→ 51–120 特写 hold 真静止。
// blur 只包 40–46 急推段（轮 A 规律：极速段 samples 20）。
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, Easing } from 'remotion';
import { CameraMotionBlur } from '@remotion/motion-blur';
import layout from '../../_textures/live-layout.json';

export const CRASHZOOM_DUR = 120;

// card4 中心（页面空间）：x=781+357/2≈960, y=616+312/2=772
const TARGET = { cx: 960, cy: 772 };
const VIEW_Y = 180; // 全景观察窗顶（页面 y）

const Scene: React.FC = () => {
  const frame = useCurrentFrame();
  const zoom = interpolate(frame, [40, 46, 51], [1, 2.6, 2.45], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.bezier(0.55, 0, 0.7, 1),
  });
  const cx = interpolate(frame, [40, 46], [960, TARGET.cx], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.quad),
  });
  const cy = interpolate(frame, [40, 46], [VIEW_Y + 540, TARGET.cy], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.quad),
  });
  return (
    <AbsoluteFill style={{ backgroundColor: '#f9f6f1', overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute', width: 1920, height: layout.projects.pageH,
          transform: `translate(${960 - cx * zoom}px, ${540 - cy * zoom}px) scale(${zoom})`,
          transformOrigin: '0 0',
        }}
      >
        <Img src={staticFile('textures/live/projects-full.png')} style={{ position: 'absolute', width: 1920 }} />
        {/* 高清目标卡覆盖原位，放大后文字仍锐（Q2） */}
        <Img
          src={staticFile('textures/live/card4-hires.png')}
          style={{
            position: 'absolute',
            left: layout.projects.cards[3].x, top: layout.projects.cards[3].y,
            width: layout.projects.cards[3].w, height: layout.projects.cards[3].h,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

export const CrashZoomReal: React.FC = () => {
  const frame = useCurrentFrame();
  return frame >= 38 && frame <= 48 ? (
    <CameraMotionBlur shutterAngle={200} samples={20}>
      <Scene />
    </CameraMotionBlur>
  ) : (
    <Scene />
  );
};
