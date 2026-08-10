// 右栏镜头库：分组折叠 + hover 悬浮窗动效预览（无延迟：模块已预热，悬浮窗即时弹出）
import { useEffect, useMemo, useState } from 'react';
import type { ComponentType } from 'react';
import { Player } from '@remotion/player';
import type { LensRegistry, LensRegistryEntry } from '../../../shared/types';
import { loadLensComponent, defaultParams } from '../playback';
import type { AnyLensProps } from '../playback';
import { ErrorBoundary } from '../ErrorBoundary';

function HoverPlayer({ entry }: { entry: LensRegistryEntry }) {
  const [comp, setComp] = useState<ComponentType<AnyLensProps> | null>(null);
  useEffect(() => {
    let alive = true;
    setComp(null);
    loadLensComponent(entry.id, entry.file).then((c) => {
      if (alive) setComp(() => c); // 包一层：避免 setState 把组件当函数式更新直接调用
    });
    return () => {
      alive = false;
    };
  }, [entry.id, entry.file]);

  if (!comp) {
    return (
      <div style={{ width: 360, height: 202, background: '#222', color: '#aaa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>
        加载中…
      </div>
    );
  }
  return (
    <ErrorBoundary
      fallback={
        <div style={{ width: 360, height: 202, background: '#222', color: '#aaa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>
          预览失败
        </div>
      }
    >
      <Player
        component={comp}
        inputProps={defaultParams(entry.props)}
        durationInFrames={entry.durationInFrames}
        fps={30}
        compositionWidth={1920}
        compositionHeight={1080}
        style={{ width: 360, height: 202, display: 'block', background: '#000' }}
        loop
        autoPlay
        initiallyMuted // 工作台无声：静音绕过 AudioContext 时钟限制，实现零点击自动播放
        acknowledgeRemotionLicense
        errorFallback={() => (
          <div style={{ width: 360, height: 202, background: '#222', color: '#aaa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>
            预览失败
          </div>
        )}
      />
    </ErrorBoundary>
  );
}

export const LensLibrary: React.FC<{
  registry: LensRegistry;
  currentLensId: string;
  onSelect: (id: string) => void;
}> = ({ registry, currentLensId, onSelect }) => {
  const [hover, setHover] = useState<{ entry: LensRegistryEntry; left: number; top: number } | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const groups = useMemo(() => {
    const g: Record<string, LensRegistryEntry[]> = {};
    for (const e of registry.entries) {
      (g[e.group] ??= []).push(e);
    }
    return g;
  }, [registry]);

  const showHover = (e: LensRegistryEntry, el: HTMLButtonElement) => {
    const r = el.getBoundingClientRect();
    let left = r.right + 8;
    if (left + 368 > window.innerWidth) left = r.left - 368 - 8;
    setHover({ entry: e, left, top: Math.max(8, Math.min(r.top, window.innerHeight - 220)) });
  };

  return (
    <div>
      {Object.entries(groups).map(([group, list]) => (
        <div key={group} style={{ marginBottom: 8 }}>
          <button
            onClick={() => setCollapsed((p) => ({ ...p, [group]: !p[group] }))}
            style={{
              width: '100%', textAlign: 'left', padding: '4px 8px', fontSize: 13,
              fontWeight: 700, background: '#f0f0f0', border: '1px solid #ddd', borderRadius: 4, cursor: 'pointer',
            }}
          >
            {group}（{list.length}）{collapsed[group] ? ' ▸' : ' ▾'}
          </button>
          {!collapsed[group] &&
            list.map((e) => (
              <button
                key={e.id}
                onMouseEnter={(ev) => showHover(e, ev.currentTarget)}
                onMouseLeave={() => setHover(null)}
                onClick={() => onSelect(e.id)}
                style={{
                  display: 'block', width: '100%', textAlign: 'left', padding: '5px 8px 5px 16px',
                  background: e.id === currentLensId ? '#e3edf7' : '#fff',
                  border: 'none', borderBottom: '1px solid #f0f0f0', cursor: 'pointer', fontSize: 12.5,
                }}
              >
                {e.name}（{e.id}）
              </button>
            ))}
        </div>
      ))}

      {hover && (
        <div
          style={{
            position: 'fixed', left: hover.left, top: hover.top, zIndex: 100,
            background: '#fff', border: '1px solid #ccc', borderRadius: 8,
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)', padding: 8,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
            {hover.entry.name}（{hover.entry.id}）
          </div>
          <HoverPlayer entry={hover.entry} />
        </div>
      )}
    </div>
  );
};
