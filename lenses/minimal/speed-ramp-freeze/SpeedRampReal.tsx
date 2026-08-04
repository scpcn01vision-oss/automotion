// === 可调参数 ===
// DURATION: 135（总帧数，可调；弹性段随 DURATION 等比缩放）
// 色彩: 走纸墨 G 色板（src/_fixtures/Fixtures.tsx）——文字 G.ink / 背景 G.bg / 强调 G.accent
// 功能: 举证,宣告
// === 时间特性 ===
// 刚性（不可压缩）: 刚性核心:变速段~30f
// 弹性（可伸缩）: 其余段（入场/过渡/收尾/hold）可等比缩放
// === 适配注意 ===
// 调 DURATION 时只动弹性段 interpolate 关键帧，刚性核心帧区间保持固定帧数。
// speed-ramp 变速（轮 C）——真实卡片流帧号 remap：快(斜率2.2) →
// 0.2x 慢速展示窗 → 快。慢速窗中目标卡（card4-hires）清晰滑过屏中。
// blur 联动速率：快段包 blur、慢段不包，反差即"凝视感"。
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { CameraMotionBlur } from '@remotion/motion-blur';
import layout from '../../_textures/live-layout.json';

export const SPEEDRAMP_DUR = 135;

const CARD_W = 460;
const GAP = 60;
const RAIL = layout.projects.cards.slice(0, 9);
const TARGET_I = 5;

const Scene: React.FC = () => {
  const frame = useCurrentFrame();
  // remap：0–40f 走 88 源帧（快），40–85f 走 9 源帧（0.2x），85–135f 走 110（快）
  const src = interpolate(frame, [0, 40, 85, 135], [0, 88, 97, 207], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const dx = src * 28;
  return (
    <AbsoluteFill style={{ backgroundColor: '#f9f6f1', overflow: 'hidden' }}>
      {/* 偏移 717：让慢速窗中点（src≈92.4，dx≈2587）时目标卡 k=5 中心落屏中 */}
      <div style={{ position: 'absolute', top: 360, transform: `translateX(${-dx + 717}px)` }}>
        {Array.from({ length: 16 }).map((_, k) => {
          const c = RAIL[k % RAIL.length];
          const isTarget = k === TARGET_I;
          return (
            <Img
              key={k}
              src={staticFile(`textures/live/${isTarget ? 'card4-hires.png' : c.file}`)}
              style={{
                position: 'absolute', left: k * (CARD_W + GAP), top: isTarget ? -16 : 0,
                width: CARD_W, borderRadius: 12,
                boxShadow: isTarget
                  ? '0 10px 32px rgba(31,28,23,0.18)'
                  : '0 4px 16px rgba(31,28,23,0.10)',
              }}
            />
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

export const SpeedRampReal: React.FC = () => {
  const frame = useCurrentFrame();
  const fast = frame < 42 || frame > 83;
  return fast ? (
    <CameraMotionBlur shutterAngle={200} samples={20}>
      <Scene />
    </CameraMotionBlur>
  ) : (
    <Scene />
  );
};
