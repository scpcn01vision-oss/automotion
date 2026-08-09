// 左栏段列表：段画像 + 定稿状态 + 保存/下一步
import type { Storyboard } from '../../../shared/types';

export type SegmentProfile = {
  id: string;
  index: number;
  summary: string;
  role: string;
  contentTags: string[];
};

export const SegmentList: React.FC<{
  segments: SegmentProfile[];
  storyboard: Storyboard | null;
  lensNameOf: (lensId: string) => string;
  currentSegmentId: string;
  onSelect: (id: string) => void;
  onSave: () => void;
  onNext: () => void;
}> = ({ segments, storyboard, lensNameOf, currentSegmentId, onSelect, onSave, onNext }) => {
  const chosenOf = (segId: string): string => {
    const s = storyboard?.segments.find((x) => x.id === segId);
    return s && s.lensId ? lensNameOf(s.lensId) || s.lensId : '';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1, overflow: 'auto' }}>
        <h3 style={{ marginTop: 0, fontSize: 14 }}>段列表（{segments.length}）</h3>
        {segments.map((s) => {
          const chosen = chosenOf(s.id);
          return (
            <div
              key={s.id}
              onClick={() => onSelect(s.id)}
              style={{
                padding: '6px 8px', marginBottom: 4, borderRadius: 6, cursor: 'pointer',
                background: s.id === currentSegmentId ? '#e3edf7' : '#fff',
                border: s.id === currentSegmentId ? '1px solid #4a90d9' : '1px solid #eee',
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 600 }}>
                {s.index}. {s.summary}
              </div>
              <div style={{ fontSize: 11, color: chosen ? '#2e7d32' : '#999', marginTop: 2 }}>
                {chosen ? `✓ ${chosen}` : '未定稿'}
                {' · '}
                <span style={{ color: '#888' }}>{s.role}</span>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ borderTop: '1px solid #ddd', padding: '8px 0', display: 'flex', gap: 6 }}>
        <button
          onClick={onSave}
          style={{ flex: 1, padding: '6px 0', cursor: 'pointer', fontSize: 13 }}
        >
          保存当前段
        </button>
        <button
          onClick={onNext}
          style={{ flex: 1, padding: '6px 0', cursor: 'pointer', fontSize: 13 }}
        >
          进入字幕设定
        </button>
      </div>
    </div>
  );
};
