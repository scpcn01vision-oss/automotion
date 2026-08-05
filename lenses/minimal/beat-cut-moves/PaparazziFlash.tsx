// === 可调参数 ===
// DURATION: 180（总帧数，可调；弹性段随 DURATION 等比缩放）
// 色彩: 走纸墨 G 色板（src/_fixtures/Fixtures.tsx）——文字 G.ink / 背景 G.bg / 强调 G.accent
// 功能: 钩子,宣告
// props: footage（连闪素材内容承载）、value（数字特写大号）
// === 时间特性 ===
// 刚性（不可压缩）: 刚性:间隔16→4f加速
// 弹性（可伸缩）: 其余段（入场/过渡/收尾/hold）可等比缩放
// === 适配注意 ===
// 调 DURATION 时只动弹性段 interpolate 关键帧，刚性核心帧区间保持固定帧数。
import React from 'react';
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';
import { G } from '../../_fixtures/Fixtures';
import { SceneContent, SceneContentData } from '../../_system/scene-content';

// paparazzi flash 连闪定格：高光时刻三连白闪，每闪硬切同一素材的不同裁切
// （全景→卡片特写→数字特写），每闪切入画面带 1.03→1 回落 + 半格沉降像快门
// 余韵，白闪帧加微位移抖动模拟快门震，第三闪后停在数字特写收束。
const F1 = 30; // 第一闪（间隔 22f）
const F2 = 52; // 第二闪（间隔 18f）
const F3 = 70; // 第三闪，之后 hold 60f
const SETTLE = 6; // 切入回落时长
const DECAY = 4; // 白层衰减时长
const FLASHES = [F1, F2, F3];

// seed 正弦哈希，返回 -1..1（禁 Math.random）
const hash = (i: number) => {
  const s = Math.sin(i * 127.3) * 43758.5453;
  return (s - Math.floor(s)) * 2 - 1;
};

// 同一"素材"：全景内容，顶行中间卡片上叠一个大数字，供数字特写裁切
const Footage: React.FC<{ footage: SceneContentData; value: string }> = ({ footage, value }) => (
  <div style={{ position: 'absolute', width: 1920, height: 1080 }}>
    <SceneContent content={footage} />
    <div style={{ position: 'absolute', left: 1070, top: 350, transform: 'translate(-50%, -50%)' }}>
      <div
        style={{
          fontFamily: 'Helvetica, Arial, sans-serif',
          fontWeight: 800,
          fontSize: 104,
          color: G.accent,
          letterSpacing: -1,
        }}
      >
        {value}
      </div>
    </div>
  </div>
);

// 四个视图：闪前"活素材"慢推 + 三个定格裁切（全景 / 卡片 / 数字）
type View = { scale: number; origin: string };
const VIEW_WIDE: View = { scale: 1.0, origin: '960px 540px' };
const VIEW_CARD: View = { scale: 2.3, origin: '1070px 335px' };
const VIEW_DIGIT: View = { scale: 4.0, origin: '1070px 350px' };

export interface PaparazziFlashProps {
  footage?: SceneContentData;
  value?: string;
}

export const PaparazziFlash: React.FC<PaparazziFlashProps> = ({
  footage = {
    title: '概览',
    type: 'rows',
    rows: [
      { label: '指标一', value: '+18%' },
      { label: '指标二', value: '2.1×' },
      { label: '指标三', value: '96.4%' },
    ],
  },
  value = '84,213',
}) => {
  const frame = useCurrentFrame();

  // 当前处于哪一段：-1 = 闪前活素材段
  let seg = -1;
  for (let i = 0; i < FLASHES.length; i++) {
    if (frame >= FLASHES[i]) seg = i;
  }

  let scale: number;
  let origin: string;
  let settleScale = 1;
  let settleY = 0;

  if (seg === -1) {
    // 闪前：中景慢推（活的），衬托闪后定格的"死"
    origin = '900px 480px';
    scale = interpolate(frame, [0, F1], [1.16, 1.2], {
      extrapolateRight: 'clamp',
      easing: Easing.inOut(Easing.quad),
    });
  } else {
    const view = [VIEW_WIDE, VIEW_CARD, VIEW_DIGIT][seg];
    scale = view.scale;
    origin = view.origin;
    // 切入回落：1.03→1 的 6f 收敛 + 半格沉降（-16px 落回 0）像快门余韵
    const t = interpolate(frame, [FLASHES[seg], FLASHES[seg] + SETTLE], [1, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.cubic),
    });
    settleScale = 1 + 0.03 * t;
    settleY = -16 * t;
  }

  // 白闪层：每个切点 0.95→0，4f 衰减，取各闪最大值
  let flash = 0;
  for (const f of FLASHES) {
    const o = interpolate(frame, [f, f + DECAY], [0.95, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.quad),
    });
    if (frame >= f && frame < f + DECAY + 1) flash = Math.max(flash, o);
  }

  // 白闪帧全屏微位移抖动模拟快门震（seed 哈希，非随机）
  const inFlash = FLASHES.some((f) => frame >= f && frame < f + DECAY);
  const jx = inFlash ? 2 * hash(frame * 7 + 1) : 0;
  const jy = inFlash ? 2 * hash(frame * 13 + 5) : 0;

  return (
    <AbsoluteFill style={{ background: G.ink, overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: `translate(${jx}px, ${jy + settleY}px)`,
        }}
      >
        <div
          style={{
            position: 'absolute',
            width: 1920,
            height: 1080,
            transform: `scale(${scale * settleScale})`,
            transformOrigin: origin,
          }}
        >
          <Footage footage={footage} value={value} />
        </div>
      </div>
      {/* 白闪层 */}
      {flash > 0 && (
        <AbsoluteFill style={{ background: '#ffffff', opacity: flash }} />
      )}
    </AbsoluteFill>
  );
};
