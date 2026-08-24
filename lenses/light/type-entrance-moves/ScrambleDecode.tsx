// === 可调参数 ===
// DURATION: 180（总帧数，可调；弹性段随 DURATION 等比缩放）
// 色彩: 走纸墨 G 色板（src/_fixtures/Fixtures.tsx）——文字 G.ink / 背景 G.bg / 强调 G.accent
// 功能: 钩子,宣告
// props: text（乱码解码的标题）
// === 时间特性 ===
// 策略: 弹刚 ShotTime（整段弹性）+ 口播锚点（revealAtSec 单事件）
// 刚性（不可压缩）: 无
// 弹性（可伸缩）: 全程可等比缩放（时长适配语音）；提供 revealAtSec 时整词解码完成锚定口播时刻
// === 适配注意 ===
// 段长不足 60f 时回退原始帧（动画按原速、可能被截断）。
// 乱码解码字（scramble-decode）——终端黑客感文字入场。
// 标题 "DECODE SPEED" 每字符先高速跳随机字母/数字（每 2f 换一个，seed hash 取字符），
// 从左到右逐个锁定：第 i 个字符在帧 20+i*6 锁定为真字符，锁定瞬间该字符反色闪
// （G.ink 色块白字 2f）随即恢复。跳动期字符 G.mid，锁定后 G.ink。
// 关键帧：0–20f 全员乱跳 → 20–86f 从左到右逐个锁定 → 87–130f 完全静止收尾。
import React from 'react';
import { useCurrentFrame } from 'remotion';

import { G } from '../../_fixtures/Fixtures';

import { useShotFrame } from '../../../engine/useShotFrame';
import type { ShotTime } from '../../../engine/time';

// 时长画像：整段弹性（2026-08-14 精修）
const SHOT_TIME: ShotTime = {
  segments: [{ from: 0, to: 180, mode: 'elastic', minFrames: 0 }],
  minFrames: 0,
};

const CHARSET = 'ABCDEF0123456789#$%&';
const LOCK_START = 20; // 第 0 个字符锁定帧
const LOCK_STEP = 6; // 相邻字符锁定间隔
const FLASH_LEN = 2; // 锁定反色闪持续帧数

// 帧确定伪随机
const h = (n: number) => {
  const s = Math.sin(n * 127.3) * 43758.5453;
  return s - Math.floor(s);
};

export interface ScrambleDecodeProps {
  text?: string;
  revealAtSec?: number; // 口播对齐：整词解码完成（首尾字符全部锁定）的段内秒；提供后解码进度压缩到该时刻前完成
}

export const ScrambleDecode: React.FC<ScrambleDecodeProps> = ({
  text = 'DECODE SPEED',
  revealAtSec,
}) => {
  const chars = text.split('');
  const frameShot = useShotFrame(SHOT_TIME);
  const realFrame = useCurrentFrame();
  const cueMode = revealAtSec !== undefined;
  // 解码完成（末字符锁定）= LOCK_START + (n-1)*LOCK_STEP；口播对齐压缩到 revealAtSec 前完成
  const nNonSpace = chars.filter((c) => c !== ' ').length;
  const EVT = LOCK_START + (nNonSpace - 1) * LOCK_STEP;
  const revealF = cueMode ? Math.max(1, Math.round(revealAtSec * 30)) : 0;
  const frame = cueMode
    ? realFrame <= revealF
      ? (realFrame / revealF) * EVT
      : EVT + (realFrame - revealF)
    : frameShot;
  const lockedCount = chars.filter((c, i) => c === ' ' || frame >= LOCK_START + i * LOCK_STEP).length;
  const allLocked = lockedCount === chars.length;

  return (
    <div
      style={{
        width: 1920,
        height: 1080,
        background: G.bg,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 48,
      }}
    >
      <div
        style={{
          fontFamily: 'ui-monospace, Menlo, Monaco, monospace',
          fontWeight: 800,
          fontSize: 120,
          letterSpacing: 2,
          display: 'flex',
        }}
      >
        {chars.map((ch, i) => {
          if (ch === ' ') {
            return <span key={i} style={{ display: 'inline-block', width: '0.7em' }} />;
          }
          const lockFrame = LOCK_START + i * LOCK_STEP;
          const locked = frame >= lockFrame;
          const flashing = locked && frame < lockFrame + FLASH_LEN;
          // 跳动期：每 2 帧换一个伪随机字符
          const tick = Math.floor(frame / 2);
          const scrambleChar = CHARSET[Math.floor(h(i * 101 + tick * 7 + 13) * CHARSET.length)];
          const shown = locked ? ch : scrambleChar;
          return (
            <span
              key={i}
              style={{
                display: 'inline-block',
                width: '1ch',
                textAlign: 'center',
                color: flashing ? G.card : locked ? G.ink : G.mid,
                background: flashing ? G.ink : 'transparent',
              }}
            >
              {shown}
            </span>
          );
        })}
      </div>
      {/* 底部进度提示条：已锁定字符数比例，帮助读出"从左到右扫过"的推进感 */}
      <div style={{ width: 900, height: 10, background: G.line, borderRadius: 5, overflow: 'hidden' }}>
        <div
          style={{
            width: `${(lockedCount / chars.length) * 100}%`,
            height: '100%',
            background: allLocked ? G.ink : G.mid,
            borderRadius: 5,
          }}
        />
      </div>
    </div>
  );
};
