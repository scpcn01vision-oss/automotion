// === 可调参数 ===
// DURATION: 180（总帧数，可调；弹性段随 DURATION 等比缩放）
// 色彩: 走纸墨 G 色板（src/_fixtures/Fixtures.tsx）——文字 G.ink / 背景 G.bg / 强调 G.accent
// 功能: 展开,序列
// props: subject（固定第一行主题词）、words（接力动词序列）
// === 时间特性 ===
// 刚性（不可压缩）: 刚性:切词16f
// 弹性（可伸缩）: 其余段（入场/过渡/收尾/hold）可等比缩放
// === 适配注意 ===
// 调 DURATION 时只动弹性段 interpolate 关键帧，刚性核心帧区间保持固定帧数。
// word-relay-filmstrip v3 —— 批次 12 单点微调：右侧大词块（Computer+动词）
// 的垂直中心与左列当前页面卡的垂直中点（y=540）对齐（top 462→402）。
// 其余沿用 v2：对照用户截图重做（perplexity-promo01，7 张）：
// ① 左列页面卡黑白相间、每张等高（940x530，间距 105）；
// ② 左列平时静止，只在右侧切词的窗口内滚动一格（滚动与切词同步）；
// ③ 尺寸/字号/位置按截图量取：卡 x=106 宽 940，词右对齐至 x≈1710，
//    Didot 系衬线 116px，"Computer" 固定第一行，动词第二行原位灰化淡出换词。
import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { G } from '../../_fixtures/Fixtures';
import { FONT_STACK } from '../../_system/typography';

const mulberry32 = (a: number) => () => {
  let t = (a += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const CARD_W = 940;
const CARD_H = 530;
const GAP = 105;
const STEP = CARD_H + GAP;

// —— 页面卡集合：黑白相间（奇偶强制交替），内容各异 ——
const DarkArticle: React.FC<{ seed: number }> = ({ seed }) => {
  return (
    <div style={{ position: 'absolute', inset: 0, background: G.ink, padding: '38px 46px', fontFamily: FONT_STACK }}>
      <div style={{ display: 'flex', gap: 26, alignItems: 'center', marginBottom: 34 }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: G.accent }}>文章</div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 18 }}>
          {['概览', '分析', '报告', '设置'].map((t) => <div key={t} style={{ fontSize: 14, color: G.bar }}>{t}</div>)}
        </div>
      </div>
      <div style={{ width: 150, fontSize: 15, color: G.mid, marginBottom: 20 }}>专栏</div>
      <div style={{ fontSize: 34, fontWeight: 700, color: G.card, marginBottom: 14 }}>标题一</div>
      <div style={{ fontSize: 34, fontWeight: 700, color: G.card, marginBottom: 30 }}>标题二</div>
      <div style={{ display: 'flex', gap: 30 }}>
        <div style={{ flex: 1.3 }}>
          {['段落一', '段落二', '段落三', '段落四', '段落五', '段落六'].map((t) => (
            <div key={t} style={{ fontSize: 14, color: G.mid, marginBottom: 13 }}>{t}</div>
          ))}
        </div>
        <div style={{ flex: 1, border: `1px solid ${G.line}`, borderRadius: 8, background: G.side, padding: 20 }}>
          {['指标一 +18%', '指标二 2.1×', '指标三 96.4%', '指标四 24%'].map((t) => (
            <div key={t} style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 15 }}>
              <div style={{ fontSize: 14, color: G.accent, fontWeight: 700 }}>{t}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const LightMedal: React.FC<{ seed: number }> = ({ seed }) => {
  return (
    <div style={{ position: 'absolute', inset: 0, background: G.card, padding: '36px 44px', fontFamily: FONT_STACK }}>
      <div style={{ fontSize: 18, fontWeight: 700, color: G.mid, marginBottom: 14 }}>奖项</div>
      <div style={{ display: 'flex', gap: 14, marginBottom: 24 }}>
        <div style={{ fontSize: 26, fontWeight: 800, color: G.ink }}>金奖</div>
        <div style={{ fontSize: 26, fontWeight: 800, color: G.accent }}>银奖</div>
      </div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 22 }}>
        {['最佳', '创新', '设计', '体验', '效率', '协作', '成长'].map((t, i) => (
          <div key={t} style={{ padding: '5px 12px', fontSize: 13, fontWeight: 700, borderRadius: 12, background: i === 0 ? G.accent : G.nav, border: i === 0 ? 'none' : `1px solid ${G.line}`, color: i === 0 ? G.side : G.ink }}>{t}</div>
        ))}
      </div>
      <div style={{ height: 34, borderRadius: 6, border: `1px solid ${G.line}`, marginBottom: 26, display: 'flex', alignItems: 'center', padding: '0 14px', fontSize: 14, color: G.mid }}>评审概要</div>
      <div style={{ display: 'flex', gap: 16 }}>
        {['创新度', '完成度', '影响力'].map((c, ci) => (
          <div key={c} style={{ flex: 1, border: `1px solid ${G.line}`, borderRadius: 8, padding: 18 }}>
            <div style={{ fontSize: 13, color: G.mid, marginBottom: 12 }}>{c}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: G.ink, marginBottom: 10 }}>{['8.9', '9.2', '7.6'][ci]}</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ width: 20, height: 13, background: G.accent, borderRadius: 2 }} />
              <div style={{ fontSize: 12, color: G.mid }}>评级 A</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const DarkStats: React.FC<{ seed: number }> = ({ seed }) => {
  return (
    <div style={{ position: 'absolute', inset: 0, background: G.side, padding: '44px 52px', fontFamily: FONT_STACK }}>
      <div style={{ borderLeft: `3px solid ${G.accent}`, paddingLeft: 34 }}>
        {[
          { label: '指标一', value: '92%', accent: false }, { label: '指标二', value: '74%', accent: false }, { label: '指标三', value: '58%', accent: false }, { label: '指标四', value: '118%', accent: true },
        ].map((row, i) => (
          <div key={i} style={{ display: 'flex', gap: 20, alignItems: 'center', marginBottom: 26 }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: row.accent ? G.accent : G.card, width: 92 }}>{row.value}</div>
            <div style={{ width: 130, fontSize: 15, color: G.bar }}>{row.label}</div>
            <div style={{ fontSize: 13, color: G.mid }}>{row.accent ? '重点' : '常态'}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 30, background: G.ink, borderRadius: 8, padding: '22px 30px', display: 'flex', gap: 60 }}>
        {['概览', '明细', '汇总'].map((t, i) => (
          <div key={i}>
            <div style={{ fontSize: 16, fontWeight: 800, color: G.card, marginBottom: 10 }}>{t}</div>
            <div style={{ fontSize: 13, color: G.mid }}>{['数值一', '数值二', '数值三'][i]}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const LightTable: React.FC<{ seed: number }> = ({ seed }) => {
  return (
    <div style={{ position: 'absolute', inset: 0, background: G.card, padding: '34px 44px', fontFamily: FONT_STACK }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 26 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ width: 34, height: 22, background: G.accent, borderRadius: 4 }} />
          <div style={{ fontSize: 18, fontWeight: 800, color: G.ink }}>数据表</div>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ fontSize: 14, color: G.mid }}>筛选</div>
          <div style={{ fontSize: 14, color: G.mid }}>排序</div>
        </div>
      </div>
      {['任务 01', '任务 02', '任务 03', '任务 04', '任务 05', '任务 06', '任务 07'].map((t, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '13px 0', borderBottom: `1px solid ${G.line}` }}>
          <div style={{ fontSize: 14, color: G.mid, width: 60 }}>{['A', 'B', 'C', 'D', 'E', 'F', 'G'][i]}</div>
          <div style={{ width: 26, height: 16, background: [G.accent, G.mid, G.bar, G.side][i % 4], borderRadius: 2, opacity: 0.85 }} />
          <div style={{ fontSize: 16, fontWeight: 600, color: G.ink }}>{t}</div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 46 }}>
            <div style={{ fontSize: 13, color: i % 3 === 1 ? G.mid : G.line }}>{i % 3 === 1 ? '编辑' : '已读'}</div>
            <div style={{ fontSize: 13, color: i % 3 === 2 ? G.accent : G.line }}>{i % 3 === 2 ? '收藏' : '已读'}</div>
            <div style={{ fontSize: 13, color: G.mid }}>{['8:00', '9:30', '11:00', '14:00', '16:30', '18:00', '20:30'][i]}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

const DarkMri: React.FC = () => (
  <div style={{ position: 'absolute', inset: 0, background: G.ink, padding: 0, fontFamily: FONT_STACK }}>
    <div style={{ height: 44, borderBottom: `1px solid ${G.line}`, display: 'flex', alignItems: 'center', gap: 16, padding: '0 26px' }}>
      <div style={{ fontSize: 16, fontWeight: 700, color: G.card, opacity: 0.8 }}>影像查看</div>
      <div style={{ marginLeft: 'auto', fontSize: 13, color: G.mid }}>扫描</div>
    </div>
    <div style={{ display: 'flex', height: CARD_H - 44 }}>
      <div style={{ width: 190, borderRight: `1px solid ${G.line}`, padding: 20 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: G.accent, marginBottom: 14 }}>序列</div>
        {['影像 01', '影像 02', '影像 03', '影像 04', '影像 05'].map((t, i) => (
          <div key={t} style={{ fontSize: 13, color: G.bar, marginBottom: 10 }}>{t}</div>
        ))}
        <div style={{ marginTop: 24, width: 44, height: 130, margin: '24px auto 0', border: `1px solid ${G.mid}`, borderRadius: 6 }} />
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          width: 300, height: 360, borderRadius: 16,
          background: 'radial-gradient(ellipse 46% 40% at 50% 42%, #b9bcc0 0%, #6c7076 34%, #33363c 62%, #101216 100%)',
          position: 'relative',
        }}>
          {[[120, 100], [200, 150], [96, 210]].map(([x, y], i) => (
            <div key={i} style={{ position: 'absolute', left: x, top: y, width: 12, height: 12, borderRadius: 6, border: '2px solid #d8b25a' }} />
          ))}
        </div>
      </div>
      <div style={{ width: 170, borderLeft: `1px solid ${G.line}`, padding: 18 }}>
        {['参数 01', '参数 02', '参数 03', '参数 04', '参数 05', '参数 06', '参数 07', '参数 08'].map((t, i) => (
          <div key={t} style={{ fontSize: 12, color: G.mid, marginBottom: 11 }}>{t}</div>
        ))}
      </div>
    </div>
  </div>
);

const LightPortfolio: React.FC = () => (
  <div style={{ position: 'absolute', inset: 0, background: G.panel, padding: '40px 60px', textAlign: 'center', fontFamily: FONT_STACK }}>
    <div style={{ fontSize: 28, fontWeight: 800, color: G.ink, margin: '10px auto 18px' }}>作品集</div>
    {['简介一', '简介二', '简介三'].map((t, i) => (
      <div key={t} style={{ width: [420, 470, 300][i], fontSize: 15, color: G.mid, margin: '0 auto 11px' }}>{t}</div>
    ))}
    <div style={{ display: 'flex', gap: 18, marginTop: 36 }}>
      {['项目一', '项目二', '项目三', '项目四'].map((t, i) => (
        <div key={t} style={{ flex: 1, height: 150, background: G.card, border: `1px solid ${G.line}`, borderRadius: 10, padding: 16, textAlign: 'left' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: G.ink, marginBottom: 12 }}>{t}</div>
          <div style={{ fontSize: 13, color: G.mid, marginBottom: 8 }}>说明一</div>
          <div style={{ fontSize: 13, color: G.mid }}>说明二</div>
        </div>
      ))}
    </div>
  </div>
);

// 黑白相间的固定顺序（奇偶交替）
const CARDS: React.FC<{ seed: number }>[] = [
  ({ seed }) => <DarkArticle seed={seed} />,
  ({ seed }) => <LightMedal seed={seed} />,
  () => <DarkMri />,
  ({ seed }) => <LightTable seed={seed} />,
  ({ seed }) => <DarkStats seed={seed} />,
  () => <LightPortfolio />,
];

// 切词窗口：第一个词入场 f14–30；换词 f62–78、f108–124
const SWITCHES = [14, 62, 108];
const SW_DUR = 16;
const SERIF = '"Didot", "Bodoni 72", "Playfair Display", Georgia, serif';

export interface WordRelayFilmstripProps {
  subject?: string;
  words?: string[];
}

export const WordRelayFilmstrip: React.FC<WordRelayFilmstripProps> = ({
  subject = 'Computer',
  words = ['researches', 'builds', 'codes'],
}) => {
  const frame = useCurrentFrame();

  // —— 滚动步进：平时静止，仅在切词窗口内滚一格（ease-in-out）——
  let stepF = 0;
  SWITCHES.forEach((s) => {
    const p = interpolate(frame, [s, s + SW_DUR], [0, 1], {
      extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    });
    // easeInOutCubic
    stepF += p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
  });
  const scroll = stepF * STEP;

  // 卡片布局：中心卡顶 y=275，向两侧铺开；黑白相间
  const total = CARDS.length * STEP;
  const cards: React.ReactNode[] = [];
  for (let rep = -1; rep < 2; rep++) {
    CARDS.forEach((C, i) => {
      const y = 275 + i * STEP + rep * total - scroll;
      if (y > 1200 || y < -CARD_H - 120) return;
      cards.push(
        <div key={`${rep}-${i}`} style={{
          position: 'absolute', top: y, left: 106, width: CARD_W, height: CARD_H,
          borderRadius: 12, overflow: 'hidden',
          boxShadow: '0 12px 40px rgba(30,26,20,0.14)',
          border: '1px solid rgba(0,0,0,0.06)', background: '#fff',
        }}>
          <C seed={(i + 1) * 733} />
        </div>,
      );
    });
  }

  // —— 右侧词接力：原位交叉淡（旧词灰化淡出，新词淡入，不位移）——
  const wordStyle: React.CSSProperties = {
    fontFamily: SERIF, fontWeight: 400, fontSize: 116, lineHeight: 1.18,
    letterSpacing: '0.002em', textAlign: 'right', whiteSpace: 'nowrap',
  };
  // 每个词的生命周期：入场淡入（黑）→ 常驻黑 → 下个切点前 14 帧灰化
  //（截图 4/6 捕捉到的就是"旧词已灰、新词未现"的状态）→ 切点起淡出。
  const smooth = (x: number) => x * x * (3 - 2 * x);
  const wordNodes = words.map((w, i) => {
    const sIn = SWITCHES[i];
    const sOut = i + 1 < SWITCHES.length ? SWITCHES[i + 1] : null;
    // 新词后半窗口淡入（避免与旧词叠影）
    const pIn = interpolate(frame, [sIn + 7, sIn + SW_DUR], [0, 1], {
      extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    });
    if (i === 0 ? frame < sIn : pIn <= 0) return null;
    const pInEff = i === 0 ? interpolate(frame, [sIn, sIn + 12], [0, 1], {
      extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    }) : pIn;
    // 灰化：切点前 14 帧开始，切点时已全灰
    const grey = sOut ? interpolate(frame, [sOut - 14, sOut - 2], [0, 1], {
      extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    }) : 0;
    // 淡出：切点起前半窗口内出完
    const pOut = sOut ? interpolate(frame, [sOut, sOut + 8], [1, 0], {
      extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    }) : 1;
    const op = smooth(pInEff) * smooth(pOut);
    if (op <= 0) return null;
    const mix = smooth(grey);
    const ch = Math.round(0x19 + (0x9d - 0x19) * mix);
    return (
      <div key={w} style={{
        ...wordStyle, position: 'absolute', right: 0, top: 0,
        color: `rgb(${ch},${Math.round(0x19 + (0x98 - 0x19) * mix)},${Math.round(0x19 + (0x8e - 0x19) * mix)})`,
        opacity: op,
      }}>
        {w}
      </div>
    );
  });

  return (
    <AbsoluteFill style={{ background: G.bg }}>
      <div style={{ position: 'absolute', inset: 0 }}>{cards}</div>
      {/* 右侧词组：Computer 固定第一行，动词第二行原位换词。
          v3：块总高≈137(Computer 行)+140(词行容器)=277，垂直中心须对齐
          当前页面卡中点 y=540（卡顶 275 + 卡高 530/2）→ top=540-277/2≈402 */}
      <div style={{ position: 'absolute', right: 210, top: 402 }}>
        <div style={{ ...wordStyle, color: G.ink }}>{subject}</div>
        <div style={{ position: 'relative', height: 140 }}>{wordNodes}</div>
      </div>
    </AbsoluteFill>
  );
};
