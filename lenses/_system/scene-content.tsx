// v7 共享内容承载渲染器：标题 + 行列表（默认）/ 标题 + 圆角图片
// 用于转场/内容承载镜头（storyboard 是 JSON，内容必须数据可表达）。
import React from 'react';
import { Img, staticFile } from 'remotion';
import { G } from './colors';
import { FONT_STACK } from './typography';

export interface SceneContentData {
  title?: string;
  type?: 'rows' | 'image';
  rows?: { label: string; value: string }[];
  image?: string;
}

export const SceneContent: React.FC<{
  content: SceneContentData;
  titleSize?: number;
  panelWidth?: number;
}> = ({ content, titleSize = 88, panelWidth = 1200 }) => {
  const { title, type = 'rows', rows, image } = content;
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: G.bg,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 48,
        boxSizing: 'border-box',
      }}
    >
      {title ? (
        <div
          style={{
            fontFamily: FONT_STACK,
            fontWeight: 800,
            fontSize: titleSize,
            color: G.ink,
            letterSpacing: -1,
            textAlign: 'center',
            overflowWrap: 'break-word',
            maxWidth: '90%',
          }}
        >
          {title}
        </div>
      ) : null}
      {type === 'image' && image ? (
        <Img
          src={staticFile(image)}
          style={{
            width: Math.min(panelWidth, '100%'),
            aspectRatio: '16 / 9',
            objectFit: 'cover',
            borderRadius: 24,
            border: `2px solid ${G.border}`,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            maxWidth: '90%',
          }}
        />
      ) : (
        <div
          style={{
            width: panelWidth,
            maxWidth: '90%',
            background: G.card,
            border: `2px solid ${G.border}`,
            borderRadius: 24,
            padding: '40px 56px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {(rows ?? []).map((r, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '22px 0',
                borderBottom:
                  i < (rows ?? []).length - 1 ? `1px solid ${G.line}` : 'none',
              }}
            >
              <span style={{ fontSize: 34, color: G.ink, fontWeight: 600 }}>
                {r.label}
              </span>
              <span
                style={{
                  marginLeft: 'auto',
                  fontSize: 36,
                  color: G.accent,
                  fontWeight: 800,
                }}
              >
                {r.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
