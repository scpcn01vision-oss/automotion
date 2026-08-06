// v7 中性灰阶卡片（占位内容渲染器）：标题条 + 若干内容行 + 底部头像/名称行。
// 原 Fixtures.Card 的 v7 中性替代——演示占位剥离后，需要卡片底座的镜头就地引用。
import React from 'react';
import { G } from './colors';

export const NeutralCard: React.FC<{
  w: number;
  h: number;
  seed?: number;
  style?: React.CSSProperties;
}> = ({ w, h, seed = 0, style }) => {
  const titleW = 45 + ((seed * 37) % 40); // 45–85%
  const lines = 2 + (seed % 3);
  return (
    <div style={{
      width: w, height: h, background: G.card, border: `2px solid ${G.border}`,
      borderRadius: 14, padding: 18, boxSizing: 'border-box',
      display: 'flex', flexDirection: 'column', gap: 10,
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)', ...style,
    }}>
      <div style={{ height: 16, width: `${titleW}%`, background: G.bar, borderRadius: 8 }} />
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} style={{ height: 10, width: `${88 - i * 14 - (seed % 5) * 3}%`, background: G.line, borderRadius: 5 }} />
      ))}
      <div style={{ marginTop: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
        <div style={{ width: 26, height: 26, borderRadius: 13, background: G.mid }} />
        <div style={{ height: 10, width: 64, background: G.line, borderRadius: 5 }} />
      </div>
    </div>
  );
};
