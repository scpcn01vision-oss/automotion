// M5 整片合成组件（通用）：消费 storyboard + subtitles → 段 Sequence 串联 + 字幕层
// 用法：props 传入 { storyboard, subtitles }（项目侧数据），时长 = 段 durationSec（真实转录）
// 预览/导出：remotion render 本组件 + --props（项目侧数据不进仓库）
import React from 'react';
import { AbsoluteFill, Audio, Sequence, interpolate, useCurrentFrame } from 'remotion';
import type { Storyboard, Subtitles, SubtitleStyle } from '../shared/types';
import {
  DEFAULT_SUBTITLE_STYLE,
  hexToRgba,
  type ResolvedSubtitleStyle,
} from '../shared/subtitleDefaults';

// ---------- 镜头组件加载（与 registry 同源，消除手工映射表） ----------
// 旧机制：整片用一份手写 LENS_MAP（仅 29 个），而匹配/工作台开放全部 122 个镜头，
// 未登记镜头被静默渲染成空白（Comp ? 渲染 : null），造成"工作台调好、整片缺镜头"。
// 新机制：webpack require.context 按 registry.file 动态解析组件——渲染面自动等于镜头库，
// 新增镜头进 registry 即自动可渲染；缺文件/缺导出/不在 registry 直接抛错，绝不静默。
declare global {
  namespace NodeJS {
    interface Require {
      context(
        directory: string,
        useSubdirectories: boolean,
        regExp: RegExp,
      ): (key: string) => Record<string, unknown>;
    }
  }
}

const lensContext = require.context('./', true, /\.tsx$/);
const registryJson = require('../shared/registry.json') as {
  entries: { id: string; file: string }[];
};
const registryById = new Map(registryJson.entries.map((e) => [e.id, e]));

const lensCache: Record<string, React.FC<any>> = {};
const getLensComponent = (id: string, file: string): React.FC<any> => {
  if (lensCache[id]) return lensCache[id];
  const key = './' + file.replace(/^lenses\//, '');
  const mod = lensContext(key);
  const comp = mod?.[id];
  if (typeof comp !== 'function') {
    throw new Error(`[整片] 镜头未找到或导出缺失：${id}（${file}）`);
  }
  lensCache[id] = comp as React.FC<any>;
  return comp as React.FC<any>;
};

// ---------- 字幕层（样式映射自工作台保存的 subtitleStyle） ----------
const SubtitleLayer: React.FC<{ subtitles: Subtitles; style: SubtitleStyle }> = ({ subtitles, style }) => {
  const frame = useCurrentFrame();
  const sec = frame / 30;
  const active = subtitles.entries.find((e) => sec >= e.startSec && sec <= e.endSec);
  if (!active) return null;

  // 统一默认值：与工作台字幕表单同一份 DEFAULT_SUBTITLE_STYLE（杜绝"表单显示 0、渲染 4px"类漂移）
  const eff: ResolvedSubtitleStyle = { ...DEFAULT_SUBTITLE_STYLE, ...style };

  const css: React.CSSProperties = {
    position: 'absolute',
    left: 0,
    right: 0,
    display: 'flex',
    justifyContent: eff.align === 'left' ? 'flex-start' : eff.align === 'right' ? 'flex-end' : 'center',
    alignItems: eff.position === 'top' ? 'flex-start' : eff.position === 'center' ? 'center' : 'flex-end',
    top: eff.position === 'top' ? '8%' : undefined,
    bottom: eff.position === 'bottom' ? '8%' : undefined,
    height: eff.position === 'center' ? '100%' : undefined,
    pointerEvents: 'none',
    opacity: eff.opacity / 100,
  };

  // 外描边：8 方向零模糊投影（不遮字面），与工作台字幕预览同实现；
  // 宽度 0 / 关开关 / 透明描边色 → 不输出描边
  const strokeR = eff.strokeEnabled === false ? 0 : eff.strokeWidth;
  const strokeColor = eff.strokeColor && eff.strokeColor !== 'transparent' ? eff.strokeColor : null;
  const strokeShadows =
    strokeR > 0 && strokeColor
      ? [
          `${strokeR}px 0 0 ${strokeColor}`,
          `-${strokeR}px 0 0 ${strokeColor}`,
          `0 ${strokeR}px 0 ${strokeColor}`,
          `0 -${strokeR}px 0 ${strokeColor}`,
          `${strokeR * 0.71}px ${strokeR * 0.71}px 0 ${strokeColor}`,
          `-${strokeR * 0.71}px ${strokeR * 0.71}px 0 ${strokeColor}`,
          `${strokeR * 0.71}px -${strokeR * 0.71}px 0 ${strokeColor}`,
          `-${strokeR * 0.71}px -${strokeR * 0.71}px 0 ${strokeColor}`,
        ]
      : [];
  const softShadow =
    (eff.shadowBlur ?? 0) > 0 && (eff.shadowOpacity ?? 0) > 0
      ? [
          `${eff.shadowOffsetX}px ${eff.shadowOffsetY}px ${eff.shadowBlur}px ${hexToRgba(
            eff.shadowColor,
            eff.shadowOpacity / 100,
          )}`,
        ]
      : [];

  const textCss: React.CSSProperties = {
    fontFamily: eff.fontFamily || '-apple-system, "Segoe UI", "Microsoft YaHei", sans-serif',
    fontSize: eff.fontSize,
    fontWeight: eff.fontWeight,
    fontStyle: eff.fontStyle,
    lineHeight: eff.lineHeight,
    color: eff.color,
    letterSpacing: eff.letterSpacing,
    textAlign: eff.align,
    maxWidth: 1260,
    padding:
      eff.backgroundEnabled !== false && eff.backgroundColor && eff.backgroundColor !== 'transparent'
        ? `${eff.backgroundPadding}px`
        : undefined,
    borderRadius: eff.backgroundEnabled === false ? 0 : eff.backgroundRadius,
    background:
      eff.backgroundEnabled !== false && eff.backgroundColor && eff.backgroundColor !== 'transparent'
        ? hexToRgba(eff.backgroundColor, eff.backgroundOpacity / 100)
        : undefined,
    textShadow: [...strokeShadows, ...softShadow].join(', ') || undefined,
  };

  return (
    <div style={css}>
      <div style={textCss}>{active.text}</div>
    </div>
  );
};

// ---------- 整片 ----------
// 镜头间过渡：淡入淡出（A 方案——淡到纸底再淡入下一段），每段首尾各 0.4s（12 帧）
const FADE_FRAMES = 12;
const ShotTransition: React.FC<{ dur: number; children: React.ReactNode }> = ({ dur, children }) => {
  const frame = useCurrentFrame(); // Sequence 内相对帧（0..dur-1）
  const fadeIn = interpolate(frame, [0, FADE_FRAMES], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const fadeOut = interpolate(frame, [dur - FADE_FRAMES, dur - 1], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const opacity = Math.min(fadeIn, fadeOut);
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};

// audioSrc：项目侧录音的 http 地址（由 server 音频路由服务，浏览器才能加载）
export const WholeVideo: React.FC<{
  storyboard: Storyboard;
  subtitles: Subtitles;
  audioSrc?: string;
}> = ({ storyboard, subtitles, audioSrc }) => {
  const style = storyboard.meta.subtitleStyle ?? {};
  // 段边界定位：绝对时间戳（seg.startSec，转录阶段写入），禁止用 durationSec 累计——
  // 累计会丢弃段间停顿与前导静音，偏差逐段累积（2026-08-22 教训：seg-04 早 ~1s、片尾早 ~5.6s）。
  // 第一段从 0 开始（片头覆盖前导静音）；旧数据缺 startSec 时回退累计并告警。
  let cumSec = 0;
  return (
    <AbsoluteFill style={{ background: '#faf7f2' }}>
      {audioSrc ? <Audio src={audioSrc} /> : null}
      {storyboard.segments.map((seg, i) => {
        const hasAbs = typeof seg.startSec === 'number';
        if (!hasAbs) {
          console.warn(`[whole] 段 ${seg.id} 缺 startSec（旧数据），回退累计定位`);
        }
        const startSec = i === 0 ? 0 : (hasAbs ? (seg.startSec as number) : cumSec);
        // 帧边界逐段 round（绝对时间戳 → 帧），禁止累计 cursor（会漂移）
        const startFrame = Math.round(startSec * 30);
        const endFrame = Math.round((startSec + seg.durationSec) * 30);
        const dur = Math.max(1, endFrame - startFrame);
        const entry = registryById.get(seg.lensId);
        if (!entry) {
          throw new Error(`[整片] storyboard 镜头不在 registry：${seg.lensId}`);
        }
        // 统一 dev 提示：镜头声明了口播锚点但 params 未提供 → 静默退化弹刚，画面与口播脱节
        const anchorProp = ((entry as any).props || []).find((p: any) =>
          p.name === 'cueSec' || p.name === 'revealAtSec',
        );
        if (anchorProp) {
          const needCue = anchorProp.name === 'cueSec';
          const provided = needCue
            ? Array.isArray((seg.params as any)?.cueSec)
            : typeof (seg.params as any)?.revealAtSec === 'number';
          if (!provided) {
            console.warn(
              `[整片] ${seg.id} ${seg.lensId} 声明了口播锚点(${anchorProp.name})但 params 未提供——` +
                '画面内容将不与口播对齐，请运行 scripts/generate-cues.py 后过 scripts/check-cues.py',
            );
          }
        }
        const Comp = getLensComponent(entry.id, entry.file);
        const el = (
          <Sequence key={seg.id} from={startFrame} durationInFrames={dur}>
            <ShotTransition dur={dur}>
              <Comp {...(seg.params as any)} />
            </ShotTransition>
          </Sequence>
        );
        cumSec += seg.durationSec;
        return el;
      })}
      {style.enabled !== false && <SubtitleLayer subtitles={subtitles} style={style} />}
    </AbsoluteFill>
  );
};
