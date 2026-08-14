// === 可调参数 ===
// DURATION: 180（总帧数，可调；弹性段随 DURATION 等比缩放）
// 色彩: 走纸墨 G 色板（src/_fixtures/Fixtures.tsx）——文字 G.ink / 背景 G.bg / 强调 G.accent
// 功能: 展开
// === 时间特性 ===
// 刚性（不可压缩）: 刚性:keycap 15/11f
// 弹性（可伸缩）: 其余段（入场/过渡/收尾/hold）可等比缩放
// === 适配注意 ===
// 调 DURATION 时只动弹性段 interpolate 关键帧，刚性核心帧区间保持固定帧数。
// cursor-performance-punch-in —— 光标拟人表演 + 点击跟随推近
// 放大光标沿贝塞尔曲线从左下滑入（末端甩腕过冲）→ 悬停按钮微亮响应 →
// 点击：按钮下陷 + 涟漪扩散 + 整画布以点击点为原点推近 1→1.4 → 停 → 缓退回。
// 推近"有去有回"区别 crash-zoom。收尾真静止 ≥35f。全灰阶。
import React from 'react';
import { interpolate, Easing } from 'remotion';
import { G } from '../../_fixtures/Fixtures';
import { SceneContent, SceneContentData } from '../../_system/scene-content';
import { FONT_STACK } from '../../_system/typography';

import { useShotFrame } from '../../../engine/useShotFrame';
import type { ShotTime } from '../../../engine/time';

// 时长画像（保守兜底：整段弹性；精修阶段按镜头关键帧画像刚弹分段）
const SHOT_TIME: ShotTime = {
  segments: [{ from: 0, to: 180, mode: 'elastic', minFrames: 24 }],
  minFrames: 24,
};

// 时间轴（30fps，共 150f）
const T = {
  cursorInEnd: 30, // 0–30f 光标贝塞尔滑入（f24 过冲峰值，f24–30 拐回落定）
  click: 40,       // 30–40f 悬停响应 10f；f40 点击
  punchEnd: 52,    // 40–52f 推近 1→1.4（out-cubic）
  holdEnd: 72,     // 52–72f 停 20f
  backEnd: 90,     // 72–90f 缓退回 1.0（inOut-cubic）
  total: 150,      // 90–150f 真静止 60f
};

// 按钮与点击点（画布坐标）
const BTN = { x: 1560, y: 130, w: 200, h: 64 };
const CLICK = { x: 1665, y: 168 };

// 光标贝塞尔路径：左下滑入，先沉后扬，曲线有性格
const P0 = { x: 180, y: 1000 };
const P1 = { x: 820, y: 1075 };
const P2 = { x: 1795, y: 560 };
const P3 = { x: CLICK.x, y: CLICK.y };
const bez = (t: number) => {
  const u = 1 - t;
  return {
    x: u * u * u * P0.x + 3 * u * u * t * P1.x + 3 * u * t * t * P2.x + t * t * t * P3.x,
    y: u * u * u * P0.y + 3 * u * u * t * P1.y + 3 * u * t * t * P2.y + t * t * t * P3.y,
  };
};

const Cursor: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <svg
    width={48}
    height={48}
    viewBox="0 0 28 28"
    style={{
      position: 'absolute',
      left: x - 3.4,
      top: y - 1.7,
      filter: 'drop-shadow(0 4px 7px rgba(0,0,0,0.4))',
    }}
  >
    <path
      d="M2 1 L2 23 L8 17.5 L11.5 25 L15.5 23.2 L12 15.8 L20 15 Z"
      fill="#ffffff"
      stroke="#2f2f2f"
      strokeWidth={1.6}
      strokeLinejoin="round"
    />
  </svg>
);

export interface CursorPerformancePunchInProps {
  scene?: SceneContentData;
}

export const CursorPerformancePunchIn: React.FC<CursorPerformancePunchInProps> = ({
  scene = {
    title: '概览',
    type: 'rows',
    rows: [
      { label: '指标一', value: '+18%' },
      { label: '指标二', value: '2.1×' },
      { label: '指标三', value: '96.4%' },
    ],
  },
}) => {
  const frame = useShotFrame(SHOT_TIME);

  // —— 光标：路径参数 t，f24 过冲到 1.05（沿切线甩过按钮），f24–30 拐回 1.0 ——
  const t =
    frame < 24
      ? interpolate(frame, [0, 24], [0, 1.05], {
          extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
          easing: Easing.out(Easing.cubic),
        })
      : interpolate(frame, [24, T.cursorInEnd], [1.05, 1], {
          extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
          easing: Easing.inOut(Easing.quad),
        });
  const cur = bez(t);
  // 点击帧光标随按钮微沉 3px（f40–42 下，f42–46 回）
  const dip = interpolate(frame, [T.click, T.click + 2, T.click + 6], [0, 3, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  // —— 悬停响应：f30–34 按钮提亮（深底提亮可见）+ 微放大 ——
  const lift = interpolate(frame, [T.cursorInEnd, T.cursorInEnd + 4], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const c = Math.round(47 + 38 * lift); // #2f2f2f → #555553 近似
  const hoverScale = 1 + 0.05 * lift;

  // —— 点击下陷：f40–42 scale→0.94，f42–46 弹回 ——
  const press = interpolate(frame, [T.click, T.click + 2, T.click + 6], [1, 0.94, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  // —— 推近有去有回：40–52f 1→1.4（out-cubic）；72–90f 1.4→1（inOut）——
  const zoom =
    frame < T.holdEnd
      ? interpolate(frame, [T.click, T.punchEnd], [1, 1.4], {
          extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
          easing: Easing.out(Easing.cubic),
        })
      : interpolate(frame, [T.holdEnd, T.backEnd], [1.4, 1], {
          extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
          easing: Easing.inOut(Easing.cubic),
        });

  // —— 涟漪：扩散 out-cubic（40–62f，直径 60→380），消散线性（40–66f）帧时间解耦 ——
  const rippleAlive = frame >= T.click && frame < T.click + 26;
  const rippleD = interpolate(frame, [T.click, T.click + 22], [60, 380], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const rippleOp = interpolate(frame, [T.click, T.click + 26], [0.9, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const rippleBw = interpolate(frame, [T.click, T.click + 22], [9, 3], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  return (
    <div style={{ width: 1920, height: 1080, background: G.bg, overflow: 'hidden', position: 'relative' }}>
      {/* 整画布以点击点为原点推近 */}
      <div style={{
        position: 'absolute', inset: 0,
        transform: `scale(${zoom})`,
        transformOrigin: `${CLICK.x}px ${CLICK.y}px`,
      }}>
        <SceneContent content={scene} />

        {/* 右上自绘 Deploy 按钮（叠在页面上） */}
        <div style={{
          position: 'absolute', left: BTN.x, top: BTN.y, width: BTN.w, height: BTN.h,
          borderRadius: 14, background: `rgb(${c},${c},${c - 2})`,
          boxShadow: '0 6px 18px rgba(0,0,0,0.28)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transform: `scale(${hoverScale * press})`,
          fontFamily: FONT_STACK, fontWeight: 700,
          fontSize: 27, color: G.card, letterSpacing: 0.5,
        }}>
          Deploy
        </div>

        {/* 涟漪圆环：条件挂载，f66 后摘除 */}
        {rippleAlive && (
          <div style={{
            position: 'absolute',
            left: CLICK.x - rippleD / 2, top: CLICK.y - rippleD / 2,
            width: rippleD, height: rippleD, borderRadius: '50%',
            border: `${rippleBw}px solid ${G.ink}`,
            opacity: rippleOp,
          }} />
        )}

        {/* 放大光标（随画布一起被推近，钉在按钮上） */}
        <Cursor x={cur.x} y={cur.y + dip} />
      </div>
    </div>
  );
};
