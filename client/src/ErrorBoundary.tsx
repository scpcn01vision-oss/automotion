// 通用错误边界：单个预览/组件出错时显示占位，避免整页白屏
import { Component } from 'react';
import type { ReactNode } from 'react';

export class ErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}
