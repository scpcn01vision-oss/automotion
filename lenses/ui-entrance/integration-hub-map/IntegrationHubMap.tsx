// === 可调参数 ===
// DURATION: 180（总帧数，可调；弹性段随 DURATION 等比缩放）
// 功能: 举证,展开
// 描述: 集成中心地图——页面翻转入枢纽，五图标齐入 + 光管连脉
// 色彩: 走纸墨 G 色板（src/_fixtures/Fixtures.tsx）——文字 G.ink / 背景 G.bg / 强调 G.accent
// === 时间特性 ===
// 刚性（不可压缩）: 无（全程弹性）
// 弹性（可伸缩）: 全程可等比缩放（时长适配语音）
// === 适配注意 ===
// 调 DURATION 时只动弹性段 interpolate 关键帧，刚性核心帧区间保持固定帧数。
// integration-hub-map v5 —— 批次 14 单点节奏修正：
// 用户意见（逐字）"动作对了，但是需要翻的时候很快，最后快完成的时候变慢下来"
// → rotateY 0→180° 改为快翻+尾段减速：强 ease-out（cubic），前 ~40% 时间
//   完成 ~80% 角度，尾段明显减速缓着陆；仍一次连贯完成、无分段停顿
//   （判例："匀速"=无停顿≠字面 linear，本条已被用户亲自纠正为快翻尾缓）。
//   90° 侧棱时刻随之提前到 ~f28，白热爆发峰值同步前移对齐。其余全保留。
// —— 以下为 v3 说明（结构沿用）：
// ① 开头不是"转一个角度"，而是页面整个 rotateY 翻转 180° 翻到背面，
//    得到一张新的页面（双面卡：正面=近景旧页，背面=翻正后的新中枢页），
//    翻到侧棱（~90°）时白热爆发吞没画面（对应截图 3/4）。
// ② 五图标光管连上后有"输送感"：亮脉冲沿管线方向（图标→中枢）持续
//    循环流动，直到片尾不停。
// 运动结构对照截图：S1 近景正视可读 → S2 翻转中+拉远+泛光起 →
// S3/S4 侧棱白热爆发+图标浮现 → S5/S6 新页转正、光管连入 → S7/S8 稳定输送。
import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from 'remotion';
import { G } from '../../_fixtures/Fixtures';

const mulberry32 = (a: number) => () => {
  let t = (a += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const rand = mulberry32(20260718);
const NOISE: number[] = Array.from({ length: 200 }, () => rand());

const FONT = '"Avenir Next", "Helvetica Neue", Helvetica, sans-serif';

export interface IntegrationHubRow {
  color?: string;
  title: string;
  sub?: string;
}

export interface IntegrationHubStyle {
  panelColor?: string;
  accent?: string;
  radius?: number;
}

export interface IntegrationHubMapProps {
  frontTitle?: string;
  hubTitle?: string;
  rows?: IntegrationHubRow[];
  icons?: string[];
  hubStyle?: IntegrationHubStyle;
  docLines?: string[]; // 文档段落（中性文字行）
}

// ---------- 中枢面板（默认内容保留原版，可参数化） ----------
const DEFAULT_ROWS: IntegrationHubRow[] = [
  { color: '#4a9fd8', title: 'Project Roadmap', sub: 'Overview · Milestones · Timeline' },
  { color: '#4a9fd8', title: 'Design Review - Homepage', sub: 'Notes · Feedback · Handoff' },
  { color: '#34a853', title: 'Launch Checklist', sub: 'Open Document' },
  { color: '#a259ff', title: 'Onboarding Guide', sub: 'Document · Last Edited' },
  { color: '#f2c744', title: 'Weekly Sync', sub: 'Workspace' },
  { color: G.mid, title: 'Archived Notes', sub: 'Archived · In Workspace' },
  { color: G.bar, title: 'Draft - New Idea', sub: 'In Progress · In Workspace · Yesterday' },
];

const HubPanel: React.FC<{
  glow: number;
  hubTitle: string;
  rows: IntegrationHubRow[];
  hubStyle: IntegrationHubStyle;
}> = ({ glow, hubTitle, rows, hubStyle }) => {
  const panelColor = hubStyle.panelColor ?? G.card;
  const accent = hubStyle.accent ?? G.accent;
  const radius = hubStyle.radius ?? 14;
  return (
    <div
      style={{
        width: 820,
        height: 520,
        background: panelColor,
        borderRadius: radius,
        padding: '26px 30px',
        boxSizing: 'border-box',
        fontFamily: FONT,
        boxShadow: `0 0 ${24 + glow * 60}px rgba(211,146,60,${0.18 + glow * 0.3}), 0 0 ${70 + glow * 70}px rgba(211,146,60,${0.12 + glow * 0.2})`,
        display: 'flex',
        gap: 26,
        overflow: 'hidden',
      }}
    >
      <div style={{ flex: 2 }}>
        <div style={{ fontSize: 27, fontWeight: 600, color: G.ink }}>{hubTitle}</div>
        <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
          {['All', 'Tasks', 'Docs', 'Whiteboards', 'Dashboards', 'Files', 'Chat', 'People'].map((t, i) => (
            <div key={t} style={{ fontSize: 12, color: i === 0 ? accent : G.mid, fontWeight: i === 0 ? 700 : 400 }}>
              {t}
            </div>
          ))}
        </div>
        <div style={{ fontSize: 12, color: G.mid, marginTop: 14 }}>Recent</div>
        {rows.map((it, i) => (
          <div key={i} style={{ display: 'flex', gap: 11, alignItems: 'center', marginTop: 13.5 }}>
            <div style={{ width: 22, height: 22, borderRadius: 6, background: it.color ?? accent, opacity: 0.85 }} />
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: G.ink }}>{it.title}</div>
              <div style={{ fontSize: 11, color: G.mid, marginTop: 1 }}>{it.sub}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ flex: 1, borderLeft: `1px solid ${G.line}`, paddingLeft: 22 }}>
        <div
          style={{
            height: 30,
            width: 168,
            border: `1.5px solid ${G.bar}`,
            borderRadius: 8,
            marginTop: 4,
            fontSize: 12,
            color: G.mid,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          + Add Location Filter
        </div>
        <div style={{ fontSize: 10.5, color: G.mid, marginTop: 24, letterSpacing: 1 }}>QUICK FILTERS</div>
        {['Assigned to Me', 'Created by Me'].map((t) => (
          <div key={t} style={{ fontSize: 13.5, color: G.ink, marginTop: 11 }}>{t}</div>
        ))}
        <div style={{ fontSize: 10.5, color: G.mid, marginTop: 24, letterSpacing: 1 }}>TASK FILTERS</div>
        {['Open', 'Closed', 'Archived'].map((t) => (
          <div key={t} style={{ fontSize: 13.5, color: G.ink, marginTop: 11 }}>{t}</div>
        ))}
      </div>
    </div>
  );
};

// ---------- 翻转前的旧页面（正面）：另一张页面，翻面后才得到中枢页 ----------
const FrontPanel: React.FC<{ glow: number; frontTitle: string; docLines: string[] }> = ({ glow, frontTitle, docLines }) => (
  <div
    style={{
      width: 820,
      height: 520,
      background: G.card,
      borderRadius: 14,
      padding: '30px 34px',
      boxSizing: 'border-box',
      fontFamily: FONT,
      boxShadow: `0 0 ${24 + glow * 55}px rgba(211,146,60,${0.15 + glow * 0.28})`,
      overflow: 'hidden',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ width: 26, height: 26, borderRadius: 7, background: '#4a9fd8', opacity: 0.9 }} />
      <div style={{ fontSize: 26, fontWeight: 600, color: G.ink }}>{frontTitle}</div>
    </div>
    <div style={{ display: 'flex', gap: 14, marginTop: 10 }}>
      {['Overview', 'Milestones', 'Timeline'].map((t) => (
        <div
          key={t}
          style={{
            fontSize: 11.5,
            color: G.mid,
            background: '#efeff0',
            borderRadius: 6,
            padding: '3px 10px',
          }}
        >
          {t}
        </div>
      ))}
    </div>
    <div style={{ height: 1, background: G.line, marginTop: 18 }} />
    {/* 文档段落（中性文字行） */}
    {docLines.map((line, i) => (
      <div key={i} style={{ fontSize: 13, color: G.mid, marginTop: 13, lineHeight: 1.4 }}>{line}</div>
    ))}
  </div>
);

// ---------- 品牌图标瓷贴 ----------
const Tile: React.FC<{ kind: string; on: number }> = ({ kind, on }) => {
  const glyph = (() => {
    switch (kind) {
      case 'ring':
        return (
          <svg width={46} height={46} viewBox="0 0 46 46">
            <circle cx={23} cy={23} r={17} fill="none" stroke={G.mid} strokeWidth={5} />
            <circle cx={23} cy={23} r={6} fill={G.accent} />
          </svg>
        );
      case 'disc':
        return <div style={{ width: 40, height: 40, borderRadius: '50%', background: G.accent }} />;
      case 'cloud':
        return (
          <svg width={56} height={40} viewBox="0 0 56 40">
            <ellipse cx={22} cy={22} rx={14} ry={11} fill={G.mid} />
            <ellipse cx={36} cy={18} rx={13} ry={10} fill={G.bar} />
            <ellipse cx={30} cy={26} rx={16} ry={10} fill={G.mid} />
          </svg>
        );
      case 'triangle':
        return (
          <svg width={48} height={42} viewBox="0 0 48 42">
            <polygon points="24,2 46,40 2,40" fill="none" stroke={G.ink} strokeWidth={5} strokeLinejoin="round" />
            <polygon points="24,12 36,34 12,34" fill={G.accent} />
          </svg>
        );
      default: // diamond
        return (
          <svg width={48} height={42} viewBox="0 0 48 42">
            <polygon points="24,2 46,21 24,40 2,21" fill={G.bar} stroke={G.mid} strokeWidth={3} />
            <polygon points="24,10 38,21 24,32 10,21" fill={G.accent} />
          </svg>
        );
    }
  })();
  return (
    <div
      style={{
        width: 112,
        height: 112,
        borderRadius: 26,
        background: G.card,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        boxShadow: `0 0 ${8 + on * 22}px rgba(211,146,60,${0.15 + on * 0.35})`,
        transform: `scale(${0.9 + on * 0.1})`,
      }}
    >
      {glyph}
    </div>
  );
};

// ---------- 光管（彩虹渐变霓虹管） ----------
type Pipe = { kind: string; icon: [number, number]; path: string; len: number; tIcon: number; tPipe: number };
const PIPES: Pipe[] = [
  { kind: 'ring', icon: [452, 262], path: 'M 452 322 L 452 440 Q 452 480 492 480 L 552 480', len: 300, tIcon: 52, tPipe: 62 },
  { kind: 'disc', icon: [252, 612], path: 'M 316 612 L 552 612', len: 240, tIcon: 52, tPipe: 62 },
  { kind: 'cloud', icon: [992, 178], path: 'M 992 240 L 992 332', len: 92, tIcon: 52, tPipe: 62 },
  { kind: 'triangle', icon: [1512, 272], path: 'M 1512 332 L 1512 440 Q 1512 480 1472 480 L 1372 480', len: 290, tIcon: 52, tPipe: 62 },
  { kind: 'diamond', icon: [1702, 618], path: 'M 1640 618 L 1372 618', len: 270, tIcon: 52, tPipe: 62 },
];
const GROW = 9; // v8（批次 17）：用户意见"翻转过来后，5个app同时出现，然后同时连接"——两拍制：五图标 tIcon 统一 52 同帧出现，五管 tPipe 统一 62 同帧连接

// ---------- 背景霓虹矩形轮廓 ----------
const RECTS = Array.from({ length: 9 }, (_, i) => ({
  x: [150, 660, 1740, 250, 1150, 700, 1660, 90, 1330][i],
  y: [255, 355, 545, 850, 935, 985, 830, 555, 760][i],
  w: 90 + NOISE[i * 3] * 160,
  h: 60 + NOISE[i * 3 + 1] * 70,
  hue: [42, 38, 45, 40, 36, 30, 48, 34, 42][i],
  ph: NOISE[i * 3 + 2] * Math.PI * 2,
}));

export const IntegrationHubMap: React.FC<IntegrationHubMapProps> = ({
  frontTitle = 'Project Overview',
  hubTitle = 'Workspace Hub',
  rows = DEFAULT_ROWS,
  icons = ['ring', 'disc', 'cloud', 'triangle', 'diamond'],
  hubStyle = {},
  docLines = [
    '文档内容 01', '文档内容 02', '文档内容 03', '文档内容 04', '文档内容 05', '文档内容 06',
    '文档内容 07', '文档内容 08', '文档内容 09', '文档内容 10', '文档内容 11', '文档内容 12',
  ],
}) => {
  const frame = useCurrentFrame();
  const activePipes = PIPES.filter((p) => icons.includes(p.kind));
  const activeCount = activePipes.length;

  // --- 相机/面板轨迹：近景正视旧页 → 整体翻转 180°（翻到背面=新页）+ 拉远落定 ---
  const zoom = interpolate(frame, [0, 14, 58, 96], [2.05, 1.95, 1.1, 1.0], {
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });
  // v6（批次 15）：用户意见"翻转再快1倍"——翻面窗口 f14–84（70 帧）
  // 压半到 f14–49（35 帧），快翻+尾段减速曲线形状保持；
  // 90° 侧棱相应提前到 ~f21.2（easeOut=0.5 → t≈0.206）。
  const rotY = interpolate(frame, [14, 49], [0, 180], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const panX = interpolate(frame, [0, 18, 55, 96], [130, 120, 30, 0], {
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });
  const panY = interpolate(frame, [0, 18, 55, 96], [120, 110, 30, 25], {
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });

  // v6：用户意见"中间不需要长时间的光晕，翻到中间闪一下就行"——
  // 长光晕平台删除，改为 90° 侧棱时刻（~f21）2 帧脉冲亮闪即回落
  const bloom = interpolate(frame, [19, 21, 23, 27], [0, 0.55, 0.15, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const noise = NOISE[Math.min(frame, NOISE.length - 1)];

  // 全连通后呼吸
  const allOn = Math.max(...activePipes.map((p) => p.tPipe)) + GROW;
  const breathe = frame > allOn ? 0.5 + 0.5 * Math.sin((frame - allOn) * 0.16) : 0;
  const panelGlow = bloom * 1.1 + breathe * 0.2;

  // 星图元素（图标/光管/矩形）整体可见度
  const mapIn = interpolate(frame, [34, 60], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ background: G.bg }}>
      {/* 淡琥珀光晕 */}
      <AbsoluteFill
        style={{
          background: 'radial-gradient(ellipse at 50% 50%, rgba(211,146,60,0.10), transparent 62%)',
        }}
      />

      {/* 背景霓虹矩形轮廓 */}
      {RECTS.map((r, i) => {
        const on = interpolate(frame, [36 + i * 4, 52 + i * 4], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        const settle = frame > 100 ? 0.55 : 1;
        const flick = 0.65 + 0.35 * Math.sin(frame * 0.11 + r.ph);
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: r.x,
              top: r.y,
              width: r.w,
              height: r.h,
              borderRadius: 12,
              border: `2.5px solid hsla(${r.hue} 60% 55% / ${0.5 * on * flick * settle})`,
              boxShadow: `0 0 12px hsla(${r.hue} 60% 50% / ${0.28 * on * flick * settle}), inset 0 0 8px hsla(${r.hue} 60% 50% / ${0.15 * on * flick * settle})`,
            }}
          />
        );
      })}

      {/* 光管层 */}
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0, opacity: mapIn }}>
        <defs>
          {/* 每条管一个 userSpaceOnUse 渐变（沿管起终点），彩虹沿管线方向铺开。
              objectBoundingBox 在纯水平/垂直线上宽或高为 0 会禁用 paint，必须用户坐标。 */}
          {activePipes.map((p, i) => {
            const nums = p.path.match(/-?[\d.]+/g)!.map(Number);
            const [x1, y1] = [nums[0], nums[1]];
            const [x2, y2] = [nums[nums.length - 2], nums[nums.length - 1]];
            return (
              <linearGradient key={i} id={`rainbow-${i}`} gradientUnits="userSpaceOnUse" x1={x1} y1={y1} x2={x2} y2={y2}>
                <stop offset="0%" stopColor="#f0b06a" />
                <stop offset="28%" stopColor={G.accent} />
                <stop offset="52%" stopColor="#c47f2e" />
                <stop offset="76%" stopColor="#a86a24" />
                <stop offset="100%" stopColor="#8b5a1e" />
              </linearGradient>
            );
          })}
          {/* userSpaceOnUse：纯水平/垂直直线管的 bbox 为零，百分比滤镜区域会
              坍缩成 0 导致整条管不渲染（disc/cloud/diamond 三管消失） */}
          <filter id="pipeGlow" filterUnits="userSpaceOnUse" x="0" y="0" width="1920" height="1080">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {activePipes.map((p, i) => {
          const grow = interpolate(frame, [p.tPipe, p.tPipe + GROW], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.out(Easing.quad),
          });
          if (grow <= 0) return null;
          const dashOn = p.len * grow;
          const pulse = frame > allOn ? 0.78 + 0.22 * Math.sin((frame - allOn) * 0.16 + i) : 1;
          // 输送感：亮脉冲沿管线方向（图标→中枢）持续循环流动
          const flowOffset = -((frame - p.tPipe) * 4.6 + i * 37);
          const flowIn = interpolate(frame, [p.tPipe + GROW, p.tPipe + GROW + 8], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          return (
            <g key={i} filter="url(#pipeGlow)">
              <path
                d={p.path}
                fill="none"
                stroke={`url(#rainbow-${i})`}
                strokeWidth={17}
                strokeLinecap="round"
                strokeDasharray={`${dashOn} ${p.len + 60}`}
                opacity={0.92 * pulse}
              />
              <path
                d={p.path}
                fill="none"
                stroke="rgba(255,255,255,0.9)"
                strokeWidth={5}
                strokeLinecap="round"
                strokeDasharray={`${dashOn} ${p.len + 60}`}
                opacity={0.85 * pulse}
              />
              {grow >= 1 && flowIn > 0 && (
                <>
                  {/* 输送流：连续多段亮脉冲沿管流动（间距 46，段长 20） */}
                  <path
                    d={p.path}
                    fill="none"
                    stroke={G.card}
                    strokeWidth={11}
                    strokeLinecap="round"
                    strokeDasharray="18 56"
                    strokeDashoffset={flowOffset}
                    opacity={0.95 * flowIn}
                  />
                  {/* 输送流柔光晕 */}
                  <path
                    d={p.path}
                    fill="none"
                    stroke="rgba(255,255,255,0.6)"
                    strokeWidth={24}
                    strokeLinecap="round"
                    strokeDasharray="18 56"
                    strokeDashoffset={flowOffset}
                    opacity={0.55 * flowIn}
                  />
                </>
              )}
            </g>
          );
        })}
      </svg>

      {/* 图标瓷贴 */}
      {PIPES.map((p, i) => {
        const appear = interpolate(frame, [p.tIcon, p.tIcon + 12], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
          easing: Easing.out(Easing.cubic),
        });
        const on = interpolate(frame, [p.tPipe, p.tPipe + 10], [0.15, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        if (appear <= 0) return null;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: p.icon[0] - 56,
              top: p.icon[1] - 56,
              opacity: appear,
              transform: `translateY(${(1 - appear) * 24}px)`,
            }}
          >
            <Tile kind={p.kind} on={on * (frame > allOn ? 0.8 + 0.2 * breathe : 1)} />
          </div>
        );
      })}

      {/* 中枢面板：双面卡整体翻转 180°（正面旧页 → 背面新中枢页） */}
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', perspective: 1500 }}>
        <div
          style={{
            transform: `translate(${panX}px, ${panY}px) rotateY(${rotY}deg) scale(${zoom})`,
            position: 'relative',
            transformStyle: 'preserve-3d',
            width: 820,
            height: 520,
          }}
        >
          {/* 正面：翻转前的旧页面 */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backfaceVisibility: 'hidden',
            }}
          >
            <FrontPanel glow={panelGlow} frontTitle={frontTitle} docLines={docLines} />
          </div>
          {/* 背面：翻正后得到的新中枢页（预转 180° 使翻完时朝向镜头且不镜像） */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <HubPanel glow={panelGlow} hubTitle={hubTitle} rows={rows} hubStyle={hubStyle} />
          </div>
          {/* 面板过曝罩：爆发期盖白 */}
          <div
            style={{
              position: 'absolute',
              inset: -6,
              borderRadius: 18,
              background: G.card,
              opacity: Math.min(0.96, bloom * 1.05),
              filter: 'blur(5px)',
              pointerEvents: 'none',
              transform: rotY > 90 ? 'rotateY(180deg) translateZ(1px)' : 'translateZ(1px)',
              backfaceVisibility: 'hidden',
            }}
          />
        </div>
      </AbsoluteFill>

      {/* 全屏白热眩光（S3/S4）：白核+品红/粉翼+青蓝斑 */}
      {bloom > 0.02 && (
        <AbsoluteFill style={{ pointerEvents: 'none' }}>
          <div
            style={{
              position: 'absolute',
              left: 300,
              top: 60,
              width: 1100,
              height: 900,
              background:
                'radial-gradient(closest-side, rgba(255,252,246,0.95), rgba(248,238,220,0.65) 42%, rgba(211,146,60,0.3) 68%, transparent 88%)',
              filter: 'blur(26px)',
              opacity: Math.min(0.7, bloom * (0.5 + 0.05 * noise)),
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 1150,
              top: 150,
              width: 700,
              height: 620,
              background: 'radial-gradient(closest-side, rgba(211,146,60,0.7), rgba(184,174,158,0.25) 60%, transparent 85%)',
              filter: 'blur(34px)',
              opacity: bloom * 0.45,
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 40,
              top: 480,
              width: 620,
              height: 520,
              background: 'radial-gradient(closest-side, rgba(211,146,60,0.6), rgba(184,174,158,0.2) 60%, transparent 85%)',
              filter: 'blur(30px)',
              opacity: bloom * 0.4,
            }}
          />
          {/* 横向紫白光条（S2 左侧光痕） */}
          <div
            style={{
              position: 'absolute',
              left: 30,
              top: 700,
              width: 420,
              height: 46,
              borderRadius: 23,
              background: 'linear-gradient(90deg, rgba(255,252,246,0.9), rgba(211,146,60,0.7), transparent)',
              filter: 'blur(14px)',
              opacity: interpolate(frame, [20, 34, 70, 92], [0, 0.5, 0.3, 0], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              }),
            }}
          />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
