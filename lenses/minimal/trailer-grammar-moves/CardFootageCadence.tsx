// === 可调参数 ===
// DURATION: 150（总帧数，可调；弹性段随 DURATION 等比缩放）
// 色彩: 走纸墨 G 色板（src/_fixtures/Fixtures.tsx）——文字 G.ink / 背景 G.bg / 强调 G.accent
// 功能: 钩子,宣告
// props: words（3 个字卡）、sceneA / sceneB（UI 镜头内容承载）
// === 时间特性 ===
// 刚性（不可压缩）: 刚性:每镜9f等长硬切
// 弹性（可伸缩）: 其余段（入场/过渡/收尾/hold）可等比缩放
// === 适配注意 ===
// 调 DURATION 时只动弹性段 interpolate 关键帧，刚性核心帧区间保持固定帧数。
// card-footage-cadence｜字卡穿插节奏
// UI 镜头 ↔ 黑底字卡像对话接拍：0–14f UI A 缓推 → 硬切 8f 字卡 SHIP →
// 硬切 12f UI B 1.6x 裁切缓移 → 8f 字卡 FASTER → 10f UI A 2x 裁切 →
// 10f 字卡 TODAY(下划线) → 62f 硬切收尾全景定格。
// UI 段全部带微动（推/移），字卡段除落定微缩(1.05→1, out-cubic)外全静，
// 动↔静对比即手法本体。所有切换零过渡（条件挂载，无 crossfade）。
// 收尾 62–105f 轻推收完，105–150f 真静止 45f ≥ 40f。帧确定，无随机。
import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from 'remotion';
import { G } from '../../_fixtures/Fixtures';
import { SceneContent, SceneContentData } from '../../_system/scene-content';

const CLAMP = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

// 黑底白字字卡：落定微缩 1.05→1（out-cubic，段内前 5f 完成），其余全静
const TitleCard: React.FC<{ text: string; local: number; underline?: boolean }> = ({
  text,
  local,
  underline = false,
}) => {
  const scale = interpolate(local, [0, 5], [1.05, 1], {
    ...CLAMP,
    easing: Easing.out(Easing.cubic),
  });
  return (
    <AbsoluteFill
      style={{ background: G.side, alignItems: 'center', justifyContent: 'center' }}
    >
      <div
        style={{
          transform: `scale(${scale})`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 26,
        }}
      >
        <div
          style={{
            fontFamily: 'Helvetica, Arial, sans-serif',
            fontWeight: 800,
            fontSize: 170,
            color: G.card,
            letterSpacing: 2,
            lineHeight: 1,
          }}
        >
          {text}
        </div>
        {underline && (
          <div style={{ width: 560, height: 14, background: G.card, borderRadius: 7 }} />
        )}
      </div>
    </AbsoluteFill>
  );
};

// UI 镜头：包一层 transform 做缓推/缓移，硬切由外层条件挂载保证
const UiShot: React.FC<{
  content: SceneContentData;
  transform: string;
  origin?: string;
}> = ({ content, transform, origin = '50% 50%' }) => (
  <AbsoluteFill style={{ overflow: 'hidden', background: G.panel }}>
    <div style={{ width: 1920, height: 1080, transform, transformOrigin: origin }}>
      <SceneContent content={content} />
    </div>
  </AbsoluteFill>
);

export interface CardFootageCadenceProps {
  words?: string[];
  sceneA?: SceneContentData;
  sceneB?: SceneContentData;
}

export const CardFootageCadence: React.FC<CardFootageCadenceProps> = ({
  words = ['START', 'GO', 'NOW'],
  sceneA = {
    title: '概览',
    type: 'rows',
    rows: [
      { label: '指标一', value: '+18%' },
      { label: '指标二', value: '2.1×' },
    ],
  },
  sceneB = {
    title: '状态',
    type: 'rows',
    rows: [
      { label: '节点', value: '4/4' },
      { label: '可用性', value: '99.98%' },
    ],
  },
}) => {
  const frame = useCurrentFrame();

  // ---- 分段：切点 14 / 22 / 34 / 42 / 52 / 62，总长 150 ----

  // 段1 0–14f：UI A 全景缓推 1.0→1.08
  if (frame < 14) {
    const s = interpolate(frame, [0, 14], [1, 1.08], CLAMP);
    return <UiShot content={sceneA} transform={`scale(${s})`} />;
  }

  // 段2 14–22f：字卡 SHIP
  if (frame < 22) {
    return <TitleCard text={words[0] ?? ''} local={frame - 14} />;
  }

  // 段3 22–34f：UI B 1.6x 裁切 + 横向缓移（120px 内容位移，屏上 ~192px）。
  // origin 偏左让列表行图标入画，读得出是 UI（QA 后调：50%→35%）
  if (frame < 34) {
    const tx = interpolate(frame - 22, [0, 12], [60, -60], CLAMP);
    return (
      <UiShot content={sceneB} transform={`scale(1.6) translateX(${tx}px)`} origin="35% 50%" />
    );
  }

  // 段4 34–42f：字卡 FASTER
  if (frame < 42) {
    return <TitleCard text={words[1] ?? ''} local={frame - 34} />;
  }

  // 段5 42–52f：UI A 另一处 2x 裁切（左上卡片区）+ 继续缓推 2.0→2.14
  if (frame < 52) {
    const s = interpolate(frame - 42, [0, 10], [2, 2.14], CLAMP);
    return <UiShot content={sceneA} transform={`scale(${s})`} origin="32% 30%" />;
  }

  // 段6 52–62f：字卡 TODAY + 下划线
  if (frame < 62) {
    return <TitleCard text={words[2] ?? ''} local={frame - 52} underline />;
  }

  // 段7 62–150f：收尾全景 UI 定格。62–105f 极缓推收完（out-cubic），
  // 105f 后 transform 值恒为 1.02，105–150f 真静止 45f。
  const s = interpolate(frame, [62, 105], [1, 1.02], {
    ...CLAMP,
    easing: Easing.out(Easing.cubic),
  });
  return <UiShot content={sceneB} transform={`scale(${s})`} />;
};
