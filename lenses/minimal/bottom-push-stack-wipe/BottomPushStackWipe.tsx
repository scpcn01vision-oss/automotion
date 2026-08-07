// === 可调参数 ===
// DURATION: 180（总帧数，可调；弹性段随 DURATION 等比缩放）
// 色彩: 走纸墨 G 色板（src/_fixtures/Fixtures.tsx）——文字 G.ink / 背景 G.bg / 强调 G.accent
// 功能: 转折
// props: chapters（连推章节：底色 + 窗口卡内容）
// === 时间特性 ===
// 刚性（不可压缩）: 刚性:推入30f
// 弹性（可伸缩）: 其余段（入场/过渡/收尾/hold）可等比缩放
// === 适配注意 ===
// 调 DURATION 时只动弹性段 interpolate 关键帧，刚性核心帧区间保持固定帧数。
// bottom-push-stack-wipe —— slack-promo 22–27s
// 换章手法：新场景连底色整屏从底边向上推入，把旧场景顶出画外，
// 连推三章（三种饱和底色，每章中央钉一张灰阶窗口卡随底色走）。
// 推入用重 ease-out（快进慢停）。
import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from 'remotion';
import { G } from '../../_fixtures/Fixtures';
import { FONT_STACK } from '../../_system/typography';

const H = 1080;

// 每章推入的起始帧；约 32 帧完成一次推入，随后 hold
const PUSH_STARTS = [18, 55, 92];
const PUSH_DUR = 30;

const heavyEaseOut = Easing.bezier(0.12, 0.9, 0.2, 1); // 快进慢停

const ChapterScene: React.FC<{
  color: string;
  label: string;
  value: string;
  chapter: number;
  windowTitle: string;
}> = ({ color, label, value, chapter, windowTitle }) => {
  return (
    <AbsoluteFill style={{ background: color, justifyContent: 'center', alignItems: 'center' }}>
      {/* 底色上的淡装饰条，让"底色也在动"更可读 */}
      {chapter > 0 && (
        <>
          <div style={{ position: 'absolute', top: 90, left: 120, width: 500, height: 26, borderRadius: 13, background: 'rgba(255,255,255,0.28)' }} />
          <div style={{ position: 'absolute', bottom: 110, right: 140, width: 340, height: 26, borderRadius: 13, background: 'rgba(255,255,255,0.22)' }} />
          <div style={{ position: 'absolute', top: 160, right: 220, width: 90, height: 90, borderRadius: '50%', background: 'rgba(255,255,255,0.18)' }} />
        </>
      )}
      {/* 中央钉住的灰阶窗口卡 */}
      <div style={{ boxShadow: '0 30px 80px rgba(0,0,0,0.28)', borderRadius: 18 }}>
        <div style={{ width: 860, background: G.panel, borderRadius: '18px 18px 0 0', height: 52, display: 'flex', alignItems: 'center', gap: 10, padding: '0 22px', boxSizing: 'border-box', border: `2px solid ${G.border}`, borderBottom: 'none' }}>
          {[G.bar, G.mid, G.line].map((dot, i) => (
            <div key={i} style={{ width: 16, height: 16, borderRadius: 8, background: dot }} />
          ))}
          <div style={{ marginLeft: 18, fontFamily: FONT_STACK, fontSize: 15, fontWeight: 700, color: G.ink }}>{windowTitle}</div>
        </div>
        <div
          style={{
            width: 860,
            height: 430,
            background: G.card,
            borderRadius: '0 0 18px 18px',
            padding: 34,
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: 16,
            border: `2px solid ${G.border}`,
            borderTop: 'none',
          }}
        >
          <div style={{ fontFamily: FONT_STACK, fontSize: 44, fontWeight: 800, color: G.ink, overflowWrap: 'break-word' }}>
            {label}
          </div>
          <div style={{ fontFamily: FONT_STACK, fontSize: 60, fontWeight: 800, color: G.accent }}>
            {value}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export interface PushChapter {
  color: string;
  label: string;
  value: string;
}

export interface BottomPushStackWipeProps {
  chapters?: PushChapter[];
  windowTitle?: string; // 窗口标题
}

export const BottomPushStackWipe: React.FC<BottomPushStackWipeProps> = ({
  chapters = [
    { color: G.bg, label: '概览', value: '准备中' },
    { color: G.accent, label: '指标一', value: '+18%' },
    { color: G.mid, label: '指标二', value: '2.1×' },
    { color: G.side, label: '指标三', value: '96.4%' },
  ],
  windowTitle = '概览',
}) => {
  const frame = useCurrentFrame();
  // 每章的推入进度
  const progress = PUSH_STARTS.map((s) =>
    interpolate(frame, [s, s + PUSH_DUR], [0, 1], {
      extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: heavyEaseOut,
    })
  );
  return (
    <AbsoluteFill style={{ overflow: 'hidden', background: G.bg }}>
      {chapters.map((c, i) => {
        // 第 i 章的位移 = 自己被推入的进度 + 被后续章顶出的进度
        const pushedIn = i === 0 ? 1 : progress[i - 1]; // 自己进入
        const pushedOut = i < chapters.length - 1 ? progress[i] : 0; // 被下一章顶出
        const y = (1 - pushedIn) * H - pushedOut * H;
        if (y <= -H || y >= H) return null;
        return (
          <AbsoluteFill key={i} style={{ transform: `translateY(${y}px)` }}>
            <ChapterScene color={c.color} label={c.label} value={c.value} chapter={i} windowTitle={windowTitle} />
            {/* 推入时上缘接缝阴影，强化"顶出"的物理感 */}
            {i > 0 && (
              <div style={{ position: 'absolute', top: -40, left: 0, right: 0, height: 40, background: 'linear-gradient(to top, rgba(0,0,0,0.30), rgba(0,0,0,0))', opacity: pushedIn < 1 ? 1 : 0 }} />
            )}
          </AbsoluteFill>
        );
      })}
    </AbsoluteFill>
  );
};
