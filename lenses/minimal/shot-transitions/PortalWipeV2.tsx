// === 可调参数 ===
// DURATION: 180（总帧数，可调；弹性段随 DURATION 等比缩放）
// 色彩: 走纸墨 G 色板（src/_fixtures/Fixtures.tsx）——文字 G.ink / 背景 G.bg / 强调 G.accent
// 功能: 转折,承接
// props: sceneA / sceneB（穿窗前旧景/窗内新景内容承载）、cards（近景卡内容）
// === 时间特性 ===
// 刚性（不可压缩）: 刚性:maskwipe 120f,whippan 120f
// 弹性（可伸缩）: 其余段（入场/过渡/收尾/hold）可等比缩放
// === 适配注意 ===
// 调 DURATION 时只动弹性段 interpolate 关键帧，刚性核心帧区间保持固定帧数。
import React from 'react';
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';
import { G } from '../../_fixtures/Fixtures';
import { SceneContent, SceneContentData } from '../../_system/scene-content';
import { FONT_STACK } from '../../_system/typography';

// portal-wipe 穿窗入景·改〔批次 1 重做〕
// 批次 1 弱点：3 层 7 卡散开幅度大(0.85)+blur，穿窗后画面碎读不清。
// 本版：窗放大 bezier(0.7,0,0.3,1) 40f 先慢后快；窗内只 2 层
// （远景整页 dashboard 缩略 + 近景 2 张卡），散开系数近 0.3 / 远 0.08，
// 不加 blur；穿窗完成(f65)后所有层 8f 内缓停(f73)，之后静止 hold 77f 读清新场景。
//
// 节拍（150f @30fps）：
//   0–25   hold：旧 dashboard 建立，目标卡原位可见
//   25–65  窗放大 40f：卡放大成全屏窗，窗内新场景随之显形
//   65–73  缓停 8f：近/远两层视差余势收干（Easing.out 自然归零）
//   73–150 静止 hold：新场景完整可读
export interface PortalWipeV2Props {
  sceneA?: SceneContentData;
  sceneB?: SceneContentData;
  cards?: { label: string; value: string }[];
}

const MiniCard: React.FC<{ w: number; h: number; label: string; value: string }> = ({ w, h, label, value }) => (
  <div
    style={{
      width: w,
      height: h,
      background: G.card,
      border: `2px solid ${G.border}`,
      borderRadius: 14,
      padding: 20,
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      gap: 10,
    }}
  >
    <div style={{ fontFamily: FONT_STACK, fontSize: 22, fontWeight: 800, color: G.ink, overflowWrap: 'break-word' }}>
      {label}
    </div>
    <div style={{ fontFamily: FONT_STACK, fontSize: 30, fontWeight: 800, color: G.accent }}>
      {value}
    </div>
  </div>
);

export const PortalWipeV2: React.FC<PortalWipeV2Props> = ({
  sceneA = {
    title: '概览',
    type: 'rows',
    rows: [
      { label: '指标一', value: '+18%' },
      { label: '指标二', value: '2.1×' },
    ],
  },
  sceneB = {
    title: '状态',
    type: 'rows',
    rows: [
      { label: '节点', value: '4/4' },
      { label: '可用性', value: '99.98%' },
    ],
  },
  cards = [
    { label: '指标一', value: '+18%' },
    { label: '指标二', value: '2.1×' },
  ],
}) => {
  const frame = useCurrentFrame();

  // ── 窗放大：40f，先慢后快再缓收 ──
  const t = interpolate(frame, [25, 65], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.7, 0, 0.3, 1),
  });
  const c0 = { x: 1180, y: 620, w: 480, h: 320, r: 14 };
  const x = interpolate(t, [0, 1], [c0.x, 0]);
  const y = interpolate(t, [0, 1], [c0.y, 0]);
  const w = interpolate(t, [0, 1], [c0.w, 1920]);
  const h = interpolate(t, [0, 1], [c0.h, 1080]);
  const r = interpolate(t, [0, 1], [c0.r, 0]);

  // ── 窗内视差散开：40→73f，Easing.out 保证 f65 穿窗完成后 8f 内速度归零 ──
  const spread = interpolate(frame, [40, 73], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  // 窗内整体从缩略推到满幅
  const innerScale = interpolate(t, [0, 1], [0.42, 1]);

  return (
    <AbsoluteFill style={{ background: G.bg, overflow: 'hidden' }}>
      {/* 旧场景：sceneA */}
      <SceneContent content={sceneA} />

      {/* 窗（放大的卡）——内藏新场景 */}
      <div
        style={{
          position: 'absolute',
          left: x,
          top: y,
          width: w,
          height: h,
          borderRadius: r,
          overflow: 'hidden',
          boxShadow: t < 1 ? '0 12px 48px rgba(0,0,0,0.22)' : 'none',
        }}
      >
        {/* 窗内 1920×1080 舞台，随穿窗从 0.42 推到 1 */}
        <div
          style={{
            position: 'absolute',
            width: 1920,
            height: 1080,
            left: '50%',
            top: '50%',
            transform: `translate(-50%, -50%) scale(${innerScale})`,
            background: G.panel,
          }}
        >
          {/* 远景层（系数 0.08，不加 blur）：新场景整页 dashboard 缩略 */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              transform: `scale(${1 + spread * 0.08})`,
              transformOrigin: '960px 540px',
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: 1920,
                height: 1080,
                transform: 'translate(-50%, -50%) scale(0.82)',
                transformOrigin: 'center',
                borderRadius: 20,
                overflow: 'hidden',
                border: `2px solid ${G.border}`,
                boxShadow: '0 8px 32px rgba(0,0,0,0.10)',
              }}
            >
              <SceneContent content={sceneB} />
            </div>
            <div style={{ position: 'absolute', left: 250, top: 100 }}>
              <div style={{ fontFamily: FONT_STACK, fontWeight: 800, fontSize: 64, color: G.ink, letterSpacing: -1 }}>
                {sceneB.title ?? 'Scene B'}
              </div>
            </div>
          </div>

          {/* 近景层（系数 0.3，不加 blur）：只 2 张卡，向边缘让位 */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              transform: `scale(${1 + spread * 0.3})`,
              transformOrigin: '960px 540px',
            }}
          >
            <div style={{ position: 'absolute', left: 150, top: 660 }}>
              <MiniCard w={380} h={250} label={cards[0]?.label ?? ''} value={cards[0]?.value ?? ''} />
            </div>
            <div style={{ position: 'absolute', left: 1420, top: 160 }}>
              <MiniCard w={340} h={220} label={cards[1]?.label ?? ''} value={cards[1]?.value ?? ''} />
            </div>
          </div>
        </div>

        {/* 卡正面：放大初期渐隐，露出窗内新场景 */}
        <div style={{ position: 'absolute', inset: 0, opacity: Math.max(0, 1 - t * 2.4) }}>
          <MiniCard w={c0.w} h={c0.h} label={sceneA.title ?? ''} value={cards[0]?.value ?? ''} />
        </div>
      </div>
    </AbsoluteFill>
  );
};
