// === 可调参数 ===
// DURATION: 180（总帧数，可调；弹性段随 DURATION 等比缩放）
// 色彩: 走纸墨 G 色板（src/_fixtures/Fixtures.tsx）——文字 G.ink / 背景 G.bg / 强调 G.accent
// 功能: 展开,序列
// props: subject（固定主题词）、items（词条数组：word + 卡一一对应，2–5 项）、cueSec（口播对齐）
// 布局: 左侧卡片墙（rows 文字卡 / image 图片卡；image 卡框随图尺寸、列内居中），右侧 subject 固定词 + 接力词
// === 时间特性 ===
// 策略: 弹刚 ShotTime（整段弹性）
// 刚性（不可压缩）: 无
// 弹性（可伸缩）: 全程可等比缩放（时长适配语音）
// === 适配注意 ===
// 段长不足 60f 时回退原始帧（动画按原速、可能被截断）。
import React from 'react';
import { AbsoluteFill, interpolate, staticFile } from 'remotion';
import { G } from '../../_fixtures/Fixtures';
import { FONT_STACK } from '../../_system/typography';

import { useShotFrame } from '../../../engine/useShotFrame';
import type { ShotTime } from '../../../engine/time';

// 时长画像：整段弹性（2026-08-14 精修）
const SHOT_TIME: ShotTime = {
  segments: [{ from: 0, to: 180, mode: 'elastic', minFrames: 0 }],
  minFrames: 0,
};

const CARD_W = 940;
const CARD_H = 530;
const GAP = 105;
const STEP = CARD_H + GAP;
const CARD_LEFT = 106;  // 卡片墙列 x（左侧）
const CARD_TOP = 275;   // 当前项卡顶 y（卡中心 540，画面中央）

export interface WordRelayItem {
  /** 接力词（右侧第二行） */
  word: string;
  /** 卡类型：rows 文字卡 / image 图片卡（下拉选择，缺省 rows） */
  type?: 'rows' | 'image';
  /** rows 用：卡标题（image 卡无标题）｜type=rows 时显示 */
  cardTitle?: string;
  /** rows 用：行｜type=rows 时显示 */
  rows?: { label: string; value: string }[];
  /** 推荐插入 16:9 的图片｜type=image 时显示｜file */
  image?: string;
}

export interface WordRelayFilmstripProps {
  subject?: string;                    // 固定主题词（右侧第一行）
  items?: WordRelayItem[];             // 2–5 项，左卡右词一一对应
  /** 口播锚点（技能口播对齐流程用 query-cues.py 自动生成，非用户可调）@internal */
  cueSec?: number[];
}

// 缺省示例（不传 items 时的默认画面）
const DEFAULT_ITEMS: WordRelayItem[] = [
  { word: '环节一', type: 'rows', cardTitle: '准备', rows: [{ label: '要点', value: '说明' }] },
  { word: '环节二', type: 'rows', cardTitle: '执行', rows: [{ label: '要点', value: '说明' }] },
];

const SW_DUR = 16; // 切词窗口（帧）
const SERIF = '"Didot", "Bodoni 72", "Playfair Display", Georgia, serif';

export const WordRelayFilmstrip: React.FC<WordRelayFilmstripProps> = ({
  subject = '',
  items = DEFAULT_ITEMS,
  cueSec,
}) => {
  const frame = useShotFrame(SHOT_TIME);
  const n = Math.max(0, Math.min(5, items.length)); // 2–5（防御：0/超出也安全）
  const list = items.slice(0, n);

  // 切词帧：长度为 n，词 0 为 0（起始态），后续按 cueSec 或自动等距——长度恒 = n，根治 NaN
  const cueMode = !!cueSec && cueSec.length === n;
  const autoGap = Math.max(24, Math.min(48, Math.floor(150 / Math.max(1, n - 1))));
  const SW = cueMode
    ? cueSec.map((s) => Math.round(s * 30))
    : Array.from({ length: n }, (_, i) => i * autoGap);

  // 滚动步进：词 ≥1 切换时滚一格（easeInOutCubic），当前项卡居中
  let stepF = 0;
  for (let j = 1; j < n; j++) {
    const s = SW[j];
    const p = interpolate(frame, [s, s + SW_DUR], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    stepF += p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
  }
  const scroll = stepF * STEP;

  // —— 卡片墙：一张卡 = 一个词条，当前项居中 ——
  const cards: React.ReactNode[] = [];
  list.forEach((it, i) => {
    const top = CARD_TOP + i * STEP - scroll;
    if (top > 1080 || top < -CARD_H - 120) return;
    if (it.type === 'image' && it.image) {
      // image 卡：图框随图片尺寸收缩（高度 530、宽等比），在列宽内水平居中，无白底，
      // 并加回与卡片墙一致的圆角裁切 + 投影 + 细边框
      cards.push(
        <div key={i} style={{ position: 'absolute', left: CARD_LEFT, width: CARD_W, top, display: 'flex', justifyContent: 'center' }}>
          <div style={{
            borderRadius: 12, overflow: 'hidden', lineHeight: 0,
            boxShadow: '0 12px 40px rgba(30,26,20,0.14)', border: '1px solid rgba(0,0,0,0.06)',
          }}>
            <img
              src={/^https?:\/\//.test(it.image || '') ? (it.image as string) : staticFile(it.image as string)}
              style={{ height: CARD_H, width: 'auto', display: 'block', objectFit: 'cover' }}
            />
          </div>
        </div>,
      );
    } else if (it.type === 'image') {
      // 图片模式但还没选图：渲染占位卡，避免 staticFile(undefined) 崩溃
      cards.push(
        <div key={i} style={{ position: 'absolute', left: CARD_LEFT, top, width: CARD_W, height: CARD_H, borderRadius: 12, overflow: 'hidden', boxSizing: 'border-box', border: '2px dashed rgba(30,26,20,0.25)', background: 'rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: 26, color: G.mid }}>未选择图片</div>
        </div>,
      );
    } else {
      // rows 卡：白底圆角卡片 + 标题 + 行
      const rowsC = Array.isArray(it.rows) ? it.rows : [];
      const title = it.cardTitle ?? '';
      cards.push(
        <div key={i} style={{
          position: 'absolute', left: CARD_LEFT, top, width: CARD_W, height: CARD_H,
          borderRadius: 12, overflow: 'hidden', boxSizing: 'border-box',
          boxShadow: '0 12px 40px rgba(30,26,20,0.14)', border: '1px solid rgba(0,0,0,0.06)',
          background: '#fff', padding: '42px 46px', fontFamily: FONT_STACK,
        }}>
          {title && <div style={{ fontSize: 30, fontWeight: 700, color: G.ink, marginBottom: 18 }}>{title}</div>}
          {rowsC.map((r, ri) => (
            <div key={ri} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 0', borderBottom: `1px solid ${G.line}` }}>
              <span style={{ fontSize: 18, fontWeight: 600, color: G.ink }}>{r?.label ?? ''}</span>
              <span style={{ marginLeft: 'auto', fontSize: 18, fontWeight: 700, color: G.accent }}>{r?.value ?? ''}</span>
            </div>
          ))}
        </div>,
      );
    }
  });

  // —— 右侧词接力：subject 固定第一行，items[].word 原位交叉淡 ——
  const wordStyle: React.CSSProperties = {
    fontFamily: SERIF, fontWeight: 400, fontSize: 116, lineHeight: 1.18,
    letterSpacing: '0.002em', textAlign: 'right', whiteSpace: 'nowrap',
  };
  const smooth = (x: number) => x * x * (3 - 2 * x);
  const wordNodes = list.map((it, i) => {
    const sIn = SW[i];
    const sOut = i + 1 < SW.length ? SW[i + 1] : null;
    const pIn = interpolate(frame, [sIn + 7, sIn + SW_DUR], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    if (i === 0 ? frame < sIn : pIn <= 0) return null;
    const pInEff = i === 0 ? interpolate(frame, [sIn, sIn + 12], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) : pIn;
    const grey = sOut ? interpolate(frame, [sOut - 14, sOut - 2], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) : 0;
    const pOut = sOut ? interpolate(frame, [sOut, sOut + 8], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) : 1;
    const op = smooth(pInEff) * smooth(pOut);
    if (op <= 0) return null;
    const mix = smooth(grey);
    const ch = Math.round(0x19 + (0x9d - 0x19) * mix);
    return (
      <div key={i} style={{
        ...wordStyle, position: 'absolute', right: 0, top: 0,
        color: `rgb(${ch},${Math.round(0x19 + (0x98 - 0x19) * mix)},${Math.round(0x19 + (0x8e - 0x19) * mix)})`,
        opacity: op,
      }}>
        {it.word}
      </div>
    );
  });

  return (
    <AbsoluteFill style={{ background: G.bg }}>
      <div style={{ position: 'absolute', inset: 0 }}>{cards}</div>
      {/* 右侧词组：subject 固定第一行，当前词第二行原位换词 */}
      <div style={{ position: 'absolute', right: 210, top: 402 }}>
        <div style={{ ...wordStyle, color: G.ink }}>{subject}</div>
        <div style={{ position: 'relative', height: 140 }}>{wordNodes}</div>
      </div>
    </AbsoluteFill>
  );
};
