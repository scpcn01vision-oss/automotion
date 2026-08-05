// === 可调参数 ===
// DURATION: 180（总帧数，可调；弹性段随 DURATION 等比缩放）
// 色彩: 走纸墨 G 色板（src/_fixtures/Fixtures.tsx）——文字 G.ink / 背景 G.bg / 强调 G.accent
// 功能: 转折,承接
// props: sceneA / sceneB（时钟扫描前后景内容承载）
// === 时间特性 ===
// 刚性（不可压缩）: 弹性(clock),刚性:wave 20f(blinds)
// 弹性（可伸缩）: 其余段（入场/过渡/收尾/hold）可等比缩放
// === 适配注意 ===
// 调 DURATION 时只动弹性段 interpolate 关键帧，刚性核心帧区间保持固定帧数。
// clock-wipe｜时钟扫描擦除
// FakeDashboard A → B。30–90f 一根隐形雷达指针从 12 点方向顺时针扫一圈，
// B 页在上层用大扇形 clip-path polygon 逐帧张开；扫描沿带亮线（白核+暗描边+柔光）。
// 90–96f 亮线淡出，96f 起摘罩（B 直接满屏、无 clip-path、亮线卸载），
// 96–150f 真静止 54f ≥ 40f。帧确定，无随机。
import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';
import { G } from '../../_fixtures/Fixtures';
import { SceneContent, SceneContentData } from '../../_system/scene-content';

const CX = 960;
const CY = 540;
const R = 1400; // 大于中心到角的距离 ~1101，扇形完全盖角
const SEGS = 72; // 顶点数固定且够密，避免锯齿跳变

// 12 点方向为 0°，顺时针（屏幕坐标 y 向下）
const polar = (deg: number, r: number): [number, number] => {
  const a = (deg * Math.PI) / 180;
  return [CX + r * Math.sin(a), CY - r * Math.cos(a)];
};

const fanClip = (theta: number): string => {
  const pts: string[] = [`${CX}px ${CY}px`];
  for (let i = 0; i <= SEGS; i++) {
    const [x, y] = polar((theta * i) / SEGS, R);
    pts.push(`${x.toFixed(1)}px ${y.toFixed(1)}px`);
  }
  return `polygon(${pts.join(', ')})`;
};

export interface ClockWipeProps {
  sceneA?: SceneContentData;
  sceneB?: SceneContentData;
}

export const ClockWipe: React.FC<ClockWipeProps> = ({
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
}) => {
  const frame = useCurrentFrame();

  // 30–90f 指针 0→360°，linear（时钟扫描要匀速才像雷达）
  const theta = interpolate(frame, [30, 90], [0, 360], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const wipeDone = frame >= 90;

  // 亮线：扫描期间常亮，90–96f 线性淡出，96f 起条件卸载（摘罩判例）
  const lineOpacity = interpolate(frame, [90, 96], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const lineMounted = frame >= 30 && frame < 96;

  const [x2, y2] = polar(theta, R);

  return (
    <AbsoluteFill style={{ background: G.panel }}>
      {/* 底层：A 页。擦完后卸载（上层 B 已满屏） */}
      {!wipeDone && (
        <AbsoluteFill>
          <SceneContent content={sceneA} />
        </AbsoluteFill>
      )}

      {/* 上层：B 页。扫描期挂扇形 clip-path，擦完后摘罩直出 */}
      {frame >= 30 && (
        <AbsoluteFill style={wipeDone ? undefined : { clipPath: fanClip(theta) }}>
          <SceneContent content={sceneB} />
        </AbsoluteFill>
      )}

      {/* 扫描亮线：柔光 + 暗描边 + 白核，从屏心指向当前角度 */}
      {lineMounted && (
        <svg
          width={1920}
          height={1080}
          style={{ position: 'absolute', inset: 0, opacity: lineOpacity, pointerEvents: 'none' }}
        >
          {/* 柔光带（QA 后加码 1.5x：白底看不清就加深+加宽） */}
          <line x1={CX} y1={CY} x2={x2} y2={y2} stroke="rgba(255,255,255,0.35)" strokeWidth={26} strokeLinecap="round" />
          <line x1={CX} y1={CY} x2={x2} y2={y2} stroke="rgba(255,255,255,0.60)" strokeWidth={13} strokeLinecap="round" />
          {/* 暗描边：白底上"提亮"不可见，加深保证浅色区也读得出指针 */}
          <line x1={CX} y1={CY} x2={x2} y2={y2} stroke="rgba(0,0,0,0.55)" strokeWidth={9} strokeLinecap="round" />
          {/* 白核 */}
          <line x1={CX} y1={CY} x2={x2} y2={y2} stroke="rgba(255,255,255,0.95)" strokeWidth={4} strokeLinecap="round" />
        </svg>
      )}
    </AbsoluteFill>
  );
};
