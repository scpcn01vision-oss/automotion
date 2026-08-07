// === 可调参数 ===
// DURATION: 180（总帧数，可调；弹性段随 DURATION 等比缩放）
// 功能: 展开
// 描述: 霓虹框轨道落位——框自绘后镜头弧移，组件同帧落地
// 色彩: 走纸墨 G 色板（src/_fixtures/Fixtures.tsx）——文字 G.ink / 背景 G.bg / 强调 G.accent
// === 时间特性 ===
// 刚性（不可压缩）: 无（全程弹性）
// 弹性（可伸缩）: 全程可等比缩放（时长适配语音）
// === 适配注意 ===
// 调 DURATION 时只动弹性段 interpolate 关键帧，刚性核心帧区间保持固定帧数。
// neon-frame-forerun-orbit v5（批次 14 #1）。用户意见（逐字）：
// "这个应该是所有组件和文字同时从空中往下贴合"
// ——单点修正：v4 的错峰贴落改为**所有组件和文字同时**从空中往下贴合
// （同帧起落、同帧贴合，同形软影同步收敛）。判例：整体登场镜=同时贴合，
// 错峰是巡礼镜的语法。其余全部保留：同款霓虹渐变框+灰面板+背景霓虹管
// 框群；镜头视角 rotateY 从左侧(+38°) 连续弧线旋到右侧(-26°)。
import React from 'react';
import { G } from '../../_fixtures/Fixtures';
import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from 'remotion';
import { FONT_STACK } from '../../_system/typography';

const easeFall = Easing.bezier(0.5, 0.05, 0.6, 1); // 加速下落、末端软着陆

/* 悬浮 + 同形软影（对标批次11 GrazeFaceTour FloatWrap）：
 * h=悬浮高度(px)。本体向左上抬起，原位留模糊压暗同形影，h→0 重合影消失 */
const FloatWrap: React.FC<{ h: number; children: React.ReactNode }> = ({ h, children }) => (
  <div style={{ position: 'relative' }}>
    {h > 1 && (
      <div style={{
        position: 'absolute', inset: 0,
        transform: `translate(${h * 0.26}px, ${h * 0.48}px) scale(${1 + h * 0.0012})`,
        filter: `blur(${2.5 + h * 0.09}px) brightness(0.32) saturate(0.4)`,
        opacity: Math.min(0.4, 0.16 + h * 0.005),
        pointerEvents: 'none',
      }}>{children}</div>
    )}
    <div style={{ transform: `translate(${-h * 0.36}px, ${-h * 0.82}px)` }}>{children}</div>
  </div>
);

/* v5：所有组件和文字**同时**从空中往下贴合——统一 land 时刻 LAND，
 * 同帧起落（t=LAND-FALL）、同帧贴合（t=LAND），软影同步收敛；
 * 各组件仅悬浮高度 H 略有差异（同窗下落，速度随高度自然区分） */
const LAND = 0.52;
const liftOf = (t: number, land: number, H: number) => {
  const FALL = 0.3;
  const p = Math.min(1, Math.max(0, (t - (LAND - FALL)) / FALL));
  return (1 - easeFall(p)) * H;
};

const mulberry32 = (a: number) => () => {
  let t = (a += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const ink = G.side;
const mid = G.mid;
const line = G.line;

const PW = 1330;
const PH = 900;
const PL = 1000;

const FRAME_D = `M 0 ${PH / 2} L 0 0 L ${PW} 0 L ${PW} ${PH} L 0 ${PH} Z`;

const Chip: React.FC<{ w: number; data: { title: string; sub: string } }> = ({ w, data }) => (
  <div style={{
    width: w, height: 74, background: G.card, border: `2px solid ${line}`,
    borderRadius: 10, padding: '12px 14px', boxSizing: 'border-box',
    display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 6,
  }}>
    <div style={{ fontFamily: FONT_STACK, fontSize: 16, fontWeight: 700, color: G.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{data.title}</div>
    <div style={{ fontFamily: FONT_STACK, fontSize: 13, color: G.mid, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{data.sub}</div>
  </div>
);

/* 与孪生 NeonFrameForerun 同款灰面板；t=贴落进程（统一 LAND 同帧贴合） */
interface GrayHomeProps {
  t?: number;
  appName: string;
  menuItems: { icon: string; label: string }[];
  subMenuItems: { icon: string; label: string }[];
  sectionLabel: string;
  mainTitle: string;
  searchText: string;
  chips: { title: string; sub: string }[];
  statLabels: string[];
  rows: { title: string; avatars: string[] }[];
}

const GrayHome: React.FC<GrayHomeProps> = ({
  t = 1,
  appName,
  menuItems,
  subMenuItems,
  sectionLabel,
  mainTitle,
  searchText,
  chips,
  statLabels,
  rows,
}) => {
  const L = (land: number, H = 72) => liftOf(t, land, H * 1.7);
  return (
  <div style={{ width: PW, height: PH, background: G.card, borderRadius: 6, display: 'flex', overflow: 'hidden', boxSizing: 'border-box' }}>
    <div style={{ width: 290, borderRight: `2px solid ${line}`, padding: '26px 24px', boxSizing: 'border-box' }}>
      <FloatWrap h={L(0.24, 84)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: ink, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: G.panel }}>◆</div>
          <div style={{ fontFamily: FONT_STACK, fontSize: 17, fontWeight: 700, color: G.panel }}>{appName}</div>
        </div>
      </FloatWrap>
      {menuItems.map((it, i) => (
        <FloatWrap key={i} h={L(0.3 + i * 0.045, 66)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11, height: 34 }}>
            <div style={{ width: 17, height: 17, borderRadius: 5, background: mid, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: G.panel }}>{it.icon}</div>
            <div style={{ fontFamily: FONT_STACK, fontSize: 14, fontWeight: 600, color: G.panel }}>{it.label}</div>
          </div>
        </FloatWrap>
      ))}
      <FloatWrap h={L(0.56, 62)}>
        <div style={{ fontFamily: FONT_STACK, fontSize: 13, fontWeight: 700, color: G.mid, margin: '24px 0 12px' }}>{sectionLabel}</div>
      </FloatWrap>
      {subMenuItems.map((it, i) => (
        <FloatWrap key={i} h={L(0.62 + i * 0.05, 66)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11, height: 32 }}>
            <div style={{ width: 16, height: 16, borderRadius: 4, background: G.bar, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: G.side }}>{it.icon}</div>
            <div style={{ fontFamily: FONT_STACK, fontSize: 13, fontWeight: 600, color: G.panel }}>{it.label}</div>
          </div>
        </FloatWrap>
      ))}
    </div>
    <div style={{ flex: 1, padding: '30px 40px', boxSizing: 'border-box' }}>
      <FloatWrap h={L(0.26, 90)}>
        <div style={{ fontFamily: FONT_STACK, fontSize: 26, fontWeight: 800, color: G.ink, marginBottom: 18 }}>{mainTitle}</div>
      </FloatWrap>
      <FloatWrap h={L(0.34, 80)}>
        <div style={{ height: 46, border: `2px solid ${line}`, borderRadius: 12, marginBottom: 26, display: 'flex', alignItems: 'center', padding: '0 16px', background: G.card, fontFamily: FONT_STACK, fontSize: 17, color: G.mid }}>
          <span style={{ marginRight: 12, fontWeight: 700 }}>⌕</span>
          {searchText}
        </div>
      </FloatWrap>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 30 }}>
        {chips.map((chip, i) => (
          <FloatWrap key={i} h={L(0.42 + i * 0.04, 76)}>
            <Chip w={222} data={chip} />
          </FloatWrap>
        ))}
      </div>
      <FloatWrap h={L(0.72, 60)}>
        <div style={{ display: 'flex', gap: 18, marginBottom: 18 }}>
          {statLabels.map((s, i) => (
            <div key={i} style={{ fontFamily: FONT_STACK, fontSize: 15, fontWeight: 700, color: i === 0 ? G.ink : G.mid }}>{s}</div>
          ))}
        </div>
      </FloatWrap>
      {rows.map((r, i) => (
        <FloatWrap key={i} h={L(0.78 + i * 0.055, 64)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, height: 46, borderBottom: `2px solid ${line}` }}>
            <div style={{ width: 13, height: 13, borderRadius: 7, background: G.accent }} />
            <div style={{ fontFamily: FONT_STACK, fontSize: 17, fontWeight: 600, color: G.ink }}>{r.title}</div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 7 }}>
              {r.avatars.map((a, k) => (
                <div key={k} style={{ width: 20, height: 20, borderRadius: 10, background: G.bar, color: G.side, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800 }}>{a}</div>
              ))}
            </div>
          </div>
        </FloatWrap>
      ))}
    </div>
  </div>
  );
};

type BgFrame = { x: number; y: number; w: number; h: number; hue: string; phase: number; period: number; skew: number };
const rng = mulberry32(20260718);
const HUES = ['#b06af0', '#e879c9', '#f0a35c', '#6a7df0', '#e0679a', '#8a5cf0', '#c06af0'];
const BG_FRAMES: BgFrame[] = Array.from({ length: 18 }).map(() => ({
  x: rng() * 2000 - 120, y: rng() * 1100 - 60,
  w: 160 + rng() * 480, h: 70 + rng() * 220,
  hue: HUES[Math.floor(rng() * HUES.length)],
  phase: rng() * 90, period: 55 + rng() * 70,
  skew: -14 + rng() * 10,
}));

export interface NeonFrameForerunOrbitProps {
  appName?: string; // 侧栏品牌文字
  menuItems?: { icon: string; label: string }[]; // 侧栏主菜单
  subMenuItems?: { icon: string; label: string }[]; // 侧栏次级菜单
  sectionLabel?: string; // 侧栏分区标签
  mainTitle?: string; // 主区标题
  searchText?: string; // 搜索占位文字
  chips?: { title: string; sub: string }[]; // 卡片组
  statLabels?: string[]; // 统计文字
  rows?: { title: string; avatars: string[] }[]; // 列表行
}

export const NeonFrameForerunOrbit: React.FC<NeonFrameForerunOrbitProps> = ({
  appName = '工作台',
  menuItems = [
    { icon: '◆', label: '仪表盘' },
    { icon: '●', label: '任务' },
    { icon: '▲', label: '文档' },
    { icon: '●', label: '成员' },
    { icon: '▲', label: '设置' },
    { icon: '◆', label: '通知' },
  ],
  subMenuItems = [
    { icon: '●', label: '消息' },
    { icon: '▲', label: '收藏' },
    { icon: '◆', label: '最近' },
    { icon: '●', label: '归档' },
    { icon: '▲', label: '回收站' },
  ],
  sectionLabel = '常用',
  mainTitle = '项目工作区',
  searchText = '搜索',
  chips = [
    { title: '指标一', sub: '说明 01' },
    { title: '指标二', sub: '说明 02' },
    { title: '指标三', sub: '说明 03' },
    { title: '指标四', sub: '说明 04' },
    { title: '指标五', sub: '说明 05' },
    { title: '指标六', sub: '说明 06' },
    { title: '指标七', sub: '说明 07' },
  ],
  statLabels = ['完成', '进行', '待办', '总计'],
  rows = [
    { title: '条目 01', avatars: ['A', 'B', 'C'] },
    { title: '条目 02', avatars: ['D', 'E', 'F'] },
    { title: '条目 03', avatars: ['G', 'H', 'I'] },
    { title: '条目 04', avatars: ['J', 'K', 'L'] },
  ],
}) => {
  const frame = useCurrentFrame();
  // 开场快速描框（同款左缘中点两头奔画，14 帧成型——样式与 v3 一致）
  const trace = interpolate(frame, [0, 14], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.bezier(0.3, 0.1, 0.3, 1),
  });
  // 面板早亮：本变体主角是旋转+贴落，不复刻暗转亮长过程
  const lit = interpolate(frame, [8, 30], [0.25, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.bezier(0.35, 0, 0.3, 1),
  });
  const frameLine = interpolate(frame, [96, 130], [1, 0.35], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const rimGlow = interpolate(frame, [0, 20, 108, 138], [0.7, 1, 0.75, 0.5], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const bgLit = interpolate(frame, [0, 30, 100, 136], [0.3, 1, 0.85, 0.1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  // 视角弧线：从页面左侧(+38°)连续旋到右侧(-26°)，全程不停——
  // ease-in-out 起止柔和、中段持续转动
  const orbit = interpolate(frame, [0, 128], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.bezier(0.42, 0.05, 0.32, 1),
  });
  const rotY = 38 - 64 * orbit;             // +38° → -26°
  const rotX = 6 - 2.5 * orbit;
  const rotZ = 3 - 7.5 * orbit;             // 左视角微仰 → 右视角微俯（对齐 v3 落定姿态）
  const scale = 0.9 + 0.1 * Math.sin(orbit * Math.PI) + 0.02 * orbit; // 弧线中段略推近
  // 透视原点随视角横移：镜头从左绕到右
  const pOrigin = 30 + 34 * orbit;
  const headP = trace * (PL / 2);
  // 贴落进程：与旋转同时进行（帧 10–118），错峰起点+重叠下落
  const drop = interpolate(frame, [10, 118], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ background: G.ink, overflow: 'hidden' }}>
      {/* 背景霓虹管框群（同款） */}
      <svg width={1920} height={1080} style={{ position: 'absolute' }}>
        <defs>
          <filter id="obgblur" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation={7} />
          </filter>
        </defs>
        {BG_FRAMES.map((b, i) => {
          const breath = 0.5 + 0.5 * Math.sin(((frame + b.phase) / b.period) * Math.PI * 2);
          const op = bgLit * (0.18 + 0.4 * breath);
          return (
            <g key={i} transform={`translate(${b.x} ${b.y}) skewY(${b.skew * 0.4}) skewX(${b.skew})`}>
              <rect width={b.w} height={b.h} rx={4} fill="none"
                stroke={b.hue} strokeWidth={7} filter="url(#obgblur)" opacity={op * 0.8} />
              <rect width={b.w} height={b.h} rx={4} fill="none"
                stroke={b.hue} strokeWidth={2} opacity={op} />
            </g>
          );
        })}
      </svg>
      {/* 主体：视角弧线旋转中的框+面板 */}
      <div style={{ position: 'absolute', inset: 0, perspective: 1500, perspectiveOrigin: `${pOrigin}% 44%` }}>
        <div style={{
          position: 'absolute', left: (1920 - PW) / 2, top: (1080 - PH) / 2 - 10,
          transform: `scale(${scale}) rotateY(${rotY}deg) rotateX(${rotX}deg) rotateZ(${rotZ}deg)`,
          transformStyle: 'preserve-3d',
        }}>
          <div style={{ opacity: trace > 0.4 ? 1 : 0, filter: `brightness(${Math.max(0.05, lit)})` }}>
            <GrayHome
              t={drop}
              appName={appName}
              menuItems={menuItems}
              subMenuItems={subMenuItems}
              sectionLabel={sectionLabel}
              mainTitle={mainTitle}
              searchText={searchText}
              chips={chips}
              statLabels={statLabels}
              rows={rows}
            />
            <div style={{
              position: 'absolute', inset: 0, borderRadius: 6,
              background: 'linear-gradient(150deg, rgba(30,20,60,0.5), rgba(0,0,0,0.78))',
              opacity: 1 - lit,
            }} />
          </div>
          <div style={{
            position: 'absolute', left: -10, top: -10, width: PW + 20, height: PH + 20,
            borderRadius: 12, opacity: rimGlow * Math.min(1, trace * 1.6),
            boxShadow: '-18px -8px 42px 6px rgba(185,95,240,0.42), 22px 24px 56px 12px rgba(240,150,90,0.30), 0 14px 80px 22px rgba(200,100,220,0.20)',
          }} />
          <svg width={PW + 80} height={PH + 80} viewBox={`-40 -40 ${PW + 80} ${PH + 80}`}
            style={{ position: 'absolute', left: -40, top: -40 }}>
            <defs>
              <linearGradient id="omainfg" gradientUnits="userSpaceOnUse" x1={0} y1={0} x2={PW} y2={PH}>
                <stop offset="0%" stopColor="#c07af5" />
                <stop offset="38%" stopColor="#e58bd8" />
                <stop offset="72%" stopColor="#f0b06a" />
                <stop offset="100%" stopColor="#e8925c" />
              </linearGradient>
              <filter id="ofblur" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation={10} />
              </filter>
              <filter id="ofblur2" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation={3} />
              </filter>
            </defs>
            {[1, -1].map((dir) => (
              <g key={dir}>
                <path d={FRAME_D} pathLength={PL} fill="none" stroke="url(#omainfg)"
                  strokeWidth={14} strokeLinecap="butt" filter="url(#ofblur)"
                  strokeDasharray={`${headP} ${PL}`}
                  strokeDashoffset={dir === 1 ? 0 : -(PL - headP)}
                  opacity={0.6 * rimGlow} />
                <path d={FRAME_D} pathLength={PL} fill="none" stroke="url(#omainfg)"
                  strokeWidth={3.5} strokeLinecap="butt"
                  strokeDasharray={`${headP} ${PL}`}
                  strokeDashoffset={dir === 1 ? 0 : -(PL - headP)}
                  opacity={0.95 * frameLine} />
                {trace < 1 && (
          <path d={FRAME_D} pathLength={PL} fill="none" stroke={G.card}
                    strokeWidth={6} strokeLinecap="round" filter="url(#ofblur2)"
                    strokeDasharray={`8 ${PL}`}
                    strokeDashoffset={dir === 1 ? -(Math.max(0, headP - 8)) : -(PL - headP)}
                    opacity={0.95} />
                )}
              </g>
            ))}
          </svg>
        </div>
      </div>
    </AbsoluteFill>
  );
};
