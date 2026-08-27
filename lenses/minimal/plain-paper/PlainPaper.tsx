// 纯色纸底镜头：只渲染整屏 #faf7f2 背景，无任何内容。
// 用于「只要背景」的段（口播/字幕照常，画面为纯色底）。
import React from 'react';
import { AbsoluteFill } from 'remotion';

export interface PlainPaperProps {}

export const PlainPaper: React.FC<PlainPaperProps> = () => (
  <AbsoluteFill style={{ background: '#faf7f2' }} />
);
