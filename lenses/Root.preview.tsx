import { Composition, registerRoot } from "remotion";

// ============ 纸墨原生（native）============
import { BrandFrameSnap } from "./native/brand-frame-snap/BrandFrameSnap.tsx";
import { DrawSvgTrace } from "./native/draw-svg-trace/DrawSvgTrace.tsx";
import { LetterspaceMaterialize } from "./native/letterspace-materialize/LetterspaceMaterialize.tsx";
import { LineBoil } from "./native/line-boil/LineBoil.tsx";
import { MarkerUnderlineTitle } from "./native/marker-underline-title/MarkerUnderlineTitle.tsx";
import { BarnDoorSplit } from "./native/page-turn-transitions/BarnDoorSplit.tsx";
import { CubeRotate } from "./native/page-turn-transitions/CubeRotate.tsx";
import { PageWaterfallWall } from "./native/page-waterfall-wall/PageWaterfallWall.tsx";
import { VerticalTickerWrapper } from "./native/page-waterfall-wall/VerticalTickerWrapper.tsx";
import { MaskingTapeSlap } from "./native/paper-craft-moves/MaskingTapeSlap.tsx";
import { PopupBookRise } from "./native/paper-craft-moves/PopupBookRise.tsx";
import { PaperPlaneMessenger } from "./native/paper-plane-messenger/PaperPlaneMessenger.tsx";
import { InkBleedReveal } from "./native/print-texture-transitions/InkBleedReveal.tsx";
import { RisoBeatPump } from "./native/riso-print-hits/RisoBeatPump.tsx";
import { RisoMisregistrationHit } from "./native/riso-print-hits/RisoMisregistrationHit.tsx";
import { SplitFlapFlip } from "./native/split-flap-title/SplitFlapFlip.tsx";
import { StrokeSegmentBuild } from "./native/stroke-segment-build/StrokeSegmentBuild.tsx";
import { TerminalTypewriter } from "./native/typewriter-moves/TerminalTypewriter.tsx";
import { TypewriterErrorRetype } from "./native/typewriter-moves/TypewriterErrorRetype.tsx";

// ============ 极轻（minimal）============
import { BeatCutAccelerando } from "./minimal/beat-cut-moves/BeatCutAccelerando.tsx";
import { PaparazziFlash } from "./minimal/beat-cut-moves/PaparazziFlash.tsx";
import { BottomPushStackWipe } from "./minimal/bottom-push-stack-wipe/BottomPushStackWipe.tsx";
import { CircleMatchIris } from "./minimal/circle-match-iris/CircleMatchIris.tsx";
import { ColorBlockStepWipe } from "./minimal/color-block-step-wipe/ColorBlockStepWipe.tsx";
import { CraneRiseReveal } from "./minimal/crane-rise-reveal/CraneRiseReveal.tsx";
import { DollyZoomReal } from "./minimal/depth-layer-moves/DollyZoomReal.tsx";
import { MultiplaneReal } from "./minimal/depth-layer-moves/MultiplaneReal.tsx";
import { LogoStingButton } from "./minimal/edit-hook-moves/LogoStingButton.tsx";
import { GrazeFaceTour } from "./minimal/graze-face-tour/GrazeFaceTour.tsx";
import { LineCarryTransition } from "./minimal/line-carry-transition/LineCarryTransition.tsx";
import { DominoCascade } from "./minimal/montage-rhythm-moves/DominoCascade.tsx";
import { DropBlackoutSlam } from "./minimal/montage-rhythm-moves/DropBlackoutSlam.tsx";
import { WrightTripleCut } from "./minimal/montage-rhythm-moves/WrightTripleCut.tsx";
import { OverheadTabletopDrop } from "./minimal/overhead-camera-moves/OverheadTabletopDrop.tsx";
import { TiltReveal } from "./minimal/overhead-camera-moves/TiltReveal.tsx";
import { JumpCutPunchIn } from "./minimal/rhythm-interrupt-moves/JumpCutPunchIn.tsx";
import { StrobeBlackFrames } from "./minimal/rhythm-interrupt-moves/StrobeBlackFrames.tsx";
import { RunwayGroundSkim } from "./minimal/runway-ground-skim/RunwayGroundSkim.tsx";
import { MaskWipeReal } from "./minimal/shot-transitions/MaskWipeReal.tsx";
import { PortalWipeV2 } from "./minimal/shot-transitions/PortalWipeV2.tsx";
import { WhipBrakeReal } from "./minimal/shot-transitions/WhipBrakeReal.tsx";
import { WhipPanReal } from "./minimal/shot-transitions/WhipPanReal.tsx";
import { SmearMultiples } from "./minimal/smear-multiples/SmearMultiples.tsx";
import { DroneDiveLanding } from "./minimal/space-camera-moves/DroneDiveLanding.tsx";
import { ExplodedView } from "./minimal/space-camera-moves/ExplodedView.tsx";
import { FreezeAnnotateReal } from "./minimal/speed-ramp-freeze/FreezeAnnotateReal.tsx";
import { SpeedRampReal } from "./minimal/speed-ramp-freeze/SpeedRampReal.tsx";
import { SteepTiltGlide } from "./minimal/steep-tilt-glide/SteepTiltGlide.tsx";
import { BulletTimeFreezeOrbit } from "./minimal/tension-camera-moves/BulletTimeFreezeOrbit.tsx";
import { DutchRollToLevel } from "./minimal/tension-camera-moves/DutchRollToLevel.tsx";
import { PullBackIsolation } from "./minimal/tension-camera-moves/PullBackIsolation.tsx";
import { SlowPushIn } from "./minimal/tension-camera-moves/SlowPushIn.tsx";
import { CardFootageCadence } from "./minimal/trailer-grammar-moves/CardFootageCadence.tsx";
import { SmashCut } from "./minimal/trailer-grammar-moves/SmashCut.tsx";
import { TrailerBumper } from "./minimal/trailer-grammar-moves/TrailerBumper.tsx";
import { InvisibleCut } from "./minimal/transition-hidden-cut/InvisibleCut.tsx";
import { LightLeakBurn } from "./minimal/transition-hidden-cut/LightLeakBurn.tsx";
import { VersusSlam } from "./minimal/transition-hidden-cut/VersusSlam.tsx";
import { LetterformZoom } from "./minimal/transition-travel/LetterformZoom.tsx";
import { SharedElementMorph } from "./minimal/transition-travel/SharedElementMorph.tsx";
import { BlindsSlice } from "./minimal/wipe-transitions/BlindsSlice.tsx";
import { ClockWipe } from "./minimal/wipe-transitions/ClockWipe.tsx";

// ============ 轻（light）============
import { CardFlipReveal } from "./light/card-flip-reveal/CardFlipReveal.tsx";
import { CardFlockTumble } from "./light/card-flock-tumble/CardFlockTumble.tsx";
import { ClonerDepthEcho } from "./light/cloner-depth-echo/ClonerDepthEcho.tsx";
import { AxialStretch } from "./light/element-body-moves/AxialStretch.tsx";
import { ContactShadowLift } from "./light/element-body-moves/ContactShadowLift.tsx";
import { MorphFromPrimitive } from "./light/morph-from-primitive/MorphFromPrimitive.tsx";
import { ImpactBurstKit } from "./light/slam-entrance-moves/ImpactBurstKit.tsx";
import { KanadaPerspectiveSnap } from "./light/slam-entrance-moves/KanadaPerspectiveSnap.tsx";
import { ScoreSlam } from "./light/slam-entrance-moves/ScoreSlam.tsx";
import { TextAsMask } from "./light/text-as-mask/TextAsMask.tsx";
import { TextColumnConverge } from "./light/text-column-converge/TextColumnConverge.tsx";
import { TitleDemoteToLabel } from "./light/title-demote-to-label/TitleDemoteToLabel.tsx";
import { LetterformDriftAssembly } from "./light/type-assembly-moves/LetterformDriftAssembly.tsx";
import { SplitTextStagger } from "./light/type-assembly-moves/SplitTextStagger.tsx";
import { TextOnPath } from "./light/type-assembly-moves/TextOnPath.tsx";
import { TrackingExpandReveal } from "./light/type-assembly-moves/TrackingExpandReveal.tsx";
import { LetterDropPhysics } from "./light/type-entrance-moves/LetterDropPhysics.tsx";
import { ScrambleDecode } from "./light/type-entrance-moves/ScrambleDecode.tsx";
import { UiStripAwayOutro } from "./light/ui-strip-away-outro/UiStripAwayOutro.tsx";
import { IconFlipBloomLogo } from "./light/ui-to-brand-morph/IconFlipBloomLogo.tsx";
import { InputMorphsIntoLogo } from "./light/ui-to-brand-morph/InputMorphsIntoLogo.tsx";
import { WordRelayFilmstrip } from "./light/word-relay-filmstrip/WordRelayFilmstrip.tsx";

// ============ 中（medium）============
import { StreamResponse } from "./medium/ai-stream-response/StreamResponse.tsx";
import { AutolayoutGapDial } from "./medium/autolayout-gap-dial/AutolayoutGapDial.tsx";
import { BeforeAfterSliderScrub } from "./medium/before-after-slider-scrub/BeforeAfterSliderScrub.tsx";
import { BubbleSwarmTakeover } from "./medium/bubble-swarm-takeover/BubbleSwarmTakeover.tsx";
import { DiagramCascadeBuild } from "./medium/canvas-materialize-moves/DiagramCascadeBuild.tsx";
import { PanelToCanvasMaterialize } from "./medium/canvas-materialize-moves/PanelToCanvasMaterialize.tsx";
import { CursorCastEnsemble } from "./medium/collab-cursor-moves/CursorCastEnsemble.tsx";
import { CursorDialogueDuet } from "./medium/collab-cursor-moves/CursorDialogueDuet.tsx";
import { CommandPaletteSummon } from "./medium/command-palette-summon/CommandPaletteSummon.tsx";
import { NeedleSweepSelftest } from "./medium/gauge-readout-moves/NeedleSweepSelftest.tsx";
import { TapeScrollFixedPointer } from "./medium/gauge-readout-moves/TapeScrollFixedPointer.tsx";
import { GradientWordSweep } from "./medium/gradient-word-sweep/GradientWordSweep.tsx";
import { HashtagToPillMaterialize } from "./medium/hashtag-to-pill-materialize/HashtagToPillMaterialize.tsx";
import { IconFieldColorize } from "./medium/icon-field-colorize/IconFieldColorize.tsx";
import { AttentionBounce } from "./medium/icon-performance-moves/AttentionBounce.tsx";
import { PopBurstConfirm } from "./medium/icon-performance-moves/PopBurstConfirm.tsx";
import { CursorPerformancePunchIn } from "./medium/input-trigger-moves/CursorPerformancePunchIn.tsx";
import { KeycapSmashCut } from "./medium/input-trigger-moves/KeycapSmashCut.tsx";
import { HalationBloom } from "./medium/light-play-moves/HalationBloom.tsx";
import { SheenSweepRetry } from "./medium/light-play-moves/SheenSweepRetry.tsx";
import { SpotlightSweepReveal } from "./medium/light-play-moves/SpotlightSweepReveal.tsx";
import { OdometerDigitRoll } from "./medium/odometer-digit-roll/OdometerDigitRoll.tsx";
import { ComicPanelSplit } from "./medium/panel-grid-moves/ComicPanelSplit.tsx";
import { FlipGridReflow } from "./medium/panel-grid-moves/FlipGridReflow.tsx";
import { GridFlashMosaic } from "./medium/panel-grid-moves/GridFlashMosaic.tsx";
import { ConfettiCrossfire } from "./medium/particle-celebrate-hits/ConfettiCrossfire.tsx";
import { CounterTickSparks } from "./medium/particle-celebrate-hits/CounterTickSparks.tsx";
import { ParticleSandFill } from "./medium/particle-sand-fill/ParticleSandFill.tsx";
import { PillSlotCycle } from "./medium/pill-slot-cycle/PillSlotCycle.tsx";
import { BrakeReticleLock } from "./medium/scroll-brake-moves/BrakeReticleLock.tsx";
import { ChangelogScrollBrake } from "./medium/scroll-brake-moves/ChangelogScrollBrake.tsx";
import { SegmentedThumbHero } from "./medium/segmented-thumb-hero/SegmentedThumbHero.tsx";
import { SkeletonReveal } from "./medium/skeleton-reveal/SkeletonReveal.tsx";
import { CornerSpotlightReveal } from "./medium/spotlight-sweep-moves/CornerSpotlightReveal.tsx";
import { GlowWakeSleepPanel } from "./medium/spotlight-sweep-moves/GlowWakeSleepPanel.tsx";
import { SlideSpotlightPan } from "./medium/spotlight-sweep-moves/SlideSpotlightPan.tsx";
import { PaletteThemeRipple } from "./medium/theme-switch-moves/PaletteThemeRipple.tsx";
import { ThemeSweepToggle } from "./medium/theme-switch-moves/ThemeSweepToggle.tsx";
import { TimelineTravel } from "./medium/timeline-travel/TimelineTravel.tsx";
import { FontWeightPump } from "./medium/type-rhythm-sync/FontWeightPump.tsx";
import { KaraokeFillSync } from "./medium/type-rhythm-sync/KaraokeFillSync.tsx";
import { BentoLightUp } from "./medium/wall-reveal-moves/BentoLightUp.tsx";
import { GridWaveFlip } from "./medium/wall-reveal-moves/GridWaveFlip.tsx";
import { WireframeDrawOn } from "./medium/wall-reveal-moves/WireframeDrawOn.tsx";


// ============ 模板场景镜头（tplshots，来自 template/src/aifl）============
import { BrandInkOpen, SpotlightHeroCard, DeckDealFlyin, TypeAndFilter, RowEmbed, ListStackPress, DocumentTypewriterReveal, OutroGroupPhotoLaunch } from "./tplshots/wrappers";
import { SceneOpen } from "./tplshots/SceneOpen.tsx";
import { SceneFlyIn } from "./tplshots/SceneFlyIn.tsx";
import { SceneDetail } from "./tplshots/SceneDetail.tsx";
import { ScenePapers } from "./tplshots/ScenePapers.tsx";
import { SceneWbr } from "./tplshots/SceneWbr.tsx";
import { SceneOutroLive } from "./tplshots/SceneOutroLive.tsx";

// ============ v7 新增（video-shotcraft 纸墨化）============
import { MagicianCardFlourish } from "./opening/magician-card-flourish/MagicianCardFlourish.tsx";
import { PaperTitleCard } from "./opening/paper-title-card/PaperTitleCard.tsx";
import { DatavizLandscapeOpen } from "./opening/dataviz-landscape-open/DatavizLandscapeOpen.tsx";
import { NeonFrameForerun } from "./ui-entrance/neon-frame-forerun/NeonFrameForerun.tsx";
import { NeonFrameForerunOrbit } from "./ui-entrance/neon-frame-orbit-drop/NeonFrameForerunOrbit.tsx";
import { IntegrationHubMap } from "./ui-entrance/integration-hub-map/IntegrationHubMap.tsx";
import { SakugaTimingShift } from "./rhythm/sakuga-timing-shift/SakugaTimingShift.tsx";
import { SpectrumMorphUi } from "./rhythm/spectrum-morph-ui/SpectrumMorphUi.tsx";
import { CelFlashStomp } from "./typography/cel-flash-stomp/CelFlashStomp.tsx";
import { HitCounter } from "./effects/hit-counter/HitCounter.tsx";
import { AnimeImpact } from "./effects/anime-impact/AnimeImpact.tsx";
import { GlowOrbAmbient } from "./effects/glow-orb-ambient/GlowOrbAmbient.tsx";
import { FlylineArc } from "./effects/flyline-arc/FlylineArc.tsx";
import { OrbFlylineRelay } from "./effects/orb-flyline-relay/OrbFlylineRelay.tsx";
import { LineUnfoldPanel } from "./effects/line-unfold-panel/LineUnfoldPanel.tsx";
import { ReticleLockOn } from "./effects/reticle-lock-on/ReticleLockOn.tsx";
import { GlitchDisplace } from "./transition/glitch-displace/GlitchDisplace.tsx";
import { FlashCut } from "./transition/flash-cut/FlashCut.tsx";
import { OscilloscopeStream } from "./data/oscilloscope-stream/OscilloscopeStream.tsx";
import { UnitDotSwarmRegroup } from "./data/unit-dot-swarm-regroup/UnitDotSwarmRegroup.tsx";
import { AxisRescaleShock } from "./data/axis-rescale-shock/AxisRescaleShock.tsx";
import { VoiceWaveformLive } from "./interaction/voice-waveform-live/VoiceWaveformLive.tsx";
import { NeonTripleMarquee } from "./outro/neon-triple-marquee/NeonTripleMarquee.tsx";
export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* === 纸墨原生 === */}
      <Composition id="BrandFrameSnap" component={BrandFrameSnap} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="DrawSvgTrace" component={DrawSvgTrace} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="LetterspaceMaterialize" component={LetterspaceMaterialize} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="LineBoil" component={LineBoil} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="MarkerUnderlineTitle" component={MarkerUnderlineTitle} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="BarnDoorSplit" component={BarnDoorSplit} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="CubeRotate" component={CubeRotate} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="PageWaterfallWall" component={PageWaterfallWall} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="VerticalTickerWrapper" component={VerticalTickerWrapper} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="MaskingTapeSlap" component={MaskingTapeSlap} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="PopupBookRise" component={PopupBookRise} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="PaperPlaneMessenger" component={PaperPlaneMessenger} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="InkBleedReveal" component={InkBleedReveal} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="RisoBeatPump" component={RisoBeatPump} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="RisoMisregistrationHit" component={RisoMisregistrationHit} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="SplitFlapFlip" component={SplitFlapFlip} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="StrokeSegmentBuild" component={StrokeSegmentBuild} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="TerminalTypewriter" component={TerminalTypewriter} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="TypewriterErrorRetype" component={TypewriterErrorRetype} width={1920} height={1080} fps={30} durationInFrames={180} />
      {/* === 极轻（风格中性）=== */}
      <Composition id="BeatCutAccelerando" component={BeatCutAccelerando} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="PaparazziFlash" component={PaparazziFlash} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="BottomPushStackWipe" component={BottomPushStackWipe} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="CircleMatchIris" component={CircleMatchIris} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="ColorBlockStepWipe" component={ColorBlockStepWipe} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="CraneRiseReveal" component={CraneRiseReveal} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="DollyZoomReal" component={DollyZoomReal} width={1920} height={1080} fps={30} durationInFrames={135} />
      <Composition id="MultiplaneReal" component={MultiplaneReal} width={1920} height={1080} fps={30} durationInFrames={135} />
      <Composition id="LogoStingButton" component={LogoStingButton} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="GrazeFaceTour" component={GrazeFaceTour} width={1920} height={1080} fps={30} durationInFrames={150} />
      <Composition id="LineCarryTransition" component={LineCarryTransition} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="DominoCascade" component={DominoCascade} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="DropBlackoutSlam" component={DropBlackoutSlam} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="WrightTripleCut" component={WrightTripleCut} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="OverheadTabletopDrop" component={OverheadTabletopDrop} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="TiltReveal" component={TiltReveal} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="JumpCutPunchIn" component={JumpCutPunchIn} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="StrobeBlackFrames" component={StrobeBlackFrames} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="RunwayGroundSkim" component={RunwayGroundSkim} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="MaskWipeReal" component={MaskWipeReal} width={1920} height={1080} fps={30} durationInFrames={120} />
      <Composition id="PortalWipeV2" component={PortalWipeV2} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="WhipBrakeReal" component={WhipBrakeReal} width={1920} height={1080} fps={30} durationInFrames={130} />
      <Composition id="WhipPanReal" component={WhipPanReal} width={1920} height={1080} fps={30} durationInFrames={120} />
      <Composition id="SmearMultiples" component={SmearMultiples} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="DroneDiveLanding" component={DroneDiveLanding} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="ExplodedView" component={ExplodedView} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="FreezeAnnotateReal" component={FreezeAnnotateReal} width={1920} height={1080} fps={30} durationInFrames={135} />
      <Composition id="SpeedRampReal" component={SpeedRampReal} width={1920} height={1080} fps={30} durationInFrames={135} />
      <Composition id="SteepTiltGlide" component={SteepTiltGlide} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="BulletTimeFreezeOrbit" component={BulletTimeFreezeOrbit} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="DutchRollToLevel" component={DutchRollToLevel} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="PullBackIsolation" component={PullBackIsolation} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="SlowPushIn" component={SlowPushIn} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="CardFootageCadence" component={CardFootageCadence} width={1920} height={1080} fps={30} durationInFrames={150} />
      <Composition id="SmashCut" component={SmashCut} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="TrailerBumper" component={TrailerBumper} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="InvisibleCut" component={InvisibleCut} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="LightLeakBurn" component={LightLeakBurn} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="VersusSlam" component={VersusSlam} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="LetterformZoom" component={LetterformZoom} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="SharedElementMorph" component={SharedElementMorph} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="BlindsSlice" component={BlindsSlice} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="ClockWipe" component={ClockWipe} width={1920} height={1080} fps={30} durationInFrames={180} />
      {/* === 轻（排版/卡片/结尾）=== */}
      <Composition id="CardFlipReveal" component={CardFlipReveal} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="CardFlockTumble" component={CardFlockTumble} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="ClonerDepthEcho" component={ClonerDepthEcho} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="AxialStretch" component={AxialStretch} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="ContactShadowLift" component={ContactShadowLift} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="MorphFromPrimitive" component={MorphFromPrimitive} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="ImpactBurstKit" component={ImpactBurstKit} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="KanadaPerspectiveSnap" component={KanadaPerspectiveSnap} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="ScoreSlam" component={ScoreSlam} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="TextAsMask" component={TextAsMask} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="TextColumnConverge" component={TextColumnConverge} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="TitleDemoteToLabel" component={TitleDemoteToLabel} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="LetterformDriftAssembly" component={LetterformDriftAssembly} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="SplitTextStagger" component={SplitTextStagger} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="TextOnPath" component={TextOnPath} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="TrackingExpandReveal" component={TrackingExpandReveal} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="LetterDropPhysics" component={LetterDropPhysics} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="ScrambleDecode" component={ScrambleDecode} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="UiStripAwayOutro" component={UiStripAwayOutro} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="IconFlipBloomLogo" component={IconFlipBloomLogo} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="InputMorphsIntoLogo" component={InputMorphsIntoLogo} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="WordRelayFilmstrip" component={WordRelayFilmstrip} width={1920} height={1080} fps={30} durationInFrames={180} />
      {/* === 中（光效/界面/仪表/粒子）=== */}
      <Composition id="StreamResponse" component={StreamResponse} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="AutolayoutGapDial" component={AutolayoutGapDial} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="BeforeAfterSliderScrub" component={BeforeAfterSliderScrub} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="BubbleSwarmTakeover" component={BubbleSwarmTakeover} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="DiagramCascadeBuild" component={DiagramCascadeBuild} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="PanelToCanvasMaterialize" component={PanelToCanvasMaterialize} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="CursorCastEnsemble" component={CursorCastEnsemble} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="CursorDialogueDuet" component={CursorDialogueDuet} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="CommandPaletteSummon" component={CommandPaletteSummon} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="NeedleSweepSelftest" component={NeedleSweepSelftest} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="TapeScrollFixedPointer" component={TapeScrollFixedPointer} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="GradientWordSweep" component={GradientWordSweep} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="HashtagToPillMaterialize" component={HashtagToPillMaterialize} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="IconFieldColorize" component={IconFieldColorize} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="AttentionBounce" component={AttentionBounce} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="PopBurstConfirm" component={PopBurstConfirm} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="CursorPerformancePunchIn" component={CursorPerformancePunchIn} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="KeycapSmashCut" component={KeycapSmashCut} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="HalationBloom" component={HalationBloom} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="SheenSweepRetry" component={SheenSweepRetry} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="SpotlightSweepReveal" component={SpotlightSweepReveal} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="OdometerDigitRoll" component={OdometerDigitRoll} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="ComicPanelSplit" component={ComicPanelSplit} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="FlipGridReflow" component={FlipGridReflow} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="GridFlashMosaic" component={GridFlashMosaic} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="ConfettiCrossfire" component={ConfettiCrossfire} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="CounterTickSparks" component={CounterTickSparks} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="ParticleSandFill" component={ParticleSandFill} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="PillSlotCycle" component={PillSlotCycle} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="BrakeReticleLock" component={BrakeReticleLock} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="ChangelogScrollBrake" component={ChangelogScrollBrake} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="SegmentedThumbHero" component={SegmentedThumbHero} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="SkeletonReveal" component={SkeletonReveal} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="CornerSpotlightReveal" component={CornerSpotlightReveal} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="GlowWakeSleepPanel" component={GlowWakeSleepPanel} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="SlideSpotlightPan" component={SlideSpotlightPan} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="PaletteThemeRipple" component={PaletteThemeRipple} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="ThemeSweepToggle" component={ThemeSweepToggle} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="TimelineTravel" component={TimelineTravel} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="FontWeightPump" component={FontWeightPump} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="KaraokeFillSync" component={KaraokeFillSync} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="BentoLightUp" component={BentoLightUp} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="GridWaveFlip" component={GridWaveFlip} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="WireframeDrawOn" component={WireframeDrawOn} width={1920} height={1080} fps={30} durationInFrames={180} />
      {/* === v7 新增（video-shotcraft 纸墨化）=== */}
      <Composition id="MagicianCardFlourish" component={MagicianCardFlourish} width={1920} height={1080} fps={30} durationInFrames={141} />
      <Composition id="PaperTitleCard" component={PaperTitleCard} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="DatavizLandscapeOpen" component={DatavizLandscapeOpen} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="NeonFrameForerun" component={NeonFrameForerun} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="NeonFrameForerunOrbit" component={NeonFrameForerunOrbit} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="IntegrationHubMap" component={IntegrationHubMap} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="SakugaTimingShift" component={SakugaTimingShift} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="SpectrumMorphUi" component={SpectrumMorphUi} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="CelFlashStomp" component={CelFlashStomp} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="HitCounter" component={HitCounter} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="AnimeImpact" component={AnimeImpact} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="GlowOrbAmbient" component={GlowOrbAmbient} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="FlylineArc" component={FlylineArc} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="OrbFlylineRelay" component={OrbFlylineRelay} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="LineUnfoldPanel" component={LineUnfoldPanel} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="ReticleLockOn" component={ReticleLockOn} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="GlitchDisplace" component={GlitchDisplace} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="FlashCut" component={FlashCut} width={1920} height={1080} fps={30} durationInFrames={10} />
      <Composition id="OscilloscopeStream" component={OscilloscopeStream} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="UnitDotSwarmRegroup" component={UnitDotSwarmRegroup} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="AxisRescaleShock" component={AxisRescaleShock} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="VoiceWaveformLive" component={VoiceWaveformLive} width={1920} height={1080} fps={30} durationInFrames={180} />
      <Composition id="NeonTripleMarquee" component={NeonTripleMarquee} width={1920} height={1080} fps={30} durationInFrames={180} />
      {/* === 模板场景镜头（tplshots）=== */}
      <Composition id="BrandInkOpen" component={BrandInkOpen} width={1920} height={1080} fps={30} durationInFrames={83} />
      <Composition id="SpotlightHeroCard" component={SpotlightHeroCard} width={1920} height={1080} fps={30} durationInFrames={138} />
      <Composition id="DeckDealFlyin" component={DeckDealFlyin} width={1920} height={1080} fps={30} durationInFrames={128} />
      <Composition id="TypeAndFilter" component={TypeAndFilter} width={1920} height={1080} fps={30} durationInFrames={62} />
      <Composition id="RowEmbed" component={RowEmbed} width={1920} height={1080} fps={30} durationInFrames={100} />
      <Composition id="ListStackPress" component={ListStackPress} width={1920} height={1080} fps={30} durationInFrames={105} />
      <Composition id="DocumentTypewriterReveal" component={DocumentTypewriterReveal} width={1920} height={1080} fps={30} durationInFrames={110} />
      <Composition id="OutroGroupPhotoLaunch" component={OutroGroupPhotoLaunch} width={1920} height={1080} fps={30} durationInFrames={145} />
      <Composition id="SceneOpen" component={SceneOpen} width={1920} height={1080} fps={30} durationInFrames={83} />
      <Composition id="SceneFlyIn" component={SceneFlyIn} width={1920} height={1080} fps={30} durationInFrames={128} />
      <Composition id="SceneDetail" component={SceneDetail} width={1920} height={1080} fps={30} durationInFrames={100} />
      <Composition id="ScenePapers" component={ScenePapers} width={1920} height={1080} fps={30} durationInFrames={105} />
      <Composition id="SceneWbr" component={SceneWbr} width={1920} height={1080} fps={30} durationInFrames={110} />
      <Composition id="SceneOutroLive" component={SceneOutroLive} width={1920} height={1080} fps={30} durationInFrames={145} />
    </>
  );
};

registerRoot(RemotionRoot);
