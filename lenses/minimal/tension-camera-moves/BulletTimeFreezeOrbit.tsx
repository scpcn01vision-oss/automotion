// === 可调参数 ===
// DURATION: 180（总帧数，可调；弹性段随 DURATION 等比缩放）
// 色彩: 走纸墨 G 色板（src/_fixtures/Fixtures.tsx）——文字 G.ink / 背景 G.bg / 强调 G.accent
// 功能: 宣告,举证
// === 时间特性 ===
// 刚性（不可压缩）: 无（全程弹性）
// 弹性（可伸缩）: 全程可等比缩放（时长适配语音）
// === 适配注意 ===
// 调 DURATION 时只动弹性段 interpolate 关键帧，刚性核心帧区间保持固定帧数。
// 子弹时间冻结环绕(bullet-time-freeze-orbit)——The Matrix bullet time。
// 中央 900×560 面板内 5 根柱状图错峰生长(动画时钟 effFrame 驱动)。
// 关键帧:0–20 hold 读布景;20–45 柱子正常生长;45–105 时钟咬死(柱子完全静止),
// 相机 perspective(1600px) 下 rotateY 0→55°(45–72)→顶点悬停(72–82)→回 0(82–105),
// 同步 scale 1→1.12→1 + translateX 摆动增强绕行感;105–120 时钟恢复柱子长完;
// 118–128 数字标签浮现;128–150 全静止收尾。
import React from 'react';
import { useCurrentFrame, interpolate, Easing } from 'remotion';
import { G } from '../../_fixtures/Fixtures';
import { FONT_STACK } from '../../_system/typography';

const PANEL_W = 900;
const PANEL_H = 560;

export interface BulletTimeBar {
  value: number;
  label?: string;
}

export interface BulletTimeFreezeOrbitProps {
  panelTitle?: string;
  panelSubtitle?: string;
  bars?: BulletTimeBar[];
  sideTitle?: string;
  sideSubtitle?: string;
}

export const BulletTimeFreezeOrbit: React.FC<BulletTimeFreezeOrbitProps> = ({
  panelTitle = 'METRICS',
  panelSubtitle = 'Q3 OVERVIEW',
  bars = [
    { value: 62, label: 'Q1' },
    { value: 74, label: 'Q2' },
    { value: 58, label: 'Q3' },
    { value: 89, label: 'Q4' },
    { value: 97, label: 'FY' },
  ],
  sideTitle = 'Momentum',
  sideSubtitle = 'Quarterly growth trend',
}) => {
  const frame = useCurrentFrame();

  // ── 子弹时间时钟:0–45 正常走,45–105 冻结,105 起恢复 ──
  const effFrame =
    frame < 45 ? frame : frame < 105 ? 45 : 45 + (frame - 105);

  // ── 冻结区间的相机环绕(用真实 frame 驱动) ──
  const rotY =
    frame < 72
      ? interpolate(frame, [45, 72], [0, 55], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
          easing: Easing.inOut(Easing.cubic),
        })
      : frame < 82
        ? 55 // 顶点悬停 10f
        : interpolate(frame, [82, 105], [55, 0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.inOut(Easing.cubic),
          });
  const orbitT = rotY / 55; // 0→1→0,复用做 scale / translateX
  const scale = 1 + 0.12 * orbitT;
  const tx = -170 * Math.sin(orbitT * Math.PI * 0.5) - 60 * orbitT; // 绕行横摆
  const ty = -24 * orbitT;

  // ── 柱子:错峰生长,全部由 effFrame 驱动(冻结即静止) ──
  const chartW = PANEL_W - 140;
  const chartH = PANEL_H - 190;
  const barW = 92;
  const gap = (chartW - bars.length * barW) / Math.max(1, bars.length - 1);
  const barList = bars.map((b, i) => {
    const full = chartH * Math.min(1, Math.max(0.05, b.value / 100)); // 目标高度（value 0-100）
    const start = 20 + i * 4;
    const end = 48 + i * 3; // 20–60f 区间内错峰
    const p = interpolate(effFrame, [start, end], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.cubic),
    });
    return { hNow: full * p, full, value: b.value, label: b.label, done: p >= 1 };
  });

  // ── 恢复段:数字标签浮现(118–128),之后全静止 ──
  const labelOp = interpolate(frame, [118, 128], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // 右侧说明文字:冻结期间（侧向视角）淡入;回正开始（82f）即淡出
  const sideOp = interpolate(frame, [45, 52, 82, 88], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        width: 1920,
        height: 1080,
        background: G.bg,
        position: 'relative',
        overflow: 'hidden',
        fontFamily: FONT_STACK,
      }}
    >
      {/* 右侧说明文字：冻结期间（侧向视角）显示 */}
      {(sideTitle || sideSubtitle) && (
        <div
          style={{
            position: 'absolute', left: 1040, right: 80, top: '50%', transform: 'translateY(-50%)',
            display: 'flex', justifyContent: 'center', opacity: sideOp,
          }}
        >
          <div style={{ textAlign: 'left', maxWidth: 400 }}>
            {sideTitle ? (
              <div style={{ fontSize: 52, fontWeight: 800, color: G.ink, letterSpacing: -1, lineHeight: 1.15 }}>{sideTitle}</div>
            ) : null}
            {sideSubtitle ? (
              <div style={{ fontSize: 24, color: G.mid, marginTop: 16, lineHeight: 1.5 }}>{sideSubtitle}</div>
            ) : null}
          </div>
        </div>
      )}

      {/* 3D 舞台 */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          perspective: 1600,
        }}
      >
        <div
          style={{
            width: PANEL_W,
            height: PANEL_H,
            background: G.card,
            border: `2px solid ${G.border}`,
            borderRadius: 18,
            boxShadow: '0 16px 48px rgba(0,0,0,0.14)',
            boxSizing: 'border-box',
            padding: '44px 70px',
            transform: `translateX(${tx}px) translateY(${ty}px) rotateY(${rotY}deg) scale(${scale})`,
            transformStyle: 'preserve-3d',
          }}
        >
          {/* 面板标题（替代灰条装饰） */}
          <div style={{ fontSize: 30, fontWeight: 700, color: G.ink, marginBottom: 6 }}>{panelTitle}</div>
          <div style={{ fontSize: 18, color: G.mid, letterSpacing: 2, marginBottom: 24 }}>{panelSubtitle}</div>

          {/* 图表区:横向刻度线 + 柱子 */}
          <div style={{ position: 'relative', width: chartW, height: chartH }}>
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: (chartH / 4) * i,
                  height: 2,
                  background: G.line,
                }}
              />
            ))}
            {/* 基线 */}
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                height: 3,
                background: G.mid,
              }}
            />
            {barList.map((b, i) => (
              <div key={i}>
                <div
                  style={{
                    position: 'absolute',
                    left: i * (barW + gap),
                    bottom: 3,
                    width: barW,
                    height: b.hNow,
                    background: i % 2 === 0 ? G.bar : G.mid,
                    borderRadius: '8px 8px 0 0',
                  }}
                />
                {/* 数字标签:恢复段浮现 */}
                <div
                  style={{
                    position: 'absolute',
                    left: i * (barW + gap),
                    bottom: 3 + b.full + 14 - 10 * (1 - labelOp),
                    width: barW,
                    textAlign: 'center',
                    fontWeight: 800,
                    fontSize: 28,
                    color: G.ink,
                    opacity: labelOp,
                  }}
                >
                  {b.value}
                </div>
                {/* 柱下方说明文字 */}
                {b.label ? (
                  <div
                    style={{
                      position: 'absolute',
                      left: i * (barW + gap),
                      bottom: -36,
                      width: barW,
                      textAlign: 'center',
                      fontWeight: 700,
                      fontSize: 20,
                      color: G.mid,
                    }}
                  >
                    {b.label}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
