import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { ErrorBoundary } from './ErrorBoundary';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary
      fallback={
        <div style={{ padding: 40, fontFamily: 'system-ui, sans-serif' }}>
          <h2>工作台发生错误</h2>
          <p>请刷新页面重试；若持续出现，把浏览器 Console 的报错发给 Codex。</p>
        </div>
      }
    >
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
