// === 可调参数 ===
// DURATION: 180（总帧数，可调；弹性段随 DURATION 等比缩放）
// 色彩: 走纸墨 G 色板（src/_fixtures/Fixtures.tsx）——文字 G.ink / 背景 G.bg / 强调 G.accent
// 功能: 展开
// props: command（终端命令）、history（历史行）、result（回车后全屏内容承载）
// === 时间特性 ===
// 刚性（不可压缩）: 无（全程弹性）
// 弹性（可伸缩）: 全程可等比缩放（时长适配语音）
// === 适配注意 ===
// 调 DURATION 时只动弹性段 interpolate 关键帧，刚性核心帧区间保持固定帧数。
// terminal-typewriter —— 终端打字机触发
// 深色终端窗居中，"$ deploy --prod" 逐字符敲出（2f/字符，帧确定
// substring），方块光标 12f 方波闪 → 敲完停 12f → 回车帧：整场景 6f
// Easing.in(cubic) 急推 scale 1→3.2 向命令行推入（末 2f 加 blur）硬切到
// result 内容全屏，1.06→1 回稳 4f 落定。收尾真静止 ≥40f。
import React from 'react';
import { useCurrentFrame, interpolate, Easing } from 'remotion';
import { G } from '../../_fixtures/Fixtures';
import { SceneContent, SceneContentData } from '../../_system/scene-content';

// 终端窗几何
const TW = 1100;
const TH = 620;
const TL = (1920 - TW) / 2; // 410
const TT = (1080 - TH) / 2; // 230
const TITLEBAR = 52;
const PAD = 34;
// 命令行基线（推入焦点）：标题栏下第二行文字中心
const FOCUS_X = 960;
const FOCUS_Y = TT + TITLEBAR + PAD + 92; // ≈ 408

const TerminalWindow: React.FC<{
  chars: number;
  cursorOn: boolean;
  command: string;
  history: string;
  windowTitle: string;
}> = ({ chars, cursorOn, command, history, windowTitle }) => (
  <div style={{
    width: TW, height: TH, background: '#1e1e1c', borderRadius: 14,
    boxShadow: '0 24px 64px rgba(0,0,0,0.35)',
    overflow: 'hidden', boxSizing: 'border-box',
  }}>
    {/* 标题栏：三圆点窗控（灰阶） */}
    <div style={{
      height: TITLEBAR, background: '#2a2a28', borderBottom: '1px solid #3a3a38',
      display: 'flex', alignItems: 'center', gap: 12, padding: '0 22px',
      boxSizing: 'border-box',
    }}>
      {['#6a6a68', '#8f8f8d', '#b5b5b3'].map((c, i) => (
        <div key={i} style={{ width: 16, height: 16, borderRadius: 8, background: c }} />
      ))}
      <div style={{ margin: '0 auto', fontSize: 15, color: '#8f8f8d', fontWeight: 600 }}>{windowTitle}</div>
      <div style={{ width: 72 }} />
    </div>
    {/* 内容区 */}
    <div style={{
      padding: PAD, fontFamily: 'Menlo, Consolas, monospace', fontSize: 40,
      color: '#d8d8d6', lineHeight: 1.5,
    }}>
      {/* 一行历史输出做上下文 */}
      <div style={{ color: G.mid, fontSize: 32, marginBottom: 18 }}>{history}</div>
      <div style={{ display: 'flex', alignItems: 'center', whiteSpace: 'pre' }}>
        <span style={{ color: G.mid }}>{'$ '}</span>
        <span style={{ color: G.card }}>{command.substring(0, chars)}</span>
        <span style={{
          display: 'inline-block', width: 24, height: 48, marginLeft: 4,
          background: G.card, opacity: cursorOn ? 1 : 0,
        }} />
      </div>
    </div>
  </div>
);

export interface TerminalTypewriterProps {
  command?: string;
  history?: string;
  result?: SceneContentData;
  windowTitle?: string; // 终端窗口标题
}

export const TerminalTypewriter: React.FC<TerminalTypewriterProps> = ({
  command = 'deploy --prod',
  history = '~ (main)',
  windowTitle = '未命名终端',
  result = {
    title: '概览',
    type: 'rows',
    rows: [
      { label: '指标一', value: '+18%' },
      { label: '指标二', value: '2.1×' },
      { label: '指标三', value: '96.4%' },
    ],
  },
}) => {
  const frame = useCurrentFrame();

  // 时间轴随命令长度动态：10 起敲（2f/字符）→ 敲完停 12f → 6f 急推硬切 → 4f 落定
  const typeStart = 10;
  const typeEnd = typeStart + command.length * 2;
  const enter = typeEnd + 12;
  const pushEnd = enter + 6;
  const settleEnd = pushEnd + 4;

  // 帧确定打字：2f/字符
  const chars = Math.min(command.length, Math.max(0, Math.floor((frame - typeStart) / 2)));

  // 方块光标 12f 周期方波闪（全程）
  const cursorOn = frame % 12 < 6;

  // 回车急推：整场景 scale 1→3.2，6f Easing.in(cubic)，向命令行推入
  const pushScale = interpolate(frame, [enter, pushEnd], [1, 3.2], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.in(Easing.cubic),
  });
  // 末 2f 运动模糊（f62–f64），硬切后摘罩=条件挂载
  const pushBlur = interpolate(frame, [pushEnd - 2, pushEnd], [0, 10], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  // 硬切：f64 起终端场景整体卸载，result 挂载
  const cut = frame >= pushEnd;

  // result 落定：1.06→1 回稳 4f
  const dashScale = interpolate(frame, [pushEnd, settleEnd], [1.06, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  return (
    <div style={{ width: 1920, height: 1080, background: G.bg, position: 'relative', overflow: 'hidden' }}>
      {!cut ? (
        <div style={{
          width: 1920, height: 1080,
          transform: `scale(${pushScale})`,
          transformOrigin: `${FOCUS_X}px ${FOCUS_Y}px`,
          ...(pushBlur > 0 ? { filter: `blur(${pushBlur}px)` } : {}),
        }}>
          <div style={{ position: 'absolute', left: TL, top: TT }}>
            <TerminalWindow chars={chars} cursorOn={cursorOn} command={command} history={history} windowTitle={windowTitle} />
          </div>
        </div>
      ) : (
        <div style={{
          width: 1920, height: 1080,
          transform: `scale(${dashScale})`,
          transformOrigin: '960px 540px',
        }}>
          <SceneContent content={result} />
        </div>
      )}
    </div>
  );
};
