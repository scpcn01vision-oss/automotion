// v7 中性内容卡渲染器：标题 + 行列表（label/value）。
// storyboard 是 JSON，内容必须数据可表达——占位条已废弃（本质是未参数化的图标/文字）。
import React from 'react';
import { G } from './colors';
import type { SceneContentData } from './scene-content';

export const NeutralCard: React.FC<{
  w: number;
  h: number;
  content: SceneContentData;
  split?: boolean; // label 左半居中 / value 右半居中（x 轴左右半区均匀）
  style?: React.CSSProperties;
}> = ({ w, h, content, split = false, style }) => {
  const titleSize = Math.max(20, Math.floor(w * 0.065));
  const rowLabel = Math.max(16, Math.floor(w * 0.055));
  const rowValue = Math.max(16, Math.floor(w * 0.058));
  const pad = Math.max(18, Math.round(w * 0.06)); // 内边距按卡宽比例，避免贴边
  return (
    <div
      style={{
        width: w,
        height: h,
        background: G.card,
        border: `2px solid ${G.border}`,
        borderRadius: 14,
        padding: pad,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        ...style,
      }}
    >
      {content.title ? (
        <div style={{ fontSize: titleSize, fontWeight: 700, color: G.ink, marginBottom: 10, textAlign: 'center' }}>
          {content.title}
        </div>
      ) : null}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-evenly' }}>
        {(content.rows ?? []).map((r, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '8px 0',
              borderBottom: i < (content.rows ?? []).length - 1 ? `1px solid ${G.line}` : 'none',
            }}
          >
            {split ? (
              <>
                <span style={{ flex: 1, textAlign: 'center', fontSize: rowLabel, color: G.ink, fontWeight: 600 }}>{r.label}</span>
                <span style={{ flex: 1, textAlign: 'center', fontSize: rowValue, color: G.accent, fontWeight: 800 }}>{r.value}</span>
              </>
            ) : (
              <>
                <span style={{ fontSize: rowLabel, color: G.ink, fontWeight: 600 }}>{r.label}</span>
                <span style={{ marginLeft: 'auto', fontSize: rowValue, color: G.accent, fontWeight: 800 }}>
                  {r.value}
                </span>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
