// === 可调参数 ===
// DURATION: 180（总帧数，可调；弹性段随 DURATION 等比缩放）
// 色彩: 走纸墨 G 色板（src/_fixtures/Fixtures.tsx）——文字 G.ink / 背景 G.bg / 强调 G.accent
// 功能: 承接
// props: sceneA / sceneB（前后景内容承载 rows/image）
// === 时间特性 ===
// 策略: 弹刚 ShotTime（整段弹性）
// 刚性（不可压缩）: 无
// 弹性（可伸缩）: 全程可等比缩放（时长适配语音）
// === 适配注意 ===
// 段长不足 60f 时回退原始帧（动画按原速、可能被截断）。
// line-carry-transition｜线条接力横移转场（Catch Me If You Can 图形接力）
// 世界宽 3840（A 左半 / B 右半）。0–24f 卡 A 底部 6px ink 进度条走满；
// 24–34f 进度条末端延伸成横线冲出卡右缘；34–94f 镜头整体左移 1920px
// （Easing.inOut(cubic)，60f），线与镜头同速延伸，笔头始终在画面偏右；
// 94–112f 线拐直角围出 560×330 卡框（一条 path 全程 evolve，dashoffset 生长）；
// 112–124f 框闭合后 B 卡内容淡入 12f。124–160f 真静止 36f ≥ 35f。
// 帧确定，无随机；笔头墨点 118f 起条件卸载（摘罩判例）。
import React from 'react';
import { AbsoluteFill, interpolate, Easing } from 'remotion';
import { G } from '../../_fixtures/Fixtures';
import { SceneContentData } from '../../_system/scene-content';
import { FONT_STACK } from '../../_system/typography';

import { useShotFrame } from '../../../engine/useShotFrame';
import type { ShotTime } from '../../../engine/time';

// 时长画像：整段弹性（2026-08-14 精修）
const SHOT_TIME: ShotTime = {
  segments: [{ from: 0, to: 180, mode: 'elastic', minFrames: 60 }],
  minFrames: 60,
};

// ---- 世界几何（一条折线：进度条 + 横线 + 直角 + 矩形框）----
// M 400,705 → 2600,705（进度 560 + 冲出 1640）→ 上 2600,375 → 右 3160,375
// → 下 3160,705 → 左回 2600,705 闭合。总长 2200+330+560+330+560 = 3980。
const PATH = 'M 400 705 L 2600 705 L 2600 375 L 3160 375 L 3160 705 L 2600 705';
const SEGS: Array<[number, number, number, number, number]> = [
  [400, 705, 2600, 705, 2200],
  [2600, 705, 2600, 375, 330],
  [2600, 375, 3160, 375, 560],
  [3160, 375, 3160, 705, 330],
  [3160, 705, 2600, 705, 560],
];
const TOTAL = 3980;

// 笔头坐标：按已画长度沿折线取点
const tipAt = (drawn: number): [number, number] => {
  let d = Math.max(0, Math.min(drawn, TOTAL));
  for (const [x1, y1, x2, y2, len] of SEGS) {
    if (d <= len) {
      const t = d / len;
      return [x1 + (x2 - x1) * t, y1 + (y2 - y1) * t];
    }
    d -= len;
  }
  return [2600, 705];
};

export interface LineCarryTransitionProps {
  sceneA?: SceneContentData;
  sceneB?: SceneContentData;
}

const SideScene: React.FC<{ content: SceneContentData; titleOnly?: boolean }> = ({ content, titleOnly }) => {
  if (titleOnly) {
    return (
      <div style={{ fontFamily: FONT_STACK, fontWeight: 800, fontSize: 56, color: G.ink, letterSpacing: -1 }}>
        {content.title ?? ''}
      </div>
    );
  }
  return (
    <div
      style={{
        width: 560,
        height: 330,
        background: G.card,
        border: `2px solid ${G.border}`,
        borderRadius: 16,
        padding: 24,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 12,
      }}
    >
      {(content.rows ?? []).map((r, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', borderBottom: i < (content.rows ?? []).length - 1 ? `1px solid ${G.line}` : 'none', padding: '8px 0' }}>
          <span style={{ fontFamily: FONT_STACK, fontSize: 22, fontWeight: 600, color: G.ink, overflowWrap: 'break-word' }}>{r.label}</span>
          <span style={{ marginLeft: 'auto', fontFamily: FONT_STACK, fontSize: 24, fontWeight: 800, color: G.accent }}>{r.value}</span>
        </div>
      ))}
    </div>
  );
};

export const LineCarryTransition: React.FC<LineCarryTransitionProps> = ({
  sceneA = {
    title: 'Scene A',
    type: 'rows',
    rows: [
      { label: '指标一', value: '+18%' },
      { label: '指标二', value: '2.1×' },
      { label: '指标三', value: '96.4%' },
    ],
  },
  sceneB = {
    title: 'Scene B',
    type: 'rows',
    rows: [
      { label: '节点', value: '4/4' },
      { label: '延迟', value: '42ms' },
      { label: '可用性', value: '99.98%' },
    ],
  },
}) => {
  const frame = useShotFrame(SHOT_TIME);

  // 镜头：34–94f 左移 1920px，inOut cubic
  const cam = interpolate(frame, [34, 94], [0, 1920], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // 已画长度：三段接力（进度条 → 冲出 → 与镜头同速 → 收框）
  let drawn: number;
  if (frame < 24) {
    drawn = interpolate(frame, [0, 24], [0, 560], {
      easing: Easing.out(Easing.cubic),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
  } else if (frame < 34) {
    drawn = interpolate(frame, [24, 34], [560, 1100], {
      extrapolateRight: 'clamp',
    });
  } else if (frame < 94) {
    drawn = 1100 + cam; // 与镜头同速延伸，笔头稳在画面偏右
  } else {
    drawn = interpolate(frame, [94, 112], [3020, TOTAL], {
      easing: Easing.out(Easing.cubic),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
  }

  // B 卡内容：框闭合(112f)后淡入 12f
  const contentOpacity = interpolate(frame, [112, 124], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // 笔头墨点：全程随笔走，112–118f 线性消散，118f 起条件卸载
  const tipMounted = frame < 118;
  const tipOpacity = interpolate(frame, [112, 118], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const [tx, ty] = tipAt(drawn);

  return (
    <AbsoluteFill style={{ background: G.bg, overflow: 'hidden' }}>
      {/* 世界容器：3840 宽，整体横移 = 镜头跟线走 */}
      <div
        style={{
          position: 'absolute',
          width: 3840,
          height: 1080,
          transform: `translateX(${-cam}px)`,
        }}
      >
        {/* B 半世界底色略浅，卖出"新世界" */}
        <div style={{ position: 'absolute', left: 1920, top: 0, width: 1920, height: 1080, background: G.panel }} />

        {/* 场景 A：标题 + 卡 + 进度条轨道（ink 填充即 path 本体） */}
        <div style={{ position: 'absolute', left: 400, top: 250 }}>
          <SideScene content={sceneA} titleOnly />
        </div>
        <div style={{ position: 'absolute', left: 400, top: 350 }}>
          <SideScene content={sceneA} />
        </div>
        <div style={{ position: 'absolute', left: 400, top: 702, width: 560, height: 6, borderRadius: 3, background: G.line }} />

        {/* 一条线全程 evolve：dasharray/dashoffset 生长 */}
        <svg width={3840} height={1080} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <path
            d={PATH}
            fill="none"
            stroke={G.ink}
            strokeWidth={6}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={TOTAL}
            strokeDashoffset={TOTAL - drawn}
          />
          {tipMounted && <circle cx={tx} cy={ty} r={11} fill={G.ink} opacity={tipOpacity} />}
        </svg>

        {/* 场景 B：框(2600,375–3160,705)由线画成，内容淡入 */}
        <div
          style={{
            position: 'absolute',
            left: 2600,
            top: 375,
            width: 560,
            height: 330,
            opacity: contentOpacity,
          }}
        >
          <SideScene content={sceneB} />
        </div>
        <div style={{ position: 'absolute', left: 2600, top: 275, opacity: contentOpacity }}>
          <SideScene content={sceneB} titleOnly />
        </div>
      </div>
    </AbsoluteFill>
  );
};
