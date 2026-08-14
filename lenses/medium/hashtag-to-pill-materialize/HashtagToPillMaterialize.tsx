// === 可调参数 ===
// DURATION: 180（总帧数，可调；弹性段随 DURATION 等比缩放）
// 色彩: 走纸墨 G 色板（src/_fixtures/Fixtures.tsx）——文字 G.ink / 背景 G.bg / 强调 G.accent
// 功能: 展开
// props: hashtag（打字词）、pillText（胶囊词）、title（成品页标题）、body（成品页正文行）
// === 时间特性 ===
// 刚性（不可压缩）: 刚性:type 8f,move 66→80f
// 弹性（可伸缩）: 其余段（入场/过渡/收尾/hold）可等比缩放
// === 适配注意 ===
// 调 DURATION 时只动弹性段 interpolate 关键帧，刚性核心帧区间保持固定帧数。
// hashtag-to-pill-materialize（bear-app 18–21.5s 重做版，按原片密帧逐帧对照）
// 原片实测节奏（25fps 逐帧）：
//  1) 白底居中打字 "#music"：几何无衬线（Futura 气质）、中灰墨色、红色实心光标恒亮不闪、人手节奏
//  2) 实体化 = 1 帧硬切：文字+光标 → 宽大浅灰无描边胶囊 + 灰色双八分音符图标 + "music"（字号不变，#被图标替换）
//  3) 停约 0.6s → 整体平滑缩小（→~0.55x）并左移落到页面标签位（约 0.55s，easeInOut）
//  4) 再 1 帧硬切揭示成品笔记页：奶油底、墨绿大标题 "My favorite bands"、胶囊换成鼠尾草绿、正文三行——
//     原片没有"胶囊飞入下方滑入卡片"的段落（批次 8 的飞行段为杜撰，已砍）
import React from 'react';
import { AbsoluteFill, interpolate, Easing, useCurrentFrame } from 'remotion';
import { G } from '../../_fixtures/Fixtures';
import { FONT_STACK } from '../../_system/typography';
import { useShotFrame } from '../../../engine/useShotFrame';
import type { ShotTime } from '../../../engine/time';

// 时长画像（lens-timings 无此镜头；按文件头「刚性:type 8f,move 66→80f」标）
const SHOT_TIME: ShotTime = {
  segments: [
    { from: 0, to: 66, mode: 'elastic', minFrames: 10 },
    { from: 66, to: 80, mode: 'rigid' },
    { from: 80, to: 180, mode: 'elastic', minFrames: 16 },
  ],
  minFrames: 92,
};

// ---- mulberry32（仅用于打字节奏的人手抖动，确定性）----
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// 打字起点 & 每字间隔（帧），4–8 帧带抖动，模拟原片真人节奏
const TYPE_START = 8;
const rand = mulberry32(20260717);
const typeAt = (text: string): number[] => {
  const at: number[] = [];
  let f = TYPE_START;
  for (let i = 0; i < text.length; i++) {
    at.push(f);
    f += 4 + Math.floor(rand() * 3); // 4–6 帧（原片 ~6字/秒）
  }
  return at;
};

// ---- 时间轴（30fps，共 132 帧，节奏对齐原片 18–21.5s）----
const MORPH = 48;       // 1 帧硬切实体化（打完 hold ~0.5s，原片 0.45s）
const MOVE_START = 66;  // 胶囊开始缩小左移（morph 后 0.6s，原片同）
const MOVE_END = 80;    // 落位（0.47s，原片 ~0.45s）
const REVEAL = 83;      // 1 帧硬切揭示成品页，之后静置收尾

// ---- 几何（1920x1080，等比换算自原片 1280x720 实测像素）----
const FS = 132;                       // 打字/胶囊文字字号（原片 glyph 等高换算）
const HERO = { x: 960, y: 540 };      // 大胶囊中心
const PILL_W = 740, PILL_H = 236;     // 原片实测 493x157 @720p ×1.5
const END_SCALE = 0.554;              // 落位缩放（原片 273/493）
const SLOT_Y = 473;
const ALIGN_X = 160;                  // 成品页左对齐基准：标题/正文/落位胶囊左缘统一
const isFullW = (c: string) => /[\u2E80-\u9FFF\uF900-\uFAFF\uFF00-\uFFEF\u3000-\u303F]/.test(c);

// v7 重做：原版音乐双音符图标改为可配字符符号（如 ¥/#/♪），
// 字符字号与胶囊文字一致，避免内容主题不符且大小失调（段 15 计费用 ¥）。
const SimpleIcon: React.FC<{ ch: string; color: string }> = ({ ch, color }) => (
  <span style={{ fontSize: FS, fontWeight: 800, color, lineHeight: 1, flexShrink: 0 }}>{ch}</span>
);

// 胶囊（大字号绘制，整体 transform 缩放，保证实体化前后文字原位等大）
const Pill: React.FC<{ bg: string; iconColor: string; textColor: string; text: string; icon: string; width: number }> = ({
  bg,
  iconColor,
  textColor,
  text,
  icon,
  width,
}) => (
  <div style={{
    // v7 修复：胶囊宽度按文本自适应（中文全角按 FS、英文按 0.55×FS），不低于原最小宽
    width,
    height: PILL_H, borderRadius: PILL_H / 2, background: bg,
    display: 'flex', alignItems: 'center', paddingLeft: 96, boxSizing: 'border-box', gap: 66,
  }}>
    <SimpleIcon ch={icon} color={iconColor} />
    <span style={{ fontSize: FS, fontWeight: 500, color: textColor, letterSpacing: 2 }}>{text}</span>
  </div>
);

export interface HashtagToPillMaterializeProps {
  hashtag?: string;
  pillText?: string;
  icon?: string; // 胶囊图标字符（默认 #，段 15 用 ¥）
  title?: string;
  body?: string[]; // 成品页要点（短词，建议 ≤6 字，排版固定）
  revealAtSec?: number; // 口播对齐：标签实体化（MORPH）段内秒；提供后打字阶段压缩到该时刻前
}

export const HashtagToPillMaterialize: React.FC<HashtagToPillMaterializeProps> = ({
  hashtag = '#music', // 默认值保持原版参考 demo，段内容一律走 props 隔离
  pillText = 'music',
  icon = '♪',
  title = 'My favorite bands',
  body = [
    'I want to share a few of my favorite bands',
    'and the song that I always listen when driving',
    'to home. Welcome. Bring headphones.',
  ],
  revealAtSec,
}) => {
  const frameShot = useShotFrame(SHOT_TIME);
  const realFrame = useCurrentFrame();
  const cueMode = revealAtSec !== undefined;
  const frame = cueMode ? realFrame : frameShot;
  const MORPH_F = cueMode ? Math.round(revealAtSec * 30) : MORPH;
  const preF = cueMode ? Math.min(1, (realFrame / 30) / (revealAtSec ?? 1)) * MORPH : frame;
  const MOVE_START_F = MORPH_F + (MOVE_START - MORPH);
  const MOVE_END_F = MORPH_F + (MOVE_END - MORPH);
  const REVEAL_F = MORPH_F + (REVEAL - MORPH);
  const TEXT = hashtag;
  const TYPE_AT = typeAt(TEXT);

  // 胶囊自适应宽度 + 落位中心 x（左缘对齐标题，短文本接近原版 361）
  const pillW = Math.max(
    PILL_W,
    96 + 66 + 104 + [...pillText].reduce((s, c) => s + (isFullW(c) ? FS : FS * 0.55), 0) + 64,
  );
  const slotX = ALIGN_X + (pillW * END_SCALE) / 2;

  // ---- 打字 ----
  const typedCount = TYPE_AT.filter((t) => preF >= t).length;
  const typed = TEXT.slice(0, typedCount);

  // ---- 缩小左移 ----
  const moveT = interpolate(frame, [MOVE_START_F, MOVE_END_F], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.bezier(0.5, 0, 0.25, 1),
  });
  const px = interpolate(moveT, [0, 1], [HERO.x, slotX]);
  const py = interpolate(moveT, [0, 1], [HERO.y, SLOT_Y]);
  const ps = interpolate(moveT, [0, 1], [1, END_SCALE]);
  // 实体化瞬间极轻微落定（原片近乎硬切，仅 3 帧 1.03→1，避免死板）
  const settle = interpolate(frame, [MORPH_F, MORPH_F + 3], [1.03, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.quad),
  });

  const revealed = frame >= REVEAL_F;

  return (
    <AbsoluteFill style={{ background: revealed ? G.panel : G.bg, fontFamily: FONT_STACK }}>
      {/* 成品页（硬切揭示，之后全静） */}
      {revealed && (
        <>
          <div
            style={{
              position: 'absolute',
              left: 160,
              top: 168,
              fontSize: 122,
              fontWeight: 700,
              color: G.accent,
              letterSpacing: 0.5,
            }}
          >
            {title}
          </div>
          <div
            style={{
              position: 'absolute',
              left: ALIGN_X,
              top: 618,
              fontSize: 70,
              fontWeight: 500,
              color: G.ink,
              lineHeight: 1.33,
              letterSpacing: 0.3,
            }}
          >
            {body.map((b, i) => (
              <span key={i}>
                {b}
                {i < body.length - 1 && <br />}
              </span>
            ))}
          </div>
        </>
      )}

      {/* 打字层：文字 + 恒亮红光标（原片光标不闪烁），实体化帧整体消失 */}
      {frame < MORPH_F && (
        <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: FS, fontWeight: 500, color: G.ink, letterSpacing: 2, whiteSpace: 'pre' }}>
              {typed}
            </span>
            <span style={{
              display: 'inline-block', width: 7, height: 150,
              background: G.accent, marginLeft: 8, borderRadius: 2,
            }} />
          </div>
        </AbsoluteFill>
      )}

      {/* 胶囊层：实体化 1 帧硬切出现 → hold → 缩小左移落位 → 揭示帧换鼠尾草绿 */}
      {frame >= MORPH_F && (
        <div style={{
          position: 'absolute', left: 0, top: 0,
          // origin 必须是 0 0：translate 先把原点送到目标中心，scale 绕该点缩放，
          // 否则默认 50% 50% 会让落位时中心漂移 (1-s)*半宽
          transformOrigin: '0 0',
          transform: `translate(${px}px, ${py}px) scale(${ps * settle})`,
        }}>
          <div style={{ transform: 'translate(-50%, -50%)' }}>
            {revealed
              ? <Pill bg={G.panel} iconColor={G.accent} textColor={G.ink} text={pillText} icon={icon} width={pillW} />
              : <Pill bg={G.card} iconColor={G.mid} textColor={G.ink} text={pillText} icon={icon} width={pillW} />}
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};
