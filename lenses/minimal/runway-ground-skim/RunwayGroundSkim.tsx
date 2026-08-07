// === 可调参数 ===
// DURATION: 180（总帧数，可调；弹性段随 DURATION 等比缩放）
// 色彩: 走纸墨 G 色板（src/_fixtures/Fixtures.tsx）——文字 G.ink / 背景 G.bg / 强调 G.accent
// 功能: 展开
// props: workspaceName（工作区名）、cards（Recent 卡内容，7 张默认）
// === 时间特性 ===
// 刚性（不可压缩）: 无（全程弹性）
// 弹性（可伸缩）: 全程可等比缩放（时长适配语音）
// === 适配注意 ===
// 调 DURATION 时只动弹性段 interpolate 关键帧，刚性核心帧区间保持固定帧数。
// runway-ground-skim v5 —— 源片 clickup-30.mp4 约 46–50s（clickup10 截图 5 张）：
// 用户 v5 意见（逐字）："去掉落地后弹起的效果，然后整个下落的过程快一点"
// 落实：①删除落地压弹——着地即停，零回弹零压缩（判例：掉落感=干脆利落）；
// ②下落整体提速——单卡下落 15→9 帧，全员落定 f45→f33，立起段随之前移；
// ③保留项不动：错峰 3 帧起点、界面位置顺序（行优先左→右）、重力加速
// （距离∝t²）、贴落完成后页面立起转正收尾。
import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, Easing } from 'remotion';
import { G } from '../../_fixtures/Fixtures';
import { FONT_STACK } from '../../_system/typography';

const INK = G.ink;
const MID = G.mid;
const FAINT = G.line;

const easeRise = Easing.bezier(0.42, 0, 0.16, 1);

/* mulberry32 带种子（起跳节奏 ≤1.5 帧微差 < 3 帧错峰，顺序不乱） */
const mulberry32 = (seed: number) => () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const CARD_W = 760;
const MiniCardFace: React.FC<{ title: string; sub: string }> = ({ title, sub }) => (
  <div style={{
    width: CARD_W, border: `4px solid ${FAINT}`, borderRadius: 22, padding: '30px 40px',
    background: '#fcfcfb', display: 'flex', flexDirection: 'column', gap: 14, boxSizing: 'border-box',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
      <div style={{ width: 40, height: 40, border: `6px solid ${G.mid}`, borderRadius: 8, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: G.mid }}>◆</div>
      <div style={{ fontFamily: FONT_STACK, fontSize: 46, color: INK, fontWeight: 650, whiteSpace: 'nowrap' }}>{title}</div>
    </div>
    <div style={{ fontFamily: FONT_STACK, fontSize: 36, color: MID, paddingLeft: 64, whiteSpace: 'nowrap' }}>{sub}</div>
  </div>
);

/* 界面位置顺序 = 数组顺序：第一行左→右，再第二行左→右 */
const CARD_SLOTS: { col: number; row: number }[] = [
  { col: 0, row: 0 },
  { col: 1, row: 0 },
  { col: 2, row: 0 },
  { col: 3, row: 0 },
  { col: 0, row: 1 },
  { col: 1, row: 1 },
  { col: 2, row: 1 },
];

/* Recent 网格槽位（面板内容坐标） */
const GRID_X = 1180, GRID_Y = 760, COL_GAP = 850, ROW_GAP = 250;
const slotPos = (col: number, row: number) => ({ x: GRID_X + col * COL_GAP, y: GRID_Y + row * ROW_GAP });

/* 平躺地面：Home 仪表盘（卡片槽位留空，由悬浮卡片落入） */
const Ground: React.FC<{ workspaceName: string; rowMeta: string }> = ({ workspaceName, rowMeta }) => (
  <div style={{ width: 4600, height: 2600, background: G.bg, borderRadius: 60, position: 'relative', overflow: 'hidden' }}>
    <div style={{ display: 'flex', height: '100%' }}>
      {/* 左侧栏 */}
      <div style={{ width: 860, borderRight: `4px solid ${FAINT}`, padding: '70px 60px 0', background: G.panel }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 26 }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: `linear-gradient(135deg,${G.bar},${G.mid})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, fontWeight: 800, color: G.card }}>◆</div>
          <div style={{ fontFamily: FONT_STACK, fontSize: 56, fontWeight: 800, color: INK }}>{workspaceName}</div>
        </div>
        <div style={{ height: 46 }} />
        {['Home', 'Inbox', 'Company', 'People & Teams', 'Goals', 'Docs', 'More'].map((t, i) => (
          <div key={t} style={{
            display: 'flex', alignItems: 'center', gap: 30, height: 108, paddingLeft: 32,
            background: i === 0 ? G.nav : 'transparent', borderRadius: 20,
          }}>
            <div style={{ width: 36, height: 36, border: `6px solid ${G.mid}`, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: G.mid }}>◆</div>
            <div style={{ fontFamily: FONT_STACK, fontSize: 46, color: INK, fontWeight: i === 0 ? 650 : 400 }}>{t}</div>
          </div>
        ))}
        <div style={{ height: 60 }} />
        <div style={{ fontFamily: FONT_STACK, fontSize: 38, letterSpacing: 5, color: MID, fontWeight: 600, paddingLeft: 32 }}>SPACES</div>
        <div style={{ height: 16 }} />
        {['需求池', '产品路线', '设计', '设计手册', '版本三', '设计规范'].map((t) => (
          <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 30, height: 96, paddingLeft: 32 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: G.bar, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: G.side }}>◆</div>
            <div style={{ fontFamily: FONT_STACK, fontSize: 42, color: INK }}>{t}</div>
          </div>
        ))}
      </div>
      {/* 主区 */}
      <div style={{ flex: 1, padding: '70px 100px 0', position: 'relative' }}>
        {/* 顶部 tab 条 */}
        <div style={{ display: 'flex', gap: 110, fontFamily: FONT_STACK, fontSize: 42, color: MID, marginBottom: 60 }}>
          <div>数据分析</div><div style={{ fontWeight: 700, color: INK }}>{workspaceName} 版本</div>
          <div>方案讨论</div><div>设计规范</div><div>设计</div>
        </div>
        <div style={{ fontFamily: FONT_STACK, fontSize: 110, fontWeight: 750, color: INK }}>Home</div>
        <div style={{ height: 40 }} />
        <div style={{
          display: 'flex', alignItems: 'center', gap: 30, border: `4px solid ${FAINT}`,
          borderRadius: 24, padding: '28px 42px', background: G.card, width: 1400,
        }}>
          <div style={{ width: 38, height: 38, borderRadius: 19, border: `6px solid ${G.mid}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: G.mid }}>⌕</div>
          <div style={{ fontFamily: FONT_STACK, fontSize: 42, color: MID }}>搜索内容或关键字</div>
        </div>
        <div style={{ height: 66 }} />
        <div style={{ display: 'flex', gap: 70, fontFamily: FONT_STACK, fontSize: 46 }}>
          <div style={{ color: INK, fontWeight: 700 }}>Recent</div>
          <div style={{ color: MID }}>Favorites</div>
        </div>
        {/* ↑ Recent 网格槽位区域留空（卡片从空中落入 GRID_X/GRID_Y 起的两行四列） */}
        <div style={{ height: 560 }} />
        <div style={{ display: 'flex', gap: 70, fontFamily: FONT_STACK, fontSize: 44 }}>
          <div style={{ color: INK, fontWeight: 700 }}>Todo</div>
          <div style={{ color: MID }}>Comments</div>
          <div style={{ color: MID }}>Done</div>
          <div style={{ color: MID }}>Delegated</div>
        </div>
        <div style={{ height: 36 }} />
        <div style={{
          display: 'inline-block', padding: '16px 40px', background: G.panel, borderRadius: 14,
          fontFamily: FONT_STACK, fontSize: 36, letterSpacing: 4, color: G.mid, fontWeight: 600,
        }}>今日</div>
        <div style={{ height: 40 }} />
        {['每周新增问题', '设计手册', '移动端页面', '产品路线'].map((t) => (
          <div key={t} style={{
            display: 'flex', alignItems: 'center', gap: 34, height: 118,
            borderBottom: `3px solid ${G.line}`, width: 2600,
          }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: G.accent }} />
            <div style={{ fontFamily: FONT_STACK, fontSize: 46, color: INK, fontWeight: 550 }}>{t}</div>
            <div style={{ marginLeft: 'auto', fontFamily: FONT_STACK, fontSize: 34, color: MID }}>{rowMeta}</div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export interface RunwayGroundSkimProps {
  workspaceName?: string;
  cards?: { title: string; sub: string }[];
  rowMeta?: string; // 任务行尾注
}

export const RunwayGroundSkim: React.FC<RunwayGroundSkimProps> = ({
  workspaceName = 'Workspace',
  cards = [
    { title: '创意焕新', sub: '新标识探索' },
    { title: '每周新增问题', sub: '问题跟踪看板' },
    { title: '团队路线规划', sub: '路线大纲' },
    { title: '设计规范', sub: '设计手册灵感' },
    { title: '迭代冲刺看板', sub: '研发团队冲刺' },
    { title: '样式问题跟踪', sub: '查询报告' },
    { title: '平台', sub: '系统健康监控' },
  ],
  rowMeta = '刚刚',
}) => {
  const frame = useCurrentFrame();
  const rand = mulberry32(20260718);
  const CARDS = cards.map((c, i) => ({ ...c, ...CARD_SLOTS[i] }));
  const jit = CARDS.map(() => rand() * 1.2); // ≤1.2 帧微差 < 3 帧错峰，顺序绝不乱

  /* ---- 节奏（掉落提速+着地即停版，118 帧）----
   * f0–6    开场：全员悬空在黑色空域
   * f6–33   掉落：第 i 张起跳 f = 6 + i*3（错峰只差 3 帧），下落 9 帧
   *         ⇒ 9 >> 3，空中同时 3–4 张在落（重叠并行，非串行等待）；
   *         重力加速（距离∝t²），着地即停——零回弹零压缩
   * f38–94  页面立起 + 视角转正（rotateX 66→0，镜头拉远居中）
   * f94–118 终态正视整页 hold */
  // v6（批次 15）：用户意见"下落的时间差多调小一些，不需要一个落下了
  // 再启动第二个"——起点差 3→1.5 帧（9 帧下落窗口重叠度 6 倍，
  // 任意时刻空中 5–6 张同落，几乎齐落带涟漪感）
  const START0 = 6, GAP = 1.5, FALLF = 9;

  const lifts = CARDS.map((c, i) => {
    const t = frame - (START0 + i * GAP + jit[i]);
    const H = 560 + (i % 3) * 160; // 初始悬浮高度错落
    if (t <= 0) return H;
    const p = t / FALLF;
    if (p < 1) return H * (1 - p * p); // 重力加速：下落距离 ∝ t²
    return 0; // 着地即停，无弹起
  });

  /* 立起段进度 */
  const riseP = interpolate(frame, [38, 94], [0, 1], { easing: easeRise, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  /* 镜头：落卡段轻微推进（72→66°），立起段转正（→0°）并拉远居中 */
  const landP = interpolate(frame, [0, 34], [0, 1], { easing: Easing.bezier(0.3, 0.1, 0.6, 0.9), extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const rx = interpolate(landP, [0, 1], [72, 66]) - 66 * riseP;
  const z = interpolate(landP, [0, 1], [-620, -320]) + riseP * (-1620 - -320);
  const bright = interpolate(frame, [0, 32, 86], [0.32, 0.8, 1.0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  /* 锚点/透视原点随立起归中：终态整页入画、中心≈画面中心 */
  const anchorTop = 58 - riseP * 6;           // % ：58 → 52（终态整页不裁底）
  const perspY = 30 + riseP * 20;             // % ：30 → 50

  const cam = (children: React.ReactNode, extra?: React.CSSProperties) => (
    <AbsoluteFill style={{ perspective: 1050, perspectiveOrigin: `50% ${perspY}%`, ...extra }}>
      <div style={{
        position: 'absolute', left: '50%', top: `${anchorTop}%`, width: 0, height: 0,
        transformStyle: 'preserve-3d',
        transform: `translateZ(${z}px) rotateX(${rx}deg)`,
      }}>
        {children}
      </div>
    </AbsoluteFill>
  );

  const scene = (
    <div style={{ position: 'absolute', transformStyle: 'preserve-3d', transform: 'translate(-2300px, -1500px)' }}>
      {/* 地面 */}
      <div style={{ filter: `brightness(${bright})` }}>
        <Ground workspaceName={workspaceName} rowMeta={rowMeta} />
      </div>
      {/* 地面上的软影（z≈0，卡片同形，随悬浮高度变化大小/偏移/浓度） */}
      {CARDS.map((c, i) => {
        const h = lifts[i];
        if (h < 2) return null;
        const s = slotPos(c.col, c.row);
        return (
          <div key={'sh' + i} style={{
            position: 'absolute', left: s.x + 20, top: s.y + 14, width: CARD_W - 40, height: 150,
            transform: `translateZ(1px) translate(${h * 0.08}px, ${h * 0.12}px) scale(${1 + h * 0.0004})`,
            background: 'rgba(10,8,16,0.9)', borderRadius: 24,
            filter: `blur(${10 + h * 0.03}px)`,
            opacity: Math.max(0.12, 0.38 - h * 0.0003),
          }} />
        );
      })}
      {/* 悬空卡片：与地面同向平躺，translateZ 抬高，落回槽位。
          空中时被"追光"打亮（比暗地面亮），落地融入地面亮度 */}
      {CARDS.map((c, i) => {
        const h = lifts[i];
        const s = slotPos(c.col, c.row);
        const airLit = h > 2 ? Math.max(1.35, bright) : bright;
        return (
          <div key={'card' + i} style={{
            position: 'absolute', left: s.x, top: s.y,
            transform: `translateZ(${h}px)`,
            filter: `brightness(${airLit})`,
            boxShadow: h > 2 ? `0 0 ${30 + h * 0.05}px rgba(240,235,255,${Math.min(0.3, h * 0.0004)})` : 'none',
          }}>
            <MiniCardFace title={c.title} sub={c.sub} />
          </div>
        );
      })}
    </div>
  );

  /* 立起段各氛围层收敛：黑空域压顶/地平线光/近景糊都随转正淡出 */
  const airOp = 1 - riseP;

  return (
    <AbsoluteFill style={{ background: G.ink }}>
      {/* 地平线微光（转正后消失） */}
      <AbsoluteFill style={{
        background: `radial-gradient(ellipse 60% 14% at 50% 40%, rgba(190,170,255,${(0.16 + landP * 0.1) * airOp}), transparent 75%)`,
      }} />
      {cam(scene)}
      {/* 近景轻糊（转正后消失） */}
      {airOp > 0.02 && (
        <AbsoluteFill style={{
          filter: 'blur(10px) brightness(0.88)', opacity: airOp,
          WebkitMaskImage: 'linear-gradient(180deg, transparent 60%, rgba(0,0,0,0.7) 84%, black 98%)',
          maskImage: 'linear-gradient(180deg, transparent 60%, rgba(0,0,0,0.7) 84%, black 98%)',
        }}>
          {cam(scene)}
        </AbsoluteFill>
      )}
      {/* 上半空域压黑（随立起淡出） */}
      <AbsoluteFill style={{
        background: 'linear-gradient(180deg, rgba(4,3,8,0.9) 0%, rgba(4,3,8,0.35) 16%, transparent 32%)',
        opacity: airOp, pointerEvents: 'none',
      }} />
      {/* 暗角（转正后减弱不消失） */}
      <AbsoluteFill style={{
        background: 'radial-gradient(ellipse 95% 90% at 50% 55%, transparent 50%, rgba(3,2,7,0.55) 85%, rgba(2,1,5,0.88) 100%)',
        opacity: 1 - riseP * 0.55, pointerEvents: 'none',
      }} />
    </AbsoluteFill>
  );
};
