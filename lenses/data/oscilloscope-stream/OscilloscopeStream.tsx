// === 可调参数 ===
// DURATION: 180（总帧数，可调；弹性段随 DURATION 等比缩放）
// 功能: 举证
// 描述: 示波器流——实时示波线流动
// 色彩: 走纸墨 G 色板（src/_fixtures/Fixtures.tsx）——文字 G.ink / 背景 G.bg / 强调 G.accent
// === 时间特性 ===
// 策略: 弹刚 ShotTime（整段弹性）
// 刚性（不可压缩）: 无（全程弹性）
// 弹性（可伸缩）: 全程可等比缩放（时长适配语音）
// === 适配注意 ===
// 调 DURATION 时只动弹性段 interpolate 关键帧，刚性核心帧区间保持固定帧数。
// oscilloscope-stream-v2 —— 示波流线 v2（批次 6 "改改再看" 重做）
// 相对 v1 的加码：流速 5.5→8px/f；写入点亮点 1.5×（7→10.5）、余辉 90→160px；
// 流动中途插入一次突发尖峰（振幅 2.2×、持续 ~20 帧写入后随流带走），尖峰经过写入点时
// 卡头实时读数跳大并变琥珀；真图表语境：真标题/真 y 轴刻度/真时间轴/实时读数。
// 刹停逻辑保留：f100–112 out-cubic 刹停，f112 后真静止 48f。
// v7 扩展：zeroFrom 参数——波形照常流动，走到归零点后「新写入」的轨迹开始跌向
// 0 刻度线并贴底，已写出的历史轨迹保持不变（表达"指标最后走向 0"），默认不传保持原版。
// 帧确定性：波形与尖峰包络都是纯 worldX 函数，无 Math.random / Date.now。
import React from 'react';
import { interpolate, Easing } from 'remotion';
import { G } from '../../_fixtures/Fixtures';
import { FONT_STACK } from '../../_system/typography';
import { useShotFrame } from '../../../engine/useShotFrame';
import type { ShotTime } from '../../../engine/time';

// 时长画像（lens-timings 无此镜头；按文件头「全程弹性」标）
const SHOT_TIME: ShotTime = {
  segments: [{ from: 0, to: 180, mode: 'elastic', minFrames: 60 }],
  minFrames: 60,
};

const CARD_W = 1080;
const CARD_H = 560;
const CX = (1920 - CARD_W) / 2;
const CY = (1080 - CARD_H) / 2 + 40;
const PAD = 46;
const AXIS_W = 64; // 左侧 y 轴刻度位
const PLOT_X = PAD + AXIS_W;
const PLOT_W = CARD_W - PAD * 2 - AXIS_W; // 924
const PLOT_H = 300;
const PLOT_Y = 158;

const HOLD = 12;
const FREEZE_START = 100;
const FREEZE_END = 112;
const SPEED = 8; // px/frame（v1 5.5 → 8，~240px/s）
const AMP = 0.72; // 基础振幅占半高比例（给尖峰留出头部空间）

// 突发尖峰：worldX ∈ [288, 448]（写入发生在 f48–68，之后随流向左带走）
const SPIKE_X0 = 288;
const SPIKE_W = 160;
const SPIKE_GAIN = 1.2; // 峰值 = 1 + 1.2 = 2.2×

const env = (x: number): number => {
  if (x <= SPIKE_X0 || x >= SPIKE_X0 + SPIKE_W) return 1;
  const p = (x - SPIKE_X0) / SPIKE_W;
  return 1 + SPIKE_GAIN * (0.5 - 0.5 * Math.cos(p * Math.PI * 2));
};

// 有效时间：HOLD 前为 0，之后线性流动，FREEZE 区间 easeOut 刹停为常数
const effTime = (frame: number): number => {
  const t = (f: number) => Math.max(f - HOLD, 0) * SPEED;
  if (frame <= FREEZE_START) return t(frame);
  const brakeDist = (t(FREEZE_END) - t(FREEZE_START)) * 0.45;
  return (
    t(FREEZE_START) +
    interpolate(frame, [FREEZE_START, FREEZE_END], [0, brakeDist], {
      easing: Easing.out(Easing.cubic),
      extrapolateRight: 'clamp',
    })
  );
};

// 波形：四个正弦叠加，x 单位 = 世界像素
const wave = (x: number): number =>
  0.34 * Math.sin(x * 0.021) +
  0.27 * Math.sin(x * 0.052 + 1.7) +
  0.18 * Math.sin(x * 0.013 + 4.2) +
  0.12 * Math.sin(x * 0.087 + 2.3);

const signal = (x: number): number => wave(x) * env(x) * AMP; // ∈ ~[-1.6, 1.6]，常态 [-0.65, 0.65]
const fmt = (n: number): string => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

const X_TICKS = ['-60s', '-50s', '-40s', '-30s', '-20s', '-10s', 'now'];

export interface OscilloscopeStreamProps {
  title?: string;
  subtitle?: string;
  unit?: string;
  baseValue?: number;
  zeroFrom?: number; // 从该帧起波形衰减归零（默认不启用）
}

export const OscilloscopeStream: React.FC<OscilloscopeStreamProps> = ({
  title = 'Requests per second',
  subtitle = 'api-gateway · production · last 60 s',
  unit = 'req/s',
  baseValue = 1000,
  zeroFrom = Number.POSITIVE_INFINITY,
}) => {
  const frame = useShotFrame(SHOT_TIME);
  const T = effTime(frame);

  // 走向 0 的轨迹宽度（世界像素）：归零点之后的新轨迹在 span 内跌到 0 线
  const COLLAPSE_SPAN = 240;
  const collapseAt = Number.isFinite(zeroFrom) ? effTime(zeroFrom) : Number.POSITIVE_INFINITY;
  // 世界坐标衰减：x ≤ 归零点 → 1（历史轨迹不变）；之后线性跌到 0
  const dAt = (x: number): number => {
    if (!Number.isFinite(collapseAt) || x <= collapseAt) return 1;
    return Math.max(0, 1 - (x - collapseAt) / COLLAPSE_SPAN);
  };
  // 波形 y：新写入轨迹随 d 跌到 0 刻度线（y=PLOT_H），历史轨迹 d=1 保持原样
  const sigAt = (x: number): number => signal(x) * dAt(x) - (1 - dAt(x));
  const yOf = (x: number): number => PLOT_H / 2 - sigAt(x) * (PLOT_H / 2);
  // 读数映射：绘图区中线 = baseValue，上下沿 = 2× / 0
  const valueOf = (x: number): number => Math.round((baseValue + signal(x) * baseValue) * dAt(x));
  // y 轴刻度按 baseValue 生成
  const Y_TICKS = [2, 1.5, 1, 0.5, 0].map((m) => fmt(Math.round(m * baseValue)));

  const N = 270;
  const pts: string[] = [];
  for (let i = 0; i <= N; i++) {
    const px = (i / N) * PLOT_W;
    const worldX = T - (PLOT_W - px);
    pts.push(`${px.toFixed(2)},${yOf(worldX).toFixed(2)}`);
  }
  const headY = yOf(T);

  const frozen = frame >= FREEZE_END;
  const glowOp = interpolate(frame, [FREEZE_START, FREEZE_END], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // 余辉段：头部往回 160px（v1 90 → 160）
  const TAIL = 160;
  const tailPts: string[] = [];
  if (!frozen) {
    for (let i = 0; i <= 40; i++) {
      const px = PLOT_W - TAIL + (i / 40) * TAIL;
      const worldX = T - (PLOT_W - px);
      tailPts.push(`${px.toFixed(2)},${yOf(worldX).toFixed(2)}`);
    }
  }

  // 实时读数：尖峰经过写入点时跳大 + 变琥珀
  const spikeK = Math.min(Math.max((env(T) - 1) / SPIKE_GAIN, 0), 1);
  const hot = spikeK > 0.22;
  const readout = fmt(valueOf(T));
  const readScale = 1 + 0.32 * spikeK;
  const dotColor = spikeK > 0.15 ? G.accent : G.ink;

  return (
    <div style={{ width: 1920, height: 1080, background: G.bg, position: 'relative', overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute',
          left: CX,
          top: CY,
          width: CARD_W,
          height: CARD_H,
          background: G.card,
          border: `2px solid ${G.border}`,
          borderRadius: 14,
          boxSizing: 'border-box',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}
      >
        {/* 真卡头：标题 + 副题 + 实时读数 */}
        <div style={{ position: 'absolute', left: PAD, top: 38, fontFamily: FONT_STACK }}>
          <div style={{ fontSize: 30, fontWeight: 700, color: G.ink }}>{title}</div>
          <div style={{ fontSize: 20, fontWeight: 500, color: G.mid, marginTop: 8 }}>{subtitle}</div>
        </div>
        <div
          style={{
            position: 'absolute',
            right: PAD,
            top: 36,
            textAlign: 'right',
            fontFamily: FONT_STACK,
            transform: `scale(${readScale.toFixed(4)})`,
            transformOrigin: 'right top',
          }}
        >
          <div style={{ fontSize: 46, fontWeight: 800, color: hot ? G.accent : G.ink, fontVariantNumeric: 'tabular-nums', letterSpacing: -1 }}>
            {readout}
          </div>
          <div style={{ fontSize: 18, fontWeight: 600, color: hot ? G.accent : G.mid, marginTop: 2 }}>{unit} · live</div>
        </div>

        {/* y 轴真刻度 */}
        {Y_TICKS.map((t, i) => (
          <div
            key={`yt${i}`}
            style={{
              position: 'absolute',
              left: PAD - 6,
              top: PLOT_Y + (PLOT_H / 4) * i - 11,
              width: AXIS_W - 8,
              textAlign: 'right',
              fontFamily: FONT_STACK,
              fontSize: 20,
              fontWeight: 600,
              color: G.mid,
            }}
          >
            {t}
          </div>
        ))}

        <div style={{ position: 'absolute', left: PLOT_X, top: PLOT_Y, width: PLOT_W, height: PLOT_H }}>
          {/* 网格 */}
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={`h${i}`} style={{ position: 'absolute', left: 0, right: 0, top: (PLOT_H / 4) * i, height: 2, background: G.line, opacity: 0.7 }} />
          ))}
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <div key={`v${i}`} style={{ position: 'absolute', top: 0, bottom: 0, left: (PLOT_W / 6) * i, width: 2, background: G.line, opacity: 0.45 }} />
          ))}

          <svg width={PLOT_W} height={PLOT_H} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
            <polyline points={pts.join(' ')} fill="none" stroke={G.ink} strokeWidth={5} strokeLinejoin="round" strokeLinecap="round" />
            {!frozen && glowOp > 0 && (
              <polyline
                points={tailPts.join(' ')}
                fill="none"
                stroke="#6a6a68"
                strokeWidth={9}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.55 * glowOp}
                style={{ filter: 'blur(2px)' }}
              />
            )}
            {/* 写入点亮点（1.5×） */}
            {!frozen && glowOp > 0 && (
              <>
                <circle cx={PLOT_W} cy={headY} r={24} fill={spikeK > 0.15 ? G.accent : G.mid} opacity={0.35 * glowOp} style={{ filter: 'blur(5px)' }} />
                <circle cx={PLOT_W} cy={headY} r={10.5} fill={dotColor} opacity={glowOp} />
              </>
            )}
          </svg>
        </div>

        {/* x 轴真时间刻度 */}
        <div style={{ position: 'absolute', left: PLOT_X, top: PLOT_Y + PLOT_H + 14, width: PLOT_W }}>
          {X_TICKS.map((t, i) => (
            <div
              key={`xt${i}`}
              style={{
                position: 'absolute',
                left: (PLOT_W / 6) * i - 40,
                width: 80,
                textAlign: 'center',
                fontFamily: FONT_STACK,
                fontSize: 19,
                fontWeight: 600,
                color: G.mid,
              }}
            >
              {t}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
