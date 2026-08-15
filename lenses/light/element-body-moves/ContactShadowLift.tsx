// === 可调参数 ===
// DURATION: 180（总帧数，可调；弹性段随 DURATION 等比缩放）
// 色彩: 走纸墨 G 色板（src/_fixtures/Fixtures.tsx）——文字 G.ink / 背景 G.bg / 强调 G.accent
// 功能: 展开
// props: cards（三张抬升卡内容）
// === 时间特性 ===
// 策略: 弹刚 ShotTime（整段弹性）
// 刚性（不可压缩）: 无
// 弹性（可伸缩）: 全程可等比缩放（时长适配语音）
// === 适配注意 ===
// 段长不足 60f 时回退原始帧（动画按原速、可能被截断）。
// contact-shadow-lift｜接触阴影离面抬升
// 浅底上一排 3 张卡，逐张被"点名"抬起：卡 translateY(-28px)+scale(1.08)，
// 其正下方独立椭圆阴影同步放大变淡——纸片离桌感；落回时阴影收紧变实，
// 落地 2f 卡壳 scale 0.99 微压。三张依次各来一遍。收尾真静止 ≥35f。
import React from 'react';
import { interpolate, Easing } from 'remotion';
import { G } from '../../_fixtures/Fixtures';
import { FONT_STACK } from '../../_system/typography';

import { useShotFrame } from '../../../engine/useShotFrame';
import type { ShotTime } from '../../../engine/time';

// 时长画像：整段弹性（2026-08-14 精修）
const SHOT_TIME: ShotTime = {
  segments: [{ from: 0, to: 180, mode: 'elastic', minFrames: 43 }],
  minFrames: 43,
};

const outCubic = Easing.out(Easing.cubic);
const inCubic = Easing.in(Easing.cubic);

// 每张卡的局部时间轴（局部帧 t）：
// [0,10)   抬起  out-cubic
// [10,28)  悬停 18f
// [28,36)  落回  in-cubic
// [36,38)  落地卡壳 scale 0.99
// [38,43)  回弹 0.99→1.0 out-cubic
// t<0 或 t>=43 完全静止（rest 态）
const LIFT_Y = -28; // 原案 -8 → 加码 -20 → QA 保险再到 -28
const LIFT_S = 1.08;

const cardMotion = (t: number) => {
  const y = interpolate(t, [0, 10], [0, LIFT_Y], {
    easing: outCubic, extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  }) + interpolate(t, [28, 36], [0, -LIFT_Y], {
    easing: inCubic, extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  let s: number;
  if (t < 28) {
    s = interpolate(t, [0, 10], [1, LIFT_S], {
      easing: outCubic, extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    });
  } else if (t < 38) {
    s = interpolate(t, [28, 36], [LIFT_S, 0.99], {
      easing: inCubic, extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    });
  } else {
    s = interpolate(t, [38, 43], [0.99, 1], {
      easing: outCubic, extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    });
  }

  // 抬升进度 0（贴桌）→1（悬空），驱动阴影
  const lift = interpolate(t, [0, 10], [0, 1], {
    easing: outCubic, extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  }) - interpolate(t, [28, 36], [0, 1], {
    easing: inCubic, extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  return { y, s, lift };
};

const CARD_W = 360;
const CARD_H = 220;
const GAP = 120;
const STARTS = [2, 42, 82]; // 三张卡依次点名，间隔 40f；末次动画止于 f125，留 35f 真静止

export interface ContactShadowLiftProps {
  cards?: { label: string; value: string }[];
  dashTitle?: string; // 顶栏标题
  avatarText?: string; // 顶栏头像首字母
}

const MiniCard: React.FC<{ w: number; h: number; label: string; value: string }> = ({ w, h, label, value }) => (
  <div
    style={{
      width: w,
      height: h,
      background: G.card,
      border: `2px solid ${G.border}`,
      borderRadius: 14,
      padding: 18,
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      gap: 8,
    }}
  >
    <div style={{ fontFamily: FONT_STACK, fontSize: 20, fontWeight: 800, color: G.ink, overflowWrap: 'break-word' }}>
      {label}
    </div>
    <div style={{ fontFamily: FONT_STACK, fontSize: 28, fontWeight: 800, color: G.accent }}>
      {value}
    </div>
  </div>
);

export const ContactShadowLift: React.FC<ContactShadowLiftProps> = ({
  cards = [
    { label: '指标一', value: '+18%' },
    { label: '指标二', value: '2.1×' },
    { label: '指标三', value: '96.4%' },
  ],
  dashTitle = '项目工作区',
  avatarText = '我',
}) => {
  const frame = useShotFrame(SHOT_TIME);
  const rowW = CARD_W * 3 + GAP * 2;
  const left0 = (1920 - rowW) / 2;
  const top = (1080 - CARD_H) / 2 - 20;

  return (
    <div style={{ width: 1920, height: 1080, background: G.bg, position: 'relative', overflow: 'hidden' }}>
      {/* 假 dashboard 式顶栏，给浅底一点场景感 */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 84, background: G.panel, borderBottom: `2px solid ${G.line}`, display: 'flex', alignItems: 'center', padding: '0 48px', gap: 24, boxSizing: 'border-box' }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: G.side, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: G.card }}>◆</div>
        <div style={{ fontFamily: FONT_STACK, fontSize: 26, fontWeight: 700, color: G.ink }}>{dashTitle}</div>
        <div style={{ marginLeft: 'auto', width: 38, height: 38, borderRadius: 19, background: G.mid, color: G.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 800 }}>{avatarText}</div>
      </div>

      {[0, 1, 2].map((i) => {
        const t = frame - STARTS[i];
        const { y, s, lift } = cardMotion(t);
        const x = left0 + i * (CARD_W + GAP);

        // 独立接触阴影（不是 box-shadow）：卡正下方椭圆径向渐变
        const shScale = 1 + 0.72 * lift;     // 1.0 → 1.72（对比再拉大）
        const shOpacity = 0.55 - 0.37 * lift; // 0.55 → 0.18
        const shW = CARD_W * 0.88;
        const shH = 44;

        return (
          <React.Fragment key={i}>
            <div
              style={{
                position: 'absolute',
                left: x + (CARD_W - shW) / 2,
                top: top + CARD_H - shH / 2 - 4,
                width: shW,
                height: shH,
                borderRadius: '50%',
                background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.45) 42%, rgba(0,0,0,0) 72%)',
                transform: `scale(${shScale})`,
                opacity: shOpacity,
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: x,
                top,
                transform: `translateY(${y}px) scale(${s})`,
              }}
            >
              <MiniCard w={CARD_W} h={CARD_H} label={cards[i]?.label ?? ''} value={cards[i]?.value ?? ''} />
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};
