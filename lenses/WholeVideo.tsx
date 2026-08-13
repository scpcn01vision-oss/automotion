// M5 整片合成组件（通用）：消费 storyboard + subtitles → 段 Sequence 串联 + 字幕层
// 用法：props 传入 { storyboard, subtitles }（项目侧数据），时长 = 段 durationSec（真实转录）
// 预览/导出：remotion render 本组件 + --props（项目侧数据不进仓库）
import React from 'react';
import { AbsoluteFill, Audio, Sequence, useCurrentFrame } from 'remotion';
import type { Storyboard, Subtitles, SubtitleStyle } from '../shared/types';
import {
  DEFAULT_SUBTITLE_STYLE,
  hexToRgba,
  type ResolvedSubtitleStyle,
} from '../shared/subtitleDefaults';

// ---------- 镜头组件映射（lensId → 组件；新增镜头时补 import + 映射） ----------
import { MarkerUnderlineTitle } from './native/marker-underline-title/MarkerUnderlineTitle';
import { TextAsMask } from './light/text-as-mask/TextAsMask';
import { MaskingTapeSlap } from './native/paper-craft-moves/MaskingTapeSlap';
import { BeatStepListThemeCycle } from './minimal/beat-step-list-theme-cycle/BeatStepListThemeCycle';
import { StreamResponse } from './medium/ai-stream-response/StreamResponse';
import { CelFlashStomp } from './typography/cel-flash-stomp/CelFlashStomp';
import { RedHeadFileQuote } from './native/redhead-file-quote/RedHeadFileQuote';
import { VersusSlam } from './minimal/transition-hidden-cut/VersusSlam';
import { LightLeakBurn } from './minimal/transition-hidden-cut/LightLeakBurn';
import { BarnDoorSplit } from './native/page-turn-transitions/BarnDoorSplit';
import { CardFlipReveal } from './light/card-flip-reveal/CardFlipReveal';
import { PopupBookRise } from './native/paper-craft-moves/PopupBookRise';
import { CornerSpotlightReveal } from './medium/spotlight-sweep-moves/CornerSpotlightReveal';
import { OdometerDigitRoll } from './medium/odometer-digit-roll/OdometerDigitRoll';
import { HashtagToPillMaterialize } from './medium/hashtag-to-pill-materialize/HashtagToPillMaterialize';
import { InkBleedReveal } from './native/print-texture-transitions/InkBleedReveal';
import { GridWaveFlip } from './medium/wall-reveal-moves/GridWaveFlip';
import { CommandPaletteSummon } from './medium/command-palette-summon/CommandPaletteSummon';
import { TitleDemoteToLabel } from './light/title-demote-to-label/TitleDemoteToLabel';
import { SplitTextStagger } from './light/type-assembly-moves/SplitTextStagger';
import { OscilloscopeStream } from './data/oscilloscope-stream/OscilloscopeStream';
import { TypewriterErrorRetype } from './native/typewriter-moves/TypewriterErrorRetype';
import { InvisibleCut } from './minimal/transition-hidden-cut/InvisibleCut';
import { IntegrationHubMap } from './ui-entrance/integration-hub-map/IntegrationHubMap';
import { UiStripAwayOutro } from './light/ui-strip-away-outro/UiStripAwayOutro';
import { IconFlipBloomLogo } from './light/ui-to-brand-morph/IconFlipBloomLogo';
import { OutroGroupPhotoLaunch } from './tplshots/wrappers';
import { PaperTitleCard } from './opening/paper-title-card/PaperTitleCard';

export const LENS_MAP: Record<string, React.FC<any>> = {
  MarkerUnderlineTitle,
  TextAsMask,
  MaskingTapeSlap,
  BeatStepListThemeCycle,
  StreamResponse,
  CelFlashStomp,
  RedHeadFileQuote,
  VersusSlam,
  LightLeakBurn,
  BarnDoorSplit,
  CardFlipReveal,
  PopupBookRise,
  CornerSpotlightReveal,
  OdometerDigitRoll,
  HashtagToPillMaterialize,
  InkBleedReveal,
  GridWaveFlip,
  CommandPaletteSummon,
  TitleDemoteToLabel,
  SplitTextStagger,
  OscilloscopeStream,
  TypewriterErrorRetype,
  InvisibleCut,
  IntegrationHubMap,
  UiStripAwayOutro,
  IconFlipBloomLogo,
  OutroGroupPhotoLaunch,
  PaperTitleCard,
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
// audioSrc：项目侧录音的 http 地址（由 server 音频路由服务，浏览器才能加载）
export const WholeVideo: React.FC<{
  storyboard: Storyboard;
  subtitles: Subtitles;
  audioSrc?: string;
}> = ({ storyboard, subtitles, audioSrc }) => {
  const style = storyboard.meta.subtitleStyle ?? {};
  let cumSec = 0;
  return (
    <AbsoluteFill style={{ background: '#faf7f2' }}>
      {audioSrc ? <Audio src={audioSrc} /> : null}
      {storyboard.segments.map((seg) => {
        // 精确帧边界：逐段 round，避免累积漂移；帧边界由真实秒数派生
        const startFrame = Math.round(cumSec * 30);
        const endFrame = Math.round((cumSec + seg.durationSec) * 30);
        const dur = Math.max(1, endFrame - startFrame);
        const Comp = LENS_MAP[seg.lensId];
        const el = Comp ? (
          <Sequence key={seg.id} from={startFrame} durationInFrames={dur}>
            <Comp {...(seg.params as any)} />
          </Sequence>
        ) : null;
        cumSec += seg.durationSec;
        return el;
      })}
      {style.enabled !== false && <SubtitleLayer subtitles={subtitles} style={style} />}
    </AbsoluteFill>
  );
};
