// 环节二：字幕样式（两栏：真实画框预览 + 参数表单，实时生效）
// 画框背景 = storyboard 第一段（seg-01）镜头第一帧；字体下拉枚举本机全部字体（Local Font Access，失败回退候选）
import { useEffect, useRef, useState } from 'react';
import type { ComponentType, CSSProperties } from 'react';
import { Player } from '@remotion/player';
import type { LensRegistryEntry, SubtitleStyle } from '../../../shared/types';
import { loadLensComponent } from '../playback';
import type { AnyLensProps } from '../playback';

// 未设置时生效的默认样式（控件回显 + 预览共用，保证面板不为空）
const DEFAULT_STYLE: SubtitleStyle = {
  fontSize: 48,
  color: '#2c2416',
  strokeColor: 'transparent',
  strokeWidth: 0,
  backgroundColor: 'transparent',
  position: 'bottom',
  align: 'center',
  letterSpacing: 0,
};

// 不支持/拒绝 Local Font Access 时的候选字体
const FALLBACK_FONTS: { label: string; family: string }[] = [
  { label: '系统默认', family: '' },
  { label: '微软雅黑', family: 'Microsoft YaHei' },
  { label: '思源黑体', family: 'Source Han Sans SC' },
  { label: '宋体', family: 'SimSun' },
  { label: '楷体', family: 'KaiTi' },
  { label: '仿宋', family: 'FangSong' },
];

// 枚举本机全部字体（Chrome/Edge queryLocalFonts，需用户授权一次）；失败回退候选列表
function useFontList(): { label: string; family: string }[] {
  const [fonts, setFonts] = useState(FALLBACK_FONTS);
  useEffect(() => {
    let alive = true;
    const qlf = (
      window as unknown as {
        queryLocalFonts?: () => Promise<{ family: string }[]>;
      }
    ).queryLocalFonts;
    if (!qlf) return;
    qlf()
      .then((list) => {
        if (!alive) return;
        const seen = new Set<string>();
        const all: { label: string; family: string }[] = [{ label: '系统默认', family: '' }];
        for (const f of list) {
          const family = f.family.trim();
          if (!family || seen.has(family)) continue;
          seen.add(family);
          all.push({ label: family, family });
        }
        setFonts(all);
      })
      .catch(() => {
        /* 用户拒绝授权或受限：保持候选列表 */
      });
    return () => {
      alive = false;
    };
  }, []);
  return fonts;
}

// 画框背景：渲染第一段镜头并停在第一帧（不播放）
function FrameBackground({
  entry,
  params,
}: {
  entry: LensRegistryEntry;
  params: AnyLensProps;
}) {
  const [comp, setComp] = useState<ComponentType<AnyLensProps> | null>(null);
  const [err, setErr] = useState('');
  useEffect(() => {
    let alive = true;
    setComp(null);
    setErr('');
    loadLensComponent(entry.id, entry.file)
      .then((c) => {
        if (alive) setComp(() => c);
      })
      .catch((e) => {
        if (alive) setErr(String(e?.message ?? e));
      });
    return () => {
      alive = false;
    };
  }, [entry.id, entry.file]);

  if (err) {
    return (
      <div
        style={{
          width: '100%', height: '100%', background: '#faf7f2', color: '#b26a00',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13,
        }}
      >
        镜头背景加载失败（字幕仍可预览）
      </div>
    );
  }
  if (!comp) {
    return (
      <div
        style={{
          width: '100%', height: '100%', background: '#faf7f2', color: '#888',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13,
        }}
      >
        镜头背景加载中…
      </div>
    );
  }
  return (
    <Player
      component={comp}
      inputProps={params}
      durationInFrames={entry.durationInFrames}
      fps={30}
      compositionWidth={1920}
      compositionHeight={1080}
      style={{ width: '100%', height: '100%', display: 'block', background: '#faf7f2' }}
      acknowledgeRemotionLicense
    />
  );
}

const TEXT_COLOR_FIELDS: { key: keyof SubtitleStyle; label: string }[] = [
  { key: 'color', label: '文字颜色' },
  { key: 'strokeColor', label: '描边色' },
  { key: 'backgroundColor', label: '字幕背景色' },
];
const NUMBER_FIELDS: { key: keyof SubtitleStyle; label: string }[] = [
  { key: 'fontSize', label: '字号' },
  { key: 'strokeWidth', label: '描边宽' },
  { key: 'letterSpacing', label: '字间距' },
];

export const SubtitlePanel: React.FC<{
  style: SubtitleStyle;
  onChange: (patch: Partial<SubtitleStyle>) => void;
  onSave: () => void;
  onBack: () => void;
  firstLensEntry: LensRegistryEntry | null;
  firstLensParams: AnyLensProps;
}> = ({ style, onChange, onSave, onBack, firstLensEntry, firstLensParams }) => {
  const fonts = useFontList();
  const effective: SubtitleStyle = { ...DEFAULT_STYLE, ...style };

  // 画框实际显示宽度 → 字幕按 1920 基准等比缩放，预览即真实效果
  const frameRef = useRef<HTMLDivElement | null>(null);
  const [frameW, setFrameW] = useState(640);
  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setFrameW(el.clientWidth));
    ro.observe(el);
    setFrameW(el.clientWidth);
    return () => ro.disconnect();
  }, []);
  const scale = frameW / 1920;

  const subtitleBox: CSSProperties = {
    position: 'absolute',
    left: 0,
    right: 0,
    margin: '0 auto',
    maxWidth: '88%',
    fontFamily:
      effective.fontFamily ||
      '-apple-system, "Segoe UI", "Microsoft YaHei", sans-serif',
    fontSize: (effective.fontSize ?? 48) * scale,
    lineHeight: 1.35,
    color: effective.color ?? '#2c2416',
    WebkitTextStroke: `${(effective.strokeWidth ?? 0) * scale}px ${
      effective.strokeColor ?? 'transparent'
    }`,
    letterSpacing: (effective.letterSpacing ?? 0) * scale,
    textAlign: effective.align ?? 'center',
    background:
      effective.backgroundColor && effective.backgroundColor !== 'transparent'
        ? effective.backgroundColor
        : 'transparent',
    padding:
      effective.backgroundColor && effective.backgroundColor !== 'transparent'
        ? `${6 * scale}px ${16 * scale}px`
        : '0',
    borderRadius: 4,
    bottom: effective.position === 'top' ? undefined : effective.position === 'center' ? undefined : '8%',
    top: effective.position === 'top' ? '8%' : effective.position === 'center' ? '50%' : undefined,
    transform: effective.position === 'center' ? 'translateY(-50%)' : undefined,
  };

  return (
    <div style={{ display: 'flex', gap: 16, height: '100%' }}>
      {/* 左：真实画框预览（第一段镜头第一帧 + 字幕叠加） */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 0 }}>
        <div
          ref={frameRef}
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: 1800,
            aspectRatio: '16 / 9',
            borderRadius: 8,
            overflow: 'hidden',
            background: '#111',
            boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
          }}
        >
          {firstLensEntry ? (
            <FrameBackground entry={firstLensEntry} params={firstLensParams} />
          ) : (
            <div
              style={{
                width: '100%', height: '100%', background: '#faf7f2', color: '#999',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13,
              }}
            >
              暂无第一段镜头数据，无法显示画框（字幕仍可预览）
            </div>
          )}
          <div style={subtitleBox}>示例字幕：时势造英雄</div>
        </div>
      </div>

      {/* 右：参数表单（显示当前生效值，实时联动预览） */}
      <div style={{ width: 300, overflow: 'auto' }}>
        <h3 style={{ marginTop: 0, fontSize: 14 }}>字幕样式</h3>
        <label style={{ display: 'block', marginBottom: 8, fontSize: 12 }}>
          字体
          <select
            style={{ width: '100%', padding: '4px 6px' }}
            value={style.fontFamily ?? ''}
            onChange={(e) => {
              const family = e.target.value;
              onChange(family === '' ? { fontFamily: undefined } : { fontFamily: family });
            }}
          >
            {fonts.map((f) => (
              <option key={f.family || '__default__'} value={f.family}>
                {f.label}
              </option>
            ))}
          </select>
        </label>
        {TEXT_COLOR_FIELDS.map((f) => (
          <label key={f.key} style={{ display: 'block', marginBottom: 8, fontSize: 12 }}>
            {f.label}
            <input
              style={{ width: '100%', padding: '4px 8px', boxSizing: 'border-box' }}
              type="text"
              value={String(effective[f.key] ?? '')}
              onChange={(e) => onChange({ [f.key]: e.target.value } as Partial<SubtitleStyle>)}
            />
          </label>
        ))}
        {NUMBER_FIELDS.map((f) => (
          <label key={f.key} style={{ display: 'block', marginBottom: 8, fontSize: 12 }}>
            {f.label}
            <input
              style={{ width: '100%', padding: '4px 8px', boxSizing: 'border-box' }}
              type="number"
              value={String(effective[f.key] ?? 0)}
              onChange={(e) => onChange({ [f.key]: Number(e.target.value) } as Partial<SubtitleStyle>)}
            />
          </label>
        ))}
        <label style={{ display: 'block', marginBottom: 8, fontSize: 12 }}>
          位置
          <select
            style={{ width: '100%', padding: '4px 6px' }}
            value={effective.position}
            onChange={(e) => onChange({ position: e.target.value as SubtitleStyle['position'] })}
          >
            <option value="bottom">底部</option>
            <option value="top">顶部</option>
            <option value="center">居中</option>
          </select>
        </label>
        <label style={{ display: 'block', marginBottom: 8, fontSize: 12 }}>
          对齐
          <select
            style={{ width: '100%', padding: '4px 6px' }}
            value={effective.align}
            onChange={(e) => onChange({ align: e.target.value as SubtitleStyle['align'] })}
          >
            <option value="left">左</option>
            <option value="center">中</option>
            <option value="right">右</option>
          </select>
        </label>
        <div style={{ display: 'flex', gap: 6, marginTop: 14 }}>
          <button onClick={onBack} style={{ flex: 1, padding: '6px 0', cursor: 'pointer' }}>
            返回上一步
          </button>
          <button onClick={onSave} style={{ flex: 1, padding: '6px 0', cursor: 'pointer' }}>
            确定当前设置
          </button>
        </div>
      </div>
    </div>
  );
};
