// automotion-v7 工作台（M4）——第 5 步：左栏段列表 + 保存交互 + 字幕环节
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ComponentType } from 'react';
import { Player } from '@remotion/player';
import type { LensRegistry, MatchResult, Storyboard, SubtitleStyle } from '../../shared/types';
import { loadLensComponent, defaultParams, prewarm, normalizeParams } from './playback';
import type { AnyLensProps } from './playback';
import { Recommendations } from './components/Recommendations';
import { LensLibrary } from './components/LensLibrary';
import { SegmentList } from './components/SegmentList';
import type { SegmentProfile } from './components/SegmentList';
import { SubtitlePanel } from './components/SubtitlePanel';
import { ErrorBoundary } from './ErrorBoundary';
import { ParamForm } from './components/ParamForm';

export const App = () => {
  const [registry, setRegistry] = useState<LensRegistry | null>(null);
  const [match, setMatch] = useState<MatchResult | null>(null);
  const [segments, setSegments] = useState<SegmentProfile[]>([]);
  const [storyboard, setStoryboard] = useState<Storyboard | null>(null);
  const [currentSegmentId, setCurrentSegmentId] = useState('seg-01');
  const [stage, setStage] = useState<'storyboard' | 'subtitle'>('storyboard');
  const [subtitleStyle, setSubtitleStyle] = useState<SubtitleStyle>({});
  const [lensId, setLensId] = useState('');
  const [params, setParams] = useState<AnyLensProps>({});
  const [LensComp, setLensComp] = useState<ComponentType<AnyLensProps> | null>(null);
  const [loadError, setLoadError] = useState('');
  const [savedTip, setSavedTip] = useState('');
  const [repeatWarning, setRepeatWarning] = useState('');

  useEffect(() => {
    fetch('/api/registry')
      .then((r) => r.json())
      .then((reg: LensRegistry) => {
        setRegistry(reg);
        prewarm(reg.entries);
      })
      .catch((e) => setLoadError(`registry 加载失败：${e.message}`));
    fetch('/api/match')
      .then((r) => r.json())
      .then(setMatch)
      .catch((e) => setLoadError(`match 加载失败：${e.message}`));
    fetch('/api/project/segments')
      .then((r) => r.json())
      .then((d) => setSegments(d.segments ?? []))
      .catch((e) => setLoadError(`段画像加载失败：${e.message}`));
    fetch('/api/storyboard')
      .then((r) => r.json())
      .then((d) => {
        setStoryboard(d.storyboard);
        setSubtitleStyle(d.storyboard?.meta?.subtitleStyle ?? {});
      })
      .catch((e) => setLoadError(`storyboard 加载失败：${e.message}`));
  }, []);

  const entry = useMemo(
    () => registry?.entries.find((e) => e.id === lensId) ?? null,
    [registry, lensId],
  );
  const currentSegment = match?.segments.find((s) => s.id === currentSegmentId);
  // 字幕环节画框背景：storyboard 第一段（seg-01）的镜头；未定稿用匹配 Top1 + 组件默认参数
  const firstSegment = storyboard?.segments[0];
  const firstLensId =
    firstSegment?.lensId ||
    match?.segments.find((s) => s.id === firstSegment?.id)?.top5?.[0]?.lensId ||
    '';
  const firstLensEntry = registry?.entries.find((e) => e.id === firstLensId) ?? null;
  const firstLensParams = firstSegment?.lensId
    ? (firstSegment.params as AnyLensProps)
    : firstLensEntry
      ? defaultParams(firstLensEntry.props)
      : {};

  const lensNameOf = (id: string) => registry?.entries.find((e) => e.id === id)?.name ?? '';

  const selectLens = (id: string, preset?: AnyLensProps, board?: Storyboard | null) => {
    const e = registry?.entries.find((x) => x.id === id);
    if (!e) return;
    setLoadError('');
    setLensId(id);
    setParams(preset ?? defaultParams(e.props));
    loadLensComponent(id, e.file)
      .then((comp) => setLensComp(() => comp)) // 包一层：setState 传函数会被当函数式更新直接调用
      .catch((err) => setLoadError(String(err.message ?? err)));
    // 防重复提示：与前面 <5 段内已用镜头重复
    const idx = segments.findIndex((s) => s.id === currentSegmentId);
    const boardRef = board !== undefined ? board : storyboard;
    if (boardRef && idx > -1) {
      const prev = boardRef.segments.slice(Math.max(0, idx - 5), idx);
      if (prev.some((s) => s.lensId === id)) {
        setRepeatWarning(`提示：${id} 在前面 5 段内已使用过（间隔 <5 段，可人工决定是否复用）`);
      } else {
        setRepeatWarning('');
      }
    }
  };

  const setParam = (name: string, value: unknown) => {
    setParams((prev) => ({ ...prev, [name]: value }));
  };

  const postStoryboard = (sb: Storyboard) => {
    fetch('/api/storyboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sb),
    })
      .then((r) => r.json())
      .then((res) => {
        setSavedTip(res.ok ? '已保存 ✓' : `保存失败：${res.error ?? ''}`);
        setTimeout(() => setSavedTip(''), 2000);
      })
      .catch((e) => setLoadError(`保存失败：${e.message}`));
  };

  const saveSegment = () => {
    if (!storyboard || !lensId) {
      setLoadError('未选择镜头，无法保存');
      return;
    }
    const next: Storyboard = {
      ...storyboard,
      segments: storyboard.segments.map((s) =>
        s.id === currentSegmentId ? { ...s, lensId, params: normalizeParams(params, entry?.props ?? []) } : s,
      ),
    };
    setStoryboard(next);
    postStoryboard(next);
  };

  const saveSubtitle = () => {
    if (!storyboard) return;
    const next: Storyboard = {
      ...storyboard,
      meta: { ...storyboard.meta, subtitleStyle },
    };
    setStoryboard(next);
    postStoryboard(next);
  };

  const reloadStoryboard = () => {
    fetch('/api/storyboard')
      .then((r) => r.json())
      .then((d) => {
        setStoryboard(d.storyboard);
        setSubtitleStyle(d.storyboard?.meta?.subtitleStyle ?? {});
        applySegmentLens(currentSegmentId, d.storyboard);
        setSavedTip('已重新加载');
        setTimeout(() => setSavedTip(''), 2000);
      })
      .catch((e) => setLoadError(`重新加载失败：${e.message}`));
  };

  // 选中某段时：已定稿 → 加载保存的镜头+参数；未定稿 → 自动预选该段 Top 1
  const applySegmentLens = (segId: string, board?: Storyboard | null) => {
    const saved = (board !== undefined ? board : storyboard)?.segments.find((s) => s.id === segId);
    if (saved?.lensId) {
      selectLens(saved.lensId, saved.params as AnyLensProps | undefined, board);
      return;
    }
    const m = match?.segments.find((s) => s.id === segId);
    if (m?.top5?.length) selectLens(m.top5[0].lensId);
  };

  // 初始自动预选：数据就绪后对当前段应用一次（之后由段切换驱动）
  const autoApplied = useRef(false);
  useEffect(() => {
    if (!registry || !match || !storyboard || autoApplied.current) return;
    autoApplied.current = true;
    applySegmentLens(currentSegmentId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registry, match, storyboard]);

  if (stage === 'subtitle') {
    return (
      <div style={{ height: '100vh', padding: 16, fontFamily: 'system-ui, sans-serif', boxSizing: 'border-box' }}>
        <h2 style={{ marginTop: 0, fontSize: 16 }}>环节二：字幕样式</h2>
        {savedTip && <p style={{ color: '#2e7d32', fontSize: 13 }}>{savedTip}</p>}
        <SubtitlePanel
          style={subtitleStyle}
          onChange={(patch) => setSubtitleStyle((prev) => ({ ...prev, ...patch }))}
          onSave={saveSubtitle}
          onBack={() => setStage('storyboard')}
          firstLensEntry={firstLensEntry}
          firstLensParams={firstLensParams}
        />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      {/* 左栏：段列表 */}
      <aside style={{ width: 260, borderRight: '1px solid #ddd', padding: 12, overflow: 'hidden' }}>
        <SegmentList
          segments={segments}
          storyboard={storyboard}
          lensNameOf={lensNameOf}
          currentSegmentId={currentSegmentId}
          onSelect={(id) => {
            setCurrentSegmentId(id);
            applySegmentLens(id);
          }}
          onSave={saveSegment}
          onNext={() => setStage('subtitle')}
        />
      </aside>

      {/* 中栏：预览 + 参数表单 */}
      <main style={{ flex: 1, padding: 12, overflow: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <h3 style={{ margin: 0 }}>
            镜头预览{entry ? `：${entry.name}（${entry.id}）` : ''}
          </h3>
          <button
            onClick={reloadStoryboard}
            style={{ marginLeft: 'auto', padding: '4px 12px', fontSize: 12, cursor: 'pointer' }}
            title="回 Codex 对话改完 storyboard 后点击拉取最新数据"
          >
            重新加载
          </button>
        </div>
        {loadError && <p style={{ color: '#c00', fontSize: 13 }}>{loadError}</p>}
        {savedTip && <p style={{ color: '#2e7d32', fontSize: 13 }}>{savedTip}</p>}
        {repeatWarning && <p style={{ color: '#b26a00', fontSize: 12 }}>{repeatWarning}</p>}

        <div style={{ background: '#111', borderRadius: 8, padding: 8, marginBottom: 12 }}>
          <ErrorBoundary
            fallback={
              <p style={{ color: '#c00', textAlign: 'center', padding: 40 }}>
                镜头预览失败（已隔离，不影响工作台其余功能）
              </p>
            }
          >
            {LensComp && entry ? (
              <Player
                component={LensComp}
                inputProps={params}
                durationInFrames={
                  // 口播对齐镜头（cueSec/revealAtSec）的事件可能晚于镜头默认时长：
                  // 预览时长取 镜头默认 与 当前段真实时长 的较大值，保证事件在预览里可见
                  Math.max(
                    entry.durationInFrames,
                    Math.round(
                      (storyboard?.segments.find((s) => s.id === currentSegmentId)?.durationSec ?? 0) * 30,
                    ),
                  )
                }
                fps={30}
                compositionWidth={1920}
                compositionHeight={1080}
                style={{ width: '100%', maxWidth: 900, margin: '0 auto', display: 'block' }}
                loop
                autoPlay
                initiallyMuted // 工作台无声：静音绕过 AudioContext 时钟限制，实现零点击自动播放
                acknowledgeRemotionLicense
                errorFallback={() => (
                  <p style={{ color: '#c00', textAlign: 'center', padding: 40 }}>
                    镜头预览失败
                  </p>
                )}
              />
            ) : (
              <p style={{ color: '#888', textAlign: 'center', padding: 40 }}>
                请从右侧选择镜头
              </p>
            )}
          </ErrorBoundary>
        </div>

        {entry && (
          <div style={{ maxWidth: 900 }}>
            <ParamForm fields={entry.props} params={params} onChange={setParam} />
          </div>
        )}
      </main>

      {/* 右栏：推荐区 + 镜头库 */}
      <aside style={{ width: 300, borderLeft: '1px solid #ddd', padding: 12, overflow: 'auto' }}>
        <Recommendations
          segment={currentSegment}
          currentLensId={lensId}
          onPick={(id) => selectLens(id)}
        />
        <h3 style={{ marginTop: 0 }}>镜头库（{registry?.entries.length ?? '-'}）</h3>
        {registry && (
          <LensLibrary registry={registry} currentLensId={lensId} onSelect={(id) => selectLens(id)} />
        )}
      </aside>
    </div>
  );
};
