// === 可调参数 ===
// DURATION: 180（总帧数，可调；弹性段随 DURATION 等比缩放）
// 色彩: 走纸墨 G 色板（src/_fixtures/Fixtures.tsx）——文字 G.ink / 背景 G.bg / 强调 G.accent
// 功能: 展开,举证
// === 时间特性 ===
// 刚性（不可压缩）: 无（全程弹性）
// 弹性（可伸缩）: 全程可等比缩放（时长适配语音）
// === 适配注意 ===
// 调 DURATION 时只动弹性段 interpolate 关键帧，刚性核心帧区间保持固定帧数。
import React from 'react';
import { AbsoluteFill, Easing, interpolate } from 'remotion';
import { G } from '../../_fixtures/Fixtures';
import { useShotFrame } from '../../../engine/useShotFrame';
import type { ShotTime } from '../../../engine/time';

// 时长画像（迁移自 013 lens-timings.json；流式输出刚性 42-120）
const SHOT_TIME: ShotTime = {
  segments: [
    { from: 0, to: 42, mode: 'elastic', minFrames: 12 },
    { from: 42, to: 120, mode: 'rigid' },
    { from: 120, to: 180, mode: 'elastic', minFrames: 12 },
  ],
  minFrames: 102,
};

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = Easing.bezier(0.2, 0.75, 0.25, 1);

export interface StreamResponseRow {
  title: string;
  meta: string;
}

export interface StreamResponseProps {
  agentName?: string;
  query?: string;
  summaryLabel?: string;
  summary?: string;
  rows?: StreamResponseRow[];
  completeText?: string;
  completeMeta?: string;
}

const DEFAULT_ROWS: StreamResponseRow[] = [
  { title: '索引工作区', meta: '128 个文件' },
  { title: '梳理认证流程', meta: '12 个模块' },
  { title: '检查近期错误日志', meta: '无阻潜' },
  { title: '匹配接口合约', meta: '24 条路由' },
  { title: '校验权限边界', meta: '6 个角色' },
  { title: '核对发版说明', meta: '3 处变更' },
  { title: '准备实施方案', meta: '就绪' },
];

const CheckIcon: React.FC<{progress: number}> = ({progress}) => {
  const ringOpacity = interpolate(progress, [0, 0.45, 0.75], [0.36, 1, 0], clamp);
  const checkOpacity = interpolate(progress, [0.62, 1], [0, 1], clamp);
  const checkScale = interpolate(progress, [0.62, 1], [0.72, 1], {...clamp, easing: ease});

  return (
    <div style={{position: 'relative', width: 27, height: 27, flex: '0 0 auto'}}>
      <div
        style={{
          position: 'absolute', inset: 2, borderRadius: 99,
          border: `2px solid ${G.line}`,
          borderTopColor: G.accent, opacity: ringOpacity,
          transform: `rotate(${progress * 100}deg)`,
        }}
      />
      <div
        style={{
          position: 'absolute', inset: 1, borderRadius: 99,
          background: G.accent, opacity: checkOpacity,
          transform: `scale(${checkScale})`,
          display: 'grid', placeItems: 'center',
          boxShadow: `0 0 16px rgba(211,146,60,0.18)`,
        }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M3.4 8.3 6.6 11l6-6" stroke={G.card} strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </div>
  );
};

const EvidenceRow: React.FC<{cue: number; title: string; meta: string; index: number}> = ({cue, title, meta, index}) => {
  const frame = useShotFrame(SHOT_TIME);
  const body = interpolate(frame, [cue, cue + 12], [0, 1], {...clamp, easing: ease});
  const status = interpolate(frame, [cue + 3, cue + 11], [0, 1], {...clamp, easing: ease});
  return (
    <div
      style={{
        position: 'absolute', left: 0, right: 0, top: index * 68,
        height: 58, borderRadius: 13,
        border: `1px solid ${G.line}`,
        background: G.panel,
        display: 'flex', alignItems: 'center', padding: '0 20px', gap: 15,
        opacity: body,
        transform: `translateY(${18 * (1 - body)}px)`,
        filter: `blur(${6 * (1 - body)}px)`,
      }}
    >
      <CheckIcon progress={status}/>
      <div style={{fontSize: 21, color: G.ink, letterSpacing: '-0.015em', flex: 1}}>{title}</div>
      <div style={{fontSize: 16, color: status > 0.78 ? G.accent : G.mid, fontVariantNumeric: 'tabular-nums'}}>{meta}</div>
    </div>
  );
};

export const StreamResponse: React.FC<StreamResponseProps> = ({
  agentName = '工作区代理',
  query = '检查代码库并找出最稳妥的实现路径',
  summaryLabel = '结果摘要',
  summary = '代码库已准备就绪，可采用聚焦、低风险的实现方案。',
  rows = DEFAULT_ROWS,
  completeText = '分析完成',
  completeMeta = '7 项检查完成 · 可开始构建',
}) => {
  const frame = useShotFrame(SHOT_TIME);
  // 行入场时序：按行数动态（间隔 9f）
  const ROW_CUES = rows.map((_, i) => 42 + i * 9);
  const panelIn = interpolate(frame, [0, 16], [0, 1], {...clamp, easing: ease});
  const summaryT = interpolate(frame, [18, 30], [0, 1], {...clamp, easing: ease});
  const pulse = interpolate(frame, [110, 115, 120], [0.25, 0.55, 0.25], clamp);
  const complete = interpolate(frame, [110, 120], [0, 1], {...clamp, easing: ease});

  return (
    <AbsoluteFill style={{background: G.bg, fontFamily: 'Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', overflow: 'hidden'}}>

      <div
        style={{
          position: 'absolute', left: 344, top: 72, width: 1232, height: 936,
          borderRadius: 29, overflow: 'hidden',
          background: G.card,
          border: `1px solid rgba(211,146,60,${pulse})`,
          boxShadow: '0 24px 60px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.5)',
          opacity: panelIn,
          transform: `translateY(${12 * (1 - panelIn)}px) scale(${.985 + .015 * panelIn})`,
        }}
      >
        <div style={{height: 76, display: 'flex', alignItems: 'center', padding: '0 34px', borderBottom: `1px solid ${G.line}`}}>
          <div style={{width: 29, height: 29, borderRadius: 9, background: G.accent, color: G.card, display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 17}}>A</div>
          <div style={{marginLeft: 13, fontSize: 22, fontWeight: 590, color: G.ink}}>{agentName}</div>
          <div style={{marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 9, color: G.mid, fontSize: 15}}>
            <span style={{width: 7, height: 7, background: G.accent, borderRadius: 99}}/> 工作区代理
          </div>
        </div>

        <div style={{padding: '28px 38px 34px'}}>
          <div style={{height: 48, borderRadius: 12, background: G.panel, display: 'flex', alignItems: 'center', padding: '0 18px', color: G.mid, fontSize: 18}}>
            {query}
          </div>

          <div style={{height: 119, marginTop: 21, borderBottom: `1px solid ${G.line}`, overflow: 'hidden', position: 'relative'}}>
            <div style={{position: 'absolute', inset: 0, opacity: summaryT, transform: `translateY(${10 * (1 - summaryT)}px)`, clipPath: `inset(0 ${100 * (1 - summaryT)}% 0 0)`}}>
              <div style={{color: G.mid, fontSize: 15, textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 10}}>{summaryLabel}</div>
              <div style={{color: G.ink, fontSize: 26, fontWeight: 510, lineHeight: 1.35, letterSpacing: '-.022em'}}>
                {summary}
              </div>
            </div>
          </div>

          <div style={{position: 'relative', height: 466, marginTop: 17}}>
            {rows.map((row, index) => <EvidenceRow key={index} cue={ROW_CUES[index]} title={row.title} meta={row.meta} index={index}/>)}
          </div>

          <div style={{height: 60, marginTop: 2, borderTop: `1px solid ${G.line}`, display: 'flex', alignItems: 'flex-end'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: 11, opacity: complete, transform: `translateY(${5 * (1 - complete)}px)`}}>
              <div style={{width: 24, height: 24, borderRadius: 99, background: G.accent, display: 'grid', placeItems: 'center'}}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3.4 8.3 6.6 11l6-6" stroke={G.card} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <span style={{color: G.ink, fontSize: 17, fontWeight: 560}}>{completeText}</span>
              <span style={{color: G.mid, fontSize: 15}}>{completeMeta}</span>
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
