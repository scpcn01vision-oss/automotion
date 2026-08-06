// === 可调参数 ===
// DURATION: 180（总帧数，可调；弹性段随 DURATION 等比缩放）
// 色彩: 走纸墨 G 色板（src/_fixtures/Fixtures.tsx）——文字 G.ink / 背景 G.bg / 强调 G.accent
// 功能: 收束
// props: logoText（LOGO 文字）、sceneA / sceneB（彩蛋/上一镜内容承载）
// === 时间特性 ===
// 刚性（不可压缩）: 无（全程弹性）
// 弹性（可伸缩）: 全程可等比缩放（时长适配语音）
// === 适配注意 ===
// 调 DURATION 时只动弹性段 interpolate 关键帧，刚性核心帧区间保持固定帧数。
// logo-sting-button —— 收尾按钮镜头（button ending）
// 上一镜收黑 → 黑场 → LOGO 入场定住（观众以为结束）→ 12f UI 特写彩蛋硬切 →
// 硬切回黑底 LOGO 定格。节奏是全部：彩蛋段短促像眨眼。收尾真静止 ≥40f。
import React from 'react';
import { useCurrentFrame, interpolate, Easing } from 'remotion';
import { G } from '../../_fixtures/Fixtures';
import { SceneContent, SceneContentData } from '../../_system/scene-content';
import { FONT_STACK } from '../../_system/typography';

// 时间轴（30fps，共 142f）
const T = {
  shotAEnd: 24,     // 0–24f 上一镜（B），f14–24 压暗到纯黑
  darkenStart: 14,
  blackEnd: 30,     // 24–30f 黑场 6f
  logoInEnd: 40,    // 30–40f LOGO 入场 10f
  holdEnd: 70,      // 40–70f 定住 30f（观众以为结束）
  eggEnd: 82,       // 70–82f 彩蛋硬切 12f
  total: 142,       // 82–142f 黑底 LOGO 真静止 60f
};

const LogoLockup: React.FC<{ opacity: number; scale: number; logoText: string }> = ({ opacity, scale, logoText }) => (
  <div style={{
    width: 1920, height: 1080, background: G.side,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }}>
    <div style={{
      display: 'flex', alignItems: 'center', gap: 44,
      opacity, transform: `scale(${scale})`,
    }}>
      <div style={{
        width: 120, height: 120, borderRadius: 28, background: G.card,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {/* 方块内一个黑色小标记，避免纯白块太空 */}
        <div style={{ width: 44, height: 44, borderRadius: 12, background: G.side }} />
      </div>
      <div style={{
        fontFamily: FONT_STACK, fontWeight: 800,
        fontSize: 90, color: G.card, letterSpacing: 2,
      }}>
        {logoText}
      </div>
    </div>
  </div>
);

export interface LogoStingButtonProps {
  logoText?: string;
  sceneA?: SceneContentData;
  sceneB?: SceneContentData;
}

export const LogoStingButton: React.FC<LogoStingButtonProps> = ({
  logoText = 'ACME',
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

  // —— 段 1：上一镜（FakeDashboard B）压暗收黑 ——
  if (frame < T.shotAEnd) {
    const dark = interpolate(frame, [T.darkenStart, T.shotAEnd - 1], [0, 1], {
      extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
      easing: Easing.in(Easing.cubic),
    });
    return (
      <div style={{ width: 1920, height: 1080, background: G.side, position: 'relative', overflow: 'hidden' }}>
        <SceneContent content={sceneB} />
        <div style={{ position: 'absolute', inset: 0, background: G.side, opacity: dark }} />
      </div>
    );
  }

  // —— 段 2：黑场 6f ——
  if (frame < T.blackEnd) {
    return <div style={{ width: 1920, height: 1080, background: G.side }} />;
  }

  // —— 段 4：彩蛋硬切 12f（variant A 按钮区 2.4x 裁切 + 角落小圆点 tick 闪 2f）——
  if (frame >= T.holdEnd && frame < T.eggEnd) {
    const egg = frame - T.holdEnd; // 0..11
    // tick 圆点：第 4–5f 亮 2f，像眨眼
    const tickOn = egg >= 4 && egg < 6;
    return (
      <div style={{ width: 1920, height: 1080, background: G.panel, position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', inset: 0,
          // 2.4x 放大：把第 1 张卡片底部"按钮行"（头像圆+文字条）平移到画面中心
          // 原坐标 (839, 531)（第 2 列卡片底部头像圆+文字条）→ 屏幕中心 (960, 540)
          // 选中列卡片可把左侧深色 sidebar 完全推出画面，特写更纯粹
          transform: 'translate(-1054px, -734px) scale(2.4)', transformOrigin: '0 0',
        }}>
          <SceneContent content={sceneA} />
        </div>
        {tickOn && (
          <div style={{
            position: 'absolute', right: 90, bottom: 80,
            width: 56, height: 56, borderRadius: 28, background: G.ink,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ width: 20, height: 20, borderRadius: 10, background: G.card }} />
          </div>
        )}
      </div>
    );
  }

  // —— 段 3 + 段 5：黑底 LOGO（入场 → 定住 → 彩蛋后定格收尾，真静止）——
  const opacity = interpolate(frame, [T.blackEnd, T.logoInEnd], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const scale = interpolate(frame, [T.blackEnd, T.logoInEnd], [0.96, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  return <LogoLockup opacity={opacity} scale={scale} logoText={logoText} />;
};
