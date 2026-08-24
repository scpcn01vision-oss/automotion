// === 可调参数 ===
// DURATION: 180（总帧数，可调；弹性段随 DURATION 等比缩放）
// 色彩: 走纸墨 G 色板（src/_fixtures/Fixtures.tsx）——文字 G.ink / 背景 G.bg / 强调 G.accent
// 功能: 转折
// props: sceneA / sceneB（漏光前后景内容承载）、nextTitle（新页标题）
// === 时间特性 ===
// 策略: 弹刚 ShotTime（整段弹性）
// 刚性（不可压缩）: 无（全程弹性）
// 弹性（可伸缩）: 全程可等比缩放（时长适配语音）
// === 适配注意 ===
// 调 DURATION 时只动弹性段 interpolate 关键帧，刚性核心帧区间保持固定帧数。
import React from 'react';
import { AbsoluteFill, Easing, interpolate } from 'remotion';
import { G } from '../../_fixtures/Fixtures';
import { useShotFrame } from '../../../engine/useShotFrame';
import type { ShotTime } from '../../../engine/time';

// 时长画像（lens-timings 无此镜头；按文件头「全程弹性」+ 关键帧 ~25 标）
const SHOT_TIME: ShotTime = {
  segments: [{ from: 0, to: 180, mode: 'elastic', minFrames: 25 }],
  minFrames: 25,
};
import { SceneContent, SceneContentData } from '../../_system/scene-content';
import { FONT_STACK } from '../../_system/typography';

// light-leak-burn〔转场〕：一团琥珀橙柔光从右上角斜扫入画，亮度顶峰时
// 吞掉旧画面约七成（高光溢出、对比度被冲淡），光峰帧后切新页藏切点，
// 光退散时新页已在光下就位——比白闪柔、有方向、有温度。
// 节拍：0–25 建立旧页 hold；25–52 光斜扫入、爬向峰值；52 峰值帧切页；
// 52–95 光沿对角线退出、强度衰减；95–130 新页静止 hold。

export interface LightLeakBurnProps {
  sceneA?: SceneContentData;
  sceneB?: SceneContentData;
  nextTitle?: string;
  revealAtSec?: number; // 口播对齐：光峰切页时刻（段内秒）；提供后忽略默认 52f
}

export const LightLeakBurn: React.FC<LightLeakBurnProps> = ({
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
  nextTitle = 'Next',
  revealAtSec,
}) => {
  const frame = useShotFrame(SHOT_TIME);
  const PEAK = revealAtSec !== undefined ? Math.round(revealAtSec * 30) : 52; // 光峰帧 = 藏切点

  // 光团沿对角线的位移进度：右上外 → 左下外，贯穿 25–95
  const sweep = interpolate(frame, [25, 95], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.4, 0, 0.3, 1),
  });

  // 光强包络：25–PEAK 爬升（ease-in 有蓄力感），PEAK–95 收敛（ease-out 余温）
  const rise = interpolate(frame, [25, PEAK], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.in(Easing.quad),
  });
  const fall = interpolate(frame, [PEAK, 95], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const intensity = frame <= PEAK ? rise : fall;

  // 光团中心：从画面右上外侧斜扫到左下外侧（有方向的漏光）
  const cx = interpolate(sweep, [0, 1], [2350, -650]);
  const cy = interpolate(sweep, [0, 1], [-500, 1500]);

  // 三团琥珀光的偏移与直径（seed 正弦哈希做微差，避免完美同心）
  const blobs = [0, 1, 2].map((i) => {
    const j1 = (Math.sin(i * 127.3) * 43758) % 1; // -1..1 小数
    const j2 = (Math.sin(i * 311.7) * 27183) % 1;
    return {
      dx: i * 260 - 260 + j1 * 90, // 沿扫掠方向拖尾排布
      dy: i * 200 - 200 + j2 * 70,
      d: 1500 + i * 450, // 直径 1500 / 1950 / 2400
      color: ['#f6c878', '#e8a44a', '#d98a2b'][i],
      alpha: [0.95, 0.8, 0.55][i],
    };
  });

  // 峰值时页面被光冲淡：对比度降、亮度抬（旧页被"烧穿"的感觉）
  const pageFilter = `contrast(${1 - intensity * 0.45}) brightness(${1 + intensity * 0.35})`;

  // 全屏暖色罩：峰值时约 8%
  const warmWash = intensity * 0.08;

  return (
    <AbsoluteFill style={{ background: G.bg, overflow: 'hidden' }}>
      {/* 页面层：光峰帧前是旧页（网格），之后是新页（列表+标题）——切点藏在最亮处 */}
      <AbsoluteFill style={{ filter: pageFilter }}>
        {frame <= PEAK ? (
          <SceneContent content={sceneA} />
        ) : (
          <>
            <SceneContent content={sceneB} />
            <div style={{ position: 'absolute', left: '50%', top: 96, transform: 'translateX(-50%)' }}>
              <div style={{ fontFamily: FONT_STACK, fontWeight: 800, fontSize: 64, color: G.ink, letterSpacing: -1 }}>
                {nextTitle}
              </div>
            </div>
          </>
        )}
      </AbsoluteFill>

      {/* 全屏暖色罩：峰值 8%，让高光溢出带温度 */}
      <AbsoluteFill
        style={{
          background: '#e8a44a',
          opacity: warmWash,
          mixBlendMode: 'screen',
          pointerEvents: 'none',
        }}
      />

      {/* 琥珀漏光层：3 团大直径径向渐变，blur 90px，screen 叠加，沿对角线扫过 */}
      <AbsoluteFill style={{ pointerEvents: 'none' }}>
        {blobs.map((b, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: cx + b.dx - b.d / 2,
              top: cy + b.dy - b.d / 2,
              width: b.d,
              height: b.d,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${b.color} 0%, ${b.color}cc 30%, transparent 68%)`,
              filter: 'blur(90px)',
              mixBlendMode: 'screen',
              opacity: b.alpha * intensity,
            }}
          />
        ))}
        {/* 峰值核心过曝：光心一小团接近白的热核，峰值帧吞掉约七成画面 */}
        <div
          style={{
            position: 'absolute',
            left: cx - 550,
            top: cy - 550,
            width: 1100,
            height: 1100,
            borderRadius: '50%',
            background: 'radial-gradient(circle, #fff3dd 0%, #f6c878aa 45%, transparent 70%)',
            filter: 'blur(80px)',
            mixBlendMode: 'screen',
            opacity: intensity * intensity, // 只在临近峰值时才烧起来
          }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
