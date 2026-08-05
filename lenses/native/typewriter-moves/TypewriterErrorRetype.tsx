// === 可调参数 ===
// DURATION: 180（总帧数，可调；弹性段随 DURATION 等比缩放）
// 色彩: 走纸墨 G 色板（src/_fixtures/Fixtures.tsx）——文字 G.ink / 背景 G.bg / 强调 G.accent
// 功能: 展开
// props: first（第一遍文本）、second（重打文本）、keepChars（保留前缀字符数）
// === 时间特性 ===
// 刚性（不可压缩）: 无（全程弹性）
// 弹性（可伸缩）: 全程可等比缩放（时长适配语音）
// === 适配注意 ===
// 调 DURATION 时只动弹性段 interpolate 关键帧，刚性核心帧区间保持固定帧数。
// typewriter-error-retype｜打字机误删重打
// 浅底居中大字：f2 起 2f/字符打出 first → 停顿 16f(光标闪两下=犹豫) →
// 16f(光标闪两下=犹豫) → f48 起 1.5f/字符逐字退格删掉 "a dashboard"(11 字符，
// 字符直接消失) → 起 1.5f/字符果断打出 second → 光标闪两个周期后永久熄灭。节奏三档：打 2f/删
// 1.5f/重打 1.5f 且无停顿。f110 后全静止，160f 总长 → 收尾真静止 50f。
// 等宽感：逐字符固定宽 span，无 letter-spacing 动画。全部帧确定。
import React from 'react';
import { useCurrentFrame } from 'remotion';
import { G } from '../../_fixtures/Fixtures';

const CHAR_W = 58; // fontSize 96 的等宽感字符宽

// 光标可见性：打字/删除时常亮；停顿段 8f 周期闪两下；打完后 10f 周期闪两下；之后永灭
const cursorOn = (
  f: number,
  pauseStart: number,
  ds: number,
  type2End: number,
  cursorOff: number,
): boolean => {
  if (f >= cursorOff) return false;
  if (f >= type2End) {
    // f95 起：on[95,100) off[100,105) on[105,110) off[110,115)
    return Math.floor((f - type2End) / 5) % 2 === 0;
  }
  if (f >= ds) return true; // 删除 + 重打：常亮（果断）
  if (f >= pauseStart) {
    // 犹豫段 f32–48：on[32,36) off[36,40) on[40,44) off[44,48)
    return Math.floor((f - pauseStart) / 4) % 2 === 0;
  }
  return true; // 第一遍打字：常亮
};

export interface TypewriterErrorRetypeProps {
  first?: string;
  second?: string;
  keepChars?: number;
}

export const TypewriterErrorRetype: React.FC<TypewriterErrorRetypeProps> = ({
  first = 'just a prototype',
  second = 'the real thing',
  keepChars = 5,
}) => {
  const f = useCurrentFrame();

  const T1 = 2; // 第一遍打字起点，2f/字符
  const PAUSE_START = T1 + (first.length - 1) * 2;
  const DS = PAUSE_START + 16; // 停顿后开删，1.5f/字符
  const KEEP = Math.min(keepChars, first.length); // 保留前缀
  const DEL = first.length - KEEP;
  const RS = Math.max(68, DS + DEL * 1.5 + 4); // 重打起点（删完小顿）
  const TYPE2_END = RS + (second.length - 1) * 1.5;
  const CURSOR_OFF = TYPE2_END + 20; // 两个 10f 闪烁周期后熄灭

  // 第一遍已打出字符数
  const n1 = f < T1 ? 0 : Math.min(first.length, Math.floor((f - T1) / 2) + 1);
  // 已删除字符数（从尾部删）
  const removed = f < DS ? 0 : Math.min(DEL, Math.floor((f - DS) / 1.5) + 1);
  // 第二遍已打出字符数
  const n2 = f < RS ? 0 : Math.min(second.length, Math.floor((f - RS) / 1.5) + 1);

  const shown =
    first.slice(0, Math.max(KEEP, n1 - removed)).slice(0, n1) +
    second.slice(0, n2);

  const chars = shown.split('');

  return (
    <div
      style={{
        width: 1920,
        height: 1080,
        background: G.bg,
        position: 'relative',
      }}
    >
      {/* 居中锚定：任意长度文本居中，超宽自动换行（overflowWrap） */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: 490,
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          maxWidth: '90%',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        {chars.map((c, i) => (
          <span
            key={i}
            style={{
              display: 'inline-block',
              width: CHAR_W,
              textAlign: 'center',
              fontFamily: '"Courier New", Courier, monospace',
              fontSize: 96,
              fontWeight: 700,
              color: G.ink,
              lineHeight: 1.1,
            }}
          >
            {c === ' ' ? ' ' : c}
          </span>
        ))}
        {/* 光标：竖线，条件挂载而非 opacity 0 */}
        {cursorOn(f, PAUSE_START, DS, TYPE2_END, CURSOR_OFF) && (
          <span
            style={{
              display: 'inline-block',
              width: 7,
              height: 100,
              marginLeft: 4,
              background: G.ink,
            }}
          />
        )}
      </div>
    </div>
  );
};
