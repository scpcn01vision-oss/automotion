// M5 整片合成组件（通用）：消费 storyboard + subtitles → 段 Sequence 串联 + 字幕层
// 用法：props 传入 { storyboard, subtitles }（项目侧数据），时长 = 段 durationSec（真实转录）
// 预览/导出：remotion render 本组件 + --props（项目侧数据不进仓库）
import React from 'react';
import { AbsoluteFill, Sequence, useCurrentFrame } from 'remotion';
import type { Storyboard, Subtitles, SubtitleStyle } from '../shared/types';

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

  const css: React.CSSProperties = {
    position: 'absolute',
    left: 0,
    right: 0,
    display: 'flex',
    justifyContent: style.align === 'left' ? 'flex-start' : style.align === 'right' ? 'flex-end' : 'center',
    alignItems: style.position === 'top' ? 'flex-start' : style.position === 'center' ? 'center' : 'flex-end',
    top: style.position === 'top' ? 80 : undefined,
    bottom: style.position === 'bottom' ? 80 : undefined,
    height: style.position === 'center' ? '100%' : undefined,
    pointerEvents: 'none',
    opacity: style.opacity !== undefined ? style.opacity / 100 : 1,
  };

  const textCss: React.CSSProperties = {
    fontFamily: style.fontFamily ?? 'Helvetica, Arial, sans-serif',
    fontSize: style.fontSize ?? 48,
    fontWeight: style.fontWeight ?? 700,
    fontStyle: style.fontStyle ?? 'normal',
    lineHeight: style.lineHeight ?? 1.6,
    color: style.color ?? '#ffffff',
    letterSpacing: style.letterSpacing ?? 0,
    textAlign: style.align ?? 'center',
    maxWidth: 1260,
    padding: style.backgroundEnabled === false ? undefined : `${style.backgroundPadding ?? 16}px ${(style.backgroundPadding ?? 16) * 1.5}px`,
    borderRadius: style.backgroundEnabled === false ? undefined : (style.backgroundRadius ?? 12),
    background: style.backgroundEnabled === false ? undefined : (style.backgroundColor ?? 'rgba(0,0,0,0.55)'),
    WebkitTextStroke: style.strokeEnabled === false ? undefined : `${style.strokeWidth ?? 4}px ${style.strokeColor ?? '#2c2416'}`,
    textShadow:
      style.shadowBlur && style.shadowBlur > 0
        ? `${style.shadowOffsetX ?? 0}px ${style.shadowOffsetY ?? 4}px ${style.shadowBlur}px rgba(0,0,0,${(style.shadowOpacity ?? 60) / 100})`
        : undefined,
  };

  return (
    <div style={css}>
      <div style={textCss}>{active.text}</div>
    </div>
  );
};

// ---------- 整片 ----------
export const WholeVideo: React.FC<{ storyboard: Storyboard; subtitles: Subtitles }> = ({
  storyboard,
  subtitles,
}) => {
  const style = storyboard.meta.subtitleStyle ?? {};
  let cumSec = 0;
  return (
    <AbsoluteFill style={{ background: '#faf7f2' }}>
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
