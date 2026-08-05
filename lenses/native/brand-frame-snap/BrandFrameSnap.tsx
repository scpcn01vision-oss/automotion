// === 可调参数 ===
// DURATION: 180（总帧数，可调；弹性段随 DURATION 等比缩放）
// 色彩: 走纸墨 G 色板（src/_fixtures/Fixtures.tsx）——文字 G.ink / 背景 G.bg / 强调 G.accent
// 功能: 宣告,承接
// props: colorA / colorB（画框翻色前后色）、labelA / labelB（模式角标）、contentA / contentB（窗口内容承载）
// === 时间特性 ===
// 刚性（不可压缩）: 无（全程弹性）
// 弹性（可伸缩）: 全程可等比缩放（时长适配语音）
// === 适配注意 ===
// 调 DURATION 时只动弹性段 interpolate 关键帧，刚性核心帧区间保持固定帧数。
// brand-frame-snap —— 一圈粗色画框先于内容出现包住全屏 → 灰阶"录屏窗口"在框内落位 →
// 停一拍 → 画框整圈 colorA→colorB 同帧硬翻色，窗口内容同帧换承载。
// 一个画框色完成章节导航/状态提示/内容切换。
import React from 'react';
import { useCurrentFrame, spring, interpolate, Img, staticFile } from 'remotion';
import { G } from '../../_fixtures/Fixtures';

const FPS = 30;
const FLIP_FRAME = 78; // 同帧硬翻色时刻

const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

export interface BrandFrameSnapContent {
  title?: string;
  type?: 'rows' | 'image';
  rows?: { label: string; value: string }[];
  image?: string;
}

export interface BrandFrameSnapProps {
  colorA?: string;
  colorB?: string;
  labelA?: string;
  labelB?: string;
  contentA?: BrandFrameSnapContent;
  contentB?: BrandFrameSnapContent;
}

// 窗口内容渲染器：标题 + 行列表（默认）/ 标题 + 圆角图片
const ContentRenderer: React.FC<{ content: BrandFrameSnapContent }> = ({ content }) => {
  const { title, type = 'rows', rows, image } = content;
  return (
    <div
      style={{
        width: 1920, height: 1080, background: G.bg, position: 'relative', overflow: 'hidden',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 44,
      }}
    >
      {title ? (
        <div style={{ fontFamily: 'Helvetica, Arial, sans-serif', fontWeight: 800, fontSize: 84, color: G.ink, letterSpacing: -1 }}>
          {title}
        </div>
      ) : null}
      {type === 'image' && image ? (
        <Img
          src={staticFile(image)}
          style={{
            width: 1400, height: 787, objectFit: 'cover', borderRadius: 20,
            border: `2px solid ${G.border}`, boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          }}
        />
      ) : (
        <div
          style={{
            width: 1400, background: G.card, border: `2px solid ${G.border}`, borderRadius: 20,
            padding: '36px 48px', display: 'flex', flexDirection: 'column',
          }}
        >
          {(rows ?? []).map((r, i) => (
            <div
              key={i}
              style={{
                display: 'flex', alignItems: 'center', padding: '18px 0',
                borderBottom: i < (rows ?? []).length - 1 ? `1px solid ${G.line}` : 'none',
              }}
            >
              <span style={{ fontSize: 30, color: G.ink, fontWeight: 600 }}>{r.label}</span>
              <span style={{ marginLeft: 'auto', fontSize: 32, color: G.accent, fontWeight: 800 }}>{r.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const BrandFrameSnap: React.FC<BrandFrameSnapProps> = ({
  colorA = G.accent,
  colorB = G.ink,
  labelA = 'DESIGN',
  labelB = 'DEV MODE',
  contentA = {
    title: '概览',
    type: 'rows',
    rows: [
      { label: '指标一', value: '+18%' },
      { label: '指标二', value: '2.1×' },
      { label: '指标三', value: '96.4%' },
    ],
  },
  contentB = {
    title: '状态',
    type: 'rows',
    rows: [
      { label: '节点', value: '4/4' },
      { label: '延迟', value: '42ms' },
      { label: '可用性', value: '99.98%' },
    ],
  },
}) => {
  const f = useCurrentFrame();
  const mode: 'design' | 'dev' = f < FLIP_FRAME ? 'design' : 'dev';
  const frameColor = mode === 'design' ? colorA : colorB;

  // 1) 画框先登场：厚度从 0 长到 44px（ease-out，前 18 帧）
  const frameGrow = easeOut(clamp01(f / 18));
  const frameW = 44 * frameGrow;

  // 2) 窗口在框内落位：从下方 + 略缩，弹簧弹入（帧 14 起）
  const drop = spring({ frame: f - 14, fps: FPS, config: { damping: 16, stiffness: 110, mass: 1 } });
  const winY = interpolate(drop, [0, 1], [560, 0]);
  const winS = interpolate(drop, [0, 1], [0.82, 1]);
  const winO = interpolate(drop, [0, 0.25], [0, 1], { extrapolateRight: 'clamp' });

  // 3) 翻色瞬间给 2 帧白闪脉冲 + 画框轻微厚度弹跳，强化"换挡"
  const sinceFlip = f - FLIP_FRAME;
  const flash = sinceFlip >= 0 && sinceFlip < 3 ? 0.55 - sinceFlip * 0.18 : 0;
  const snapPulse = sinceFlip >= 0 ? Math.exp(-sinceFlip * 0.22) * Math.cos(sinceFlip * 0.9) * 10 : 0;

  // 模式标签
  const label = mode === 'design' ? labelA : labelB;

  return (
    <div style={{ width: 1920, height: 1080, background: G.bg, position: 'relative', overflow: 'hidden' }}>
      {/* 框内内容区 */}
      <div style={{
        position: 'absolute', inset: frameW + snapPulse, background: G.bg,
        overflow: 'hidden', borderRadius: 8,
      }}>
        {/* 录屏窗口（带标题栏的窗口卡）落位 */}
        <div style={{
          position: 'absolute', left: '50%', top: '50%',
          width: 1560, height: 830,
          transform: `translate(-50%, -50%) translateY(${winY}px) scale(${winS})`,
          opacity: winO,
          borderRadius: 16, overflow: 'hidden',
          boxShadow: '0 24px 70px rgba(0,0,0,0.28)',
          border: `2px solid ${G.border}`, background: G.panel,
        }}>
          {/* 窗口标题栏 */}
          <div style={{
            height: 52, background: G.nav, borderBottom: `2px solid ${G.line}`,
            display: 'flex', alignItems: 'center', gap: 10, padding: '0 22px', boxSizing: 'border-box',
          }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{ width: 16, height: 16, borderRadius: 8, background: G.bar }} />
            ))}
            <div style={{ marginLeft: 18, height: 12, width: 260, background: G.line, borderRadius: 6 }} />
            {/* 模式徽标：随画框同帧换色换字 */}
            <div style={{
              marginLeft: 'auto', background: frameColor, color: G.card,
              fontFamily: 'Helvetica, Arial, sans-serif', fontWeight: 800, fontSize: 15,
              letterSpacing: 1.5, padding: '6px 16px', borderRadius: 8,
              opacity: winO,
            }}>
              {label}
            </div>
          </div>
          {/* 窗口内容：翻色同帧换布局 A→B */}
          <div style={{ transform: 'scale(0.81)', transformOrigin: '0 0', width: 1920, height: 1080 }}>
            <ContentRenderer content={mode === 'design' ? contentA : contentB} />
          </div>
        </div>
      </div>

      {/* 品牌色画框：用 4 条实体边而非 border，翻色是纯 background 同帧硬切 */}
      {([
        { left: 0, top: 0, right: 0, height: frameW + snapPulse },
        { left: 0, bottom: 0, right: 0, height: frameW + snapPulse },
        { left: 0, top: 0, bottom: 0, width: frameW + snapPulse },
        { right: 0, top: 0, bottom: 0, width: frameW + snapPulse },
      ] as React.CSSProperties[]).map((pos, i) => (
        <div key={i} style={{ position: 'absolute', background: frameColor, ...pos }} />
      ))}

      {/* 画框上的模式角标（左上，嵌在框带里） */}
      <div style={{
        position: 'absolute', left: 70, top: 0, height: frameW + snapPulse,
        display: 'flex', alignItems: 'center',
        fontFamily: 'Helvetica, Arial, sans-serif', fontWeight: 800,
        fontSize: 22, letterSpacing: 3, color: G.card,
        opacity: frameGrow,
      }}>
        {label}
      </div>

      {/* 翻色白闪脉冲 */}
      {flash > 0 && (
        <div style={{ position: 'absolute', inset: 0, background: '#ffffff', opacity: flash }} />
      )}
    </div>
  );
};
