// 右栏推荐区：当前段 Top 5 候选（全部展示不折叠）+ 选用
import type { MatchSegment } from '../../../shared/types';

export const Recommendations: React.FC<{
  segment: MatchSegment | undefined;
  currentLensId: string;
  onPick: (lensId: string) => void;
}> = ({ segment, currentLensId, onPick }) => {
  if (!segment) return <p style={{ color: '#888', fontSize: 13 }}>无匹配结果</p>;
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 12, color: '#666', marginBottom: 6 }}>
        Top 5 候选（{segment.id}）
      </div>
      {segment.top5.map((c, i) => (
        <div
          key={c.lensId}
          style={{
            padding: '6px 8px', marginBottom: 4, borderRadius: 6,
            border: c.lensId === currentLensId ? '1px solid #4a90d9' : '1px solid #eee',
            background: c.lensId === currentLensId ? '#eef6ff' : '#fff',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, color: '#999' }}>{i + 1}</span>
            <span style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>{c.lensId}</span>
            <button
              onClick={() => onPick(c.lensId)}
              style={{ fontSize: 12, padding: '2px 8px', cursor: 'pointer' }}
            >
              选用
            </button>
          </div>
          <div style={{ fontSize: 12, color: '#777', marginTop: 2 }}>{c.reason}</div>
        </div>
      ))}
    </div>
  );
};
