// === 可调参数 ===
// DURATION: 180（总帧数，可调；弹性段随 DURATION 等比缩放）
// 色彩: 走纸墨 G 色板（src/_fixtures/Fixtures.tsx）——文字 G.ink / 背景 G.bg / 强调 G.accent
// 功能: 展开,宣告
// props: cards（书页卡片内容数组，3 列自适应行数）、pageTitle（顶栏标题）
// === 时间特性 ===
// 刚性（不可压缩）: 刚性:胶带拍34f,立起34f
// 弹性（可伸缩）: 其余段（入场/过渡/收尾/hold）可等比缩放
// === 适配注意 ===
// 调 DURATION 时只动弹性段 interpolate 关键帧，刚性核心帧区间保持固定帧数。
// popup-book-rise —— 立体书立起
// 书页壳（侧栏+顶栏）打平躺下（场景 rotateX 75° 透视俯视），卡片是贴在页上的
// 纸片，沿各自底边从平躺错峰立起（rotateX 90°→-5° 过冲→0° 回弹，即立到 95° 再回 90°），
// 根部投影随立起角度收窄变淡。全部立起后整个场景轻微回正（75°→68°）收尾。
// 收尾 f108 后真静止 ≥52f。帧确定性：全由 frame 派生。
import React from 'react';
import { useCurrentFrame, interpolate, spring, Easing } from 'remotion';
import { G } from '../../_fixtures/Fixtures';
import { FONT_STACK } from '../../_system/typography';

const FPS = 30;
const HOLD = 14; // 开头静置
const STAGGER = 7;
const RISE_DUR = 34; // spring 视觉收敛帧数
const LAST_START = HOLD + 5 * STAGGER; // 49
const SETTLE = LAST_START + RISE_DUR; // 83：全部立起
const REST = SETTLE + 25; // 108：场景回正完成

// dashboard A 区几何（照抄 FakeDashboard：侧栏 220 + 顶栏 72 + padding 36 + gap 28）
const AREA_X = 220 + 36;
const AREA_Y = 72 + 36;
const AREA_W = 1920 - 220 - 72;
const GAP = 28;

const PageCard: React.FC<{
  i: number;
  frame: number;
  label: string;
  value: string;
  cellW: number;
  cellH: number;
  cols: number;
  rows: number;
}> = ({ i, frame, label, value, cellW, cellH, cols, rows }) => {
  const col = i % cols;
  const row = Math.floor(i / cols);
  // 远排（row 0）先立，近排后立；同排从左到右
  const order = row === 0 ? col : cols + col;
  const start = HOLD + order * STAGGER;

  const s = spring({
    frame: frame - start,
    fps: FPS,
    config: { damping: 11, stiffness: 130, mass: 0.9 },
    durationInFrames: RISE_DUR,
    durationRestThreshold: 0.0001,
  });
  // 平躺（贴页面 = local 0°）→ 立起（垂直页面 = local -90°，顶边朝观众翻起），
  // spring 过冲自然冲过 -90° 到约 -95°（纸的韧性）再回弹。
  const rx = interpolate(s, [0, 1], [0, -90]);

  // 根部投影：躺平时长影（卡片盖在页面上），立起后收成窄条
  const lie = 1 - Math.min(Math.abs(rx) / 90, 1); // 1 = 躺平, 0 = 立直
  const shH = 14 + 90 * Math.max(lie, 0);
  const shAlpha = 0.1 + 0.16 * Math.max(lie, 0);

  return (
    <div
      style={{
        position: 'absolute',
        left: AREA_X + col * (cellW + GAP),
        top: AREA_Y + row * (cellH + GAP),
        width: cellW,
        height: cellH,
        transformStyle: 'preserve-3d',
      }}
    >
      {/* 根部投影贴在页面上，不随卡片立起 */}
      <div
        style={{
          position: 'absolute',
          left: 6,
          right: 6,
          bottom: -4,
          height: shH,
          background: `rgba(0,0,0,${shAlpha})`,
          borderRadius: 12,
          filter: 'blur(10px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: `rotateX(${rx}deg)`,
          transformOrigin: '50% 100%',
          backfaceVisibility: 'hidden',
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            background: G.card,
            border: `2px solid ${G.border}`,
            borderRadius: 14,
            padding: 20,
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: 12,
          }}
        >
          <div style={{ fontFamily: FONT_STACK, fontSize: 22, fontWeight: 800, color: G.ink, overflowWrap: 'break-word' }}>
            {label}
          </div>
          <div style={{ fontFamily: FONT_STACK, fontSize: 34, fontWeight: 800, color: G.accent }}>
            {value}
          </div>
        </div>
      </div>
    </div>
  );
};

export interface PopupBookRiseProps {
  cards?: { label: string; value: string }[];
  pageTitle?: string;
}

export const PopupBookRise: React.FC<PopupBookRiseProps> = ({
  cards = [
    { label: '指标一', value: '+18%' },
    { label: '指标二', value: '2.1×' },
    { label: '指标三', value: '96.4%' },
    { label: '节点', value: '4/4' },
    { label: '延迟', value: '42ms' },
    { label: '可用性', value: '99.98%' },
  ],
  pageTitle = '概览',
}) => {
  const frame = useCurrentFrame();
  const cols = 3;
  const rows = Math.max(1, Math.ceil(cards.length / cols));
  const AREA_H = 1080 - 72 - 72;
  const CELL_W = (AREA_W - 2 * GAP) / cols;
  const CELL_H = (AREA_H - (rows - 1) * GAP) / rows;

  // 场景（书页）俯视角：全程 75°，全部立起后轻微回正到 68°
  const sceneRx = interpolate(frame, [SETTLE, REST], [75, 68], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div style={{ width: 1920, height: 1080, background: G.bg, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, perspective: 2600, perspectiveOrigin: '50% 30%' }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transform: `translateY(-40px) rotateX(${sceneRx}deg)`,
            transformOrigin: '50% 62%',
            transformStyle: 'preserve-3d',
          }}
        >
          {/* 书页底板：dashboard 的壳（侧栏+顶栏+空白页面） */}
          <div style={{ position: 'absolute', inset: 0, background: G.bg, boxShadow: '0 40px 80px rgba(0,0,0,0.25)' }}>
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 220, background: G.side, padding: '28px 22px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: G.bar }} />
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} style={{ height: 12, width: `${60 + ((i * 29) % 35)}%`, background: G.sideBar, borderRadius: 6 }} />
              ))}
            </div>
            <div style={{ position: 'absolute', left: 220, right: 0, top: 0, height: 72, background: G.panel, borderBottom: `2px solid ${G.line}`, display: 'flex', alignItems: 'center', padding: '0 32px', gap: 20, boxSizing: 'border-box' }}>
              <div style={{ fontFamily: FONT_STACK, fontSize: 22, fontWeight: 700, color: G.ink }}>{pageTitle}</div>
              <div style={{ marginLeft: 'auto', height: 36, width: 320, background: G.card, border: `2px solid ${G.line}`, borderRadius: 18, boxSizing: 'border-box' }} />
              <div style={{ width: 36, height: 36, borderRadius: 18, background: G.mid }} />
            </div>
          </div>
          {/* 纸片卡沿底边立起（3 列，行数随数量自适应） */}
          {cards.map((c, i) => (
            <PageCard
              key={i}
              i={i}
              frame={frame}
              label={c.label}
              value={c.value}
              cellW={CELL_W}
              cellH={CELL_H}
              cols={cols}
              rows={rows}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
