// === 可调参数 ===
// DURATION: 180（总帧数，可调；弹性段随 DURATION 等比缩放）
// 色彩: 走纸墨 G 色板（src/_fixtures/Fixtures.tsx）——文字 G.ink / 背景 G.bg / 强调 G.accent
// 功能: 展开,对比
// === 时间特性 ===
// 策略: 弹刚 ShotTime（整段弹性）
// 刚性（不可压缩）: 无
// 弹性（可伸缩）: 全程可等比缩放（时长适配语音）
// === 适配注意 ===
// 段长不足 60f 时回退原始帧（动画按原速、可能被截断）。
// cursor-cast-ensemble —— figma 0:05 (cursor-badge-cast) + miro 全片 cursor-ensemble-ambience
// 5 枚具名彩色光标从画外飞入（弹簧减速+名牌淡入），落位后在灰阶画布上持续漂移、
// 指向、聚拢；灰阶便签当环境道具；其中一枚(Rita)在便签上实时打字补全一行文本
// （pitch collaborator-cameo 的打字戏并入）。
import React from 'react';
import { spring, interpolate } from 'remotion';
import { G } from '../../_fixtures/Fixtures';
import { FONT_STACK } from '../../_system/typography';

import { useShotFrame } from '../../../engine/useShotFrame';
import type { ShotTime } from '../../../engine/time';

// 时长画像：整段弹性（2026-08-14 精修）
const SHOT_TIME: ShotTime = {
  segments: [{ from: 0, to: 180, mode: 'elastic', minFrames: 60 }],
  minFrames: 60,
};

const mulberry32 = (a: number) => () => {
  let t = (a += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const FPS = 30;
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

type Actor = {
  name: string; color: string;
  from: [number, number]; home: [number, number];
  delay: number; phase: number;
};

const ACTOR_LAYOUT: Omit<Actor, 'name'>[] = [
  { color: '#b87a2e', from: [-160, 200], home: [430, 330], delay: 0, phase: 0.0 },
  { color: G.accent, from: [2080, 160], home: [1370, 290], delay: 5, phase: 1.7 },
  { color: '#F2994A', from: [-160, 900], home: [560, 760], delay: 9, phase: 3.1 },
  { color: '#b87a2e', from: [2080, 950], home: [1420, 780], delay: 13, phase: 4.4 },
  { color: G.accent, from: [900, -180], home: [960, 545], delay: 17, phase: 5.6 },
];

const CursorActor: React.FC<{ x: number; y: number; a: Actor; badge: number; scale?: number }> = ({
  x, y, a, badge, scale = 2.1,
}) => (
  <div style={{ position: 'absolute', left: x, top: y, transform: `scale(${scale})`, transformOrigin: '0 0', zIndex: 10 }}>
    <svg width={30} height={44} viewBox="0 0 13.5 20" style={{ display: 'block', overflow: 'visible' }}>
      <path d="M0.5 0.5 L0.5 17.2 L4.7 13.4 L7.3 19.5 L10 18.3 L7.4 12.3 L13 12.3 Z"
        fill={a.color} stroke="#ffffff" strokeWidth={1.1} strokeLinejoin="round" />
    </svg>
    <div style={{
      position: 'absolute', left: 24, top: 40, whiteSpace: 'nowrap',
      background: a.color, color: '#fff', borderRadius: 7, padding: '4px 11px',
      fontFamily: FONT_STACK, fontWeight: 700, fontSize: 14,
      opacity: badge, transform: `translateY(${(1 - badge) * 10}px)`,
    }}>
      {a.name}
    </div>
  </div>
);

export interface CursorCastEnsembleProps {
  names?: string[];
  typed?: string;
  notes?: { title: string; lines: string[] }[]; // 便签内容
  noteTitle?: string; // 中央便签标题
}

export const CursorCastEnsemble: React.FC<CursorCastEnsembleProps> = ({
  names = ['Lisa', 'Lucas', 'Marta', 'Niko', 'Rita'],
  typed = 'Our customers love it',
  notes = [
    { title: '要点', lines: ['第一行', '第二行'] },
    { title: '备忘', lines: ['第一行', '第二行'] },
    { title: '灵感', lines: ['第一行', '第二行'] },
    { title: '跟进', lines: ['第一行', '第二行'] },
  ],
  noteTitle = '协作便签',
}) => {
  const f = useShotFrame(SHOT_TIME);
  const TYPED = typed;
  const ACTORS: Actor[] = ACTOR_LAYOUT.map((a, i) => ({ ...a, name: names[i] ?? `User ${i + 1}` }));
  const rnd = mulberry32(88);
  // 便签的固定随机旋转
  const noteRots = Array.from({ length: 4 }).map(() => (rnd() - 0.5) * 8);

  // 聚拢时刻：90 帧后所有光标向中央便签聚拢
  const gatherT = easeInOut(clamp01((f - 92) / 26));
  const GATHER: [number, number][] = [
    [770, 430], [1160, 420], [800, 640], [1130, 650], [960, 545],
  ];

  // 打字进度（Rita 落位后开始，60–130 帧）
  const typedCount = Math.floor(interpolate(f, [58, 118], [0, TYPED.length], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  }));
  const caretOn = Math.floor(f / 8) % 2 === 0;

  return (
    <div style={{ width: 1920, height: 1080, background: G.bg, position: 'relative', overflow: 'hidden' }}>
      {/* 点阵无限画布底 */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `radial-gradient(${G.line} 2.4px, transparent 2.4px)`,
        backgroundSize: '46px 46px',
      }} />
      {/* 灰阶便签环境道具 */}
      {[
        { x: 250, y: 170, s: 1 }, { x: 1490, y: 140, s: 2 },
        { x: 210, y: 700, s: 3 }, { x: 1530, y: 690, s: 4 },
      ].map((n, i) => (
        <div key={i} style={{
          position: 'absolute', left: n.x, top: n.y, width: 230, height: 210,
          background: '#e6e6e2', border: `2px solid ${G.border}`, borderRadius: 6,
          boxShadow: '0 4px 14px rgba(0,0,0,0.10)', transform: `rotate(${noteRots[i]}deg)`,
          padding: 18, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          <div style={{ fontFamily: FONT_STACK, fontSize: 18, fontWeight: 700, color: G.ink }}>{notes[i % notes.length].title}</div>
          {notes[i % notes.length].lines.map((ln, li) => (
            <div key={li} style={{ fontFamily: FONT_STACK, fontSize: 14, color: G.mid }}>{ln}</div>
          ))}
        </div>
      ))}
      {/* 中央大便签：Rita 打字的舞台 */}
      <div style={{
        position: 'absolute', left: 660, top: 420, width: 600, height: 240,
        background: '#ffffff', border: `2px solid ${G.border}`, borderRadius: 12,
        boxShadow: '0 6px 22px rgba(0,0,0,0.12)', padding: 30, boxSizing: 'border-box',
      }}>
        <div style={{ fontFamily: FONT_STACK, fontSize: 22, fontWeight: 700, color: G.ink, marginBottom: 16 }}>{noteTitle}</div>
        <div style={{
          fontFamily: FONT_STACK, fontWeight: 700, fontSize: 44,
          color: G.ink, letterSpacing: -0.5, minHeight: 56,
        }}>
          {TYPED.slice(0, typedCount)}
          <span style={{
            display: 'inline-block', width: 4, height: 44, background: G.accent,
            marginLeft: 3, verticalAlign: 'middle',
            opacity: f > 50 && typedCount < TYPED.length ? (caretOn ? 1 : 0.15) : 0,
          }} />
        </div>
      </div>

      {/* 五枚光标 */}
      {ACTORS.map((a, i) => {
        const s = spring({ frame: f - a.delay, fps: FPS, config: { damping: 15, stiffness: 90, mass: 0.9 } });
        let x = interpolate(s, [0, 1], [a.from[0], a.home[0]]);
        let y = interpolate(s, [0, 1], [a.from[1], a.home[1]]);
        // 落位后持续漂移 + 偶尔"指向"性的小冲刺
        const settled = clamp01((f - a.delay - 26) / 10);
        const driftX = Math.sin(f * 0.055 + a.phase) * 46 + Math.sin(f * 0.021 + a.phase * 2) * 30;
        const driftY = Math.cos(f * 0.047 + a.phase * 1.3) * 38 + Math.cos(f * 0.017 + a.phase) * 24;
        x += driftX * settled * (1 - gatherT * 0.55);
        y += driftY * settled * (1 - gatherT * 0.55);
        // 聚拢
        x = interpolate(gatherT, [0, 1], [x, GATHER[i][0] + driftX * 0.25]);
        y = interpolate(gatherT, [0, 1], [y, GATHER[i][1] + driftY * 0.25]);
        const badge = clamp01((f - a.delay - 12) / 12);
        return <CursorActor key={a.name} x={x} y={y} a={a} badge={badge} />;
      })}
    </div>
  );
};
