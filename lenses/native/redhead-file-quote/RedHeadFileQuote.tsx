// === 可调参数 ===
// DURATION: 180（总帧数，可调；弹性段随 DURATION 等比缩放）
// 色彩: 纸墨 G 色板 + 红头朱红（公文标准色，纸墨化暗朱红 #a83232）
// 功能: 举证
// 描述: 红头引文——官方文件/政策原文引用（红头文件样式）
// === 时间特性 ===
// 刚性（不可压缩）: 无（全程弹性）
// 弹性（可伸缩）: 全程可等比缩放（时长适配语音）
// === 适配注意 ===
// 用于引用官方文件/政策原文；正文行数任意，逐行浮现。
import React from 'react';
import { AbsoluteFill, interpolate, Easing, useCurrentFrame } from 'remotion';
import { G } from '../../_fixtures/Fixtures';
import { useShotFrame } from '../../../engine/useShotFrame';
import type { ShotTime } from '../../../engine/time';

// 时长画像（lens-timings 无此镜头；按文件头「全程弹性」+ 关键帧 ~30 标）
const SHOT_TIME: ShotTime = {
  segments: [{ from: 0, to: 180, mode: 'elastic', minFrames: 30 }],
  minFrames: 30,
};
import { FONT_STACK } from '../../_system/typography';

const RED = '#a83232'; // 红头朱红（纸墨化暗朱红，公文标准色）

export interface RedHeadFileQuoteProps {
  organ?: string; // 发文机关名（朱红大字）
  docTitle?: string; // 文件标题
  docNo?: string; // 文号/条款号（如「第 37 句」）
  body?: string[]; // 正文行
  tag?: string; // 底部来源角标
  /** 口播锚点：正文逐行浮现的段内秒（与 body 一一对应）；提供后卡框架/红头/标题在段开头浮现、正文行踩点浮现 */
  cueSec?: number[];
}

export const RedHeadFileQuote: React.FC<RedHeadFileQuoteProps> = ({
  organ = '北京市发展和改革委员会',
  docTitle = '《北京市加快智能体引领发展的若干措施》',
  docNo = '第 37 句',
  body = ['鼓励创新主体从 Token 消耗量计费转向价值计费。'],
  tag = '原文引用',
  cueSec,
}) => {
  const frameShot = useShotFrame(SHOT_TIME);
  const realFrame = useCurrentFrame();
  const cues = cueSec && cueSec.length === body.length ? cueSec.map((s) => Math.round(s * 30)) : null;
  const cueMode = !!cues;
  const frame = cueMode ? realFrame : frameShot;
  // 卡框架/红头/标题：段开头固定浮现（不随锚点平移，避免前段空白）；正文逐行按 cueSec 踩点浮现；无 cueSec 回落弹刚

  // 卡片浮现
  const cardT = interpolate(frame, [0, 14], [0, 1], {
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  // 红头：机关名 + 双红线
  const headT = interpolate(frame, [12, 28], [0, 1], {
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const lineW = interpolate(frame, [18, 34], [0, 1], {
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  // 标题 + 文号
  const titleT = interpolate(frame, [30, 44], [0, 1], {
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  // 正文逐行
  const bodyStart = 46; // 无 cue 时正文起点（弹刚）
  // 来源角标
  const lastStart = cues ? cues[cues.length - 1] : bodyStart + (body.length - 1) * 12;
  const tagT = interpolate(frame, [lastStart + 8, lastStart + 20], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ background: G.bg, justifyContent: 'center', alignItems: 'center' }}>
      <div
        style={{
          width: 1440,
          background: G.card,
          border: `2px solid ${G.border}`,
          borderRadius: 18,
          boxShadow: '0 18px 50px rgba(44,36,22,0.14)',
          padding: '72px 96px 56px',
          opacity: cardT,
          transform: `translateY(${(1 - cardT) * 30}px)`,
        }}
      >
        {/* 红头 */}
        <div style={{ opacity: headT, textAlign: 'center' }}>
          <div style={{ fontFamily: FONT_STACK, fontWeight: 800, fontSize: 52, color: RED, letterSpacing: 8 }}>
            {organ}
          </div>
          <div
            style={{
              marginTop: 26,
              height: 2,
              background: RED,
              transform: `scaleX(${lineW})`,
              transformOrigin: 'center',
            }}
          />
          <div
            style={{
              marginTop: 4,
              height: 6,
              width: 900,
              marginLeft: 'auto',
              marginRight: 'auto',
              borderRadius: 3,
              background: RED,
              transform: `scaleX(${lineW})`,
              transformOrigin: 'center',
            }}
          />
        </div>
        {/* 标题 + 文号 */}
        <div style={{ opacity: titleT, marginTop: 44, textAlign: 'center' }}>
          <div style={{ fontFamily: FONT_STACK, fontWeight: 700, fontSize: 40, color: G.ink }}>
            {docTitle}
          </div>
          <div style={{ marginTop: 16, fontFamily: FONT_STACK, fontSize: 26, color: G.mid, letterSpacing: 4 }}>
            {docNo}
          </div>
        </div>
        {/* 正文 */}
        <div style={{ marginTop: 48 }}>
          {body.map((line, i) => {
            const bt = interpolate(
              frame,
              [cues ? cues[i] : bodyStart + i * 12, (cues ? cues[i] : bodyStart + i * 12) + 10],
              [0, 1],
              { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.quad) },
            );
            return (
              <div
                key={i}
                style={{
                  fontFamily: FONT_STACK,
                  fontSize: 34,
                  fontWeight: 600,
                  color: G.ink,
                  lineHeight: 1.9,
                  letterSpacing: 1,
                  opacity: bt,
                  transform: `translateY(${(1 - bt) * 16}px)`,
                }}
              >
                {line}
              </div>
            );
          })}
        </div>
        {/* 来源角标 */}
        <div style={{ opacity: tagT, marginTop: 40, display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ fontFamily: FONT_STACK, fontSize: 22, color: RED, fontWeight: 700, letterSpacing: 3 }}>
            {tag}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
