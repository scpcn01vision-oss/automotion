// 镜头播放加载器：按 registry.file 动态加载镜头组件（本地打包，无网络）
// import.meta.glob 在 build/dev 时把 lenses 全部组件打进播放包
import type { ComponentType } from 'react';
import type { PropField } from '../../shared/types';

const glob = import.meta.glob('../../lenses/**/*.tsx');

export type AnyLensProps = Record<string, unknown>;

export async function loadLensComponent(
  id: string,
  file: string,
): Promise<ComponentType<AnyLensProps>> {
  // registry.file 形如 lenses/native/brand-frame-snap/BrandFrameSnap.tsx
  const key = `../../${file}`;
  const loader = glob[key];
  if (!loader) {
    throw new Error(`未找到镜头文件: ${file}（key=${key}）`);
  }
  const mod = (await loader()) as Record<string, unknown>;
  const comp = mod[id];
  if (typeof comp !== 'function') {
    throw new Error(`镜头组件导出缺失: ${id}`);
  }
  return comp as ComponentType<AnyLensProps>;
}

// 按 props 类型生成默认值（换镜头自动填参）
export function defaultParams(props: PropField[]): AnyLensProps {
  const out: AnyLensProps = {};
  for (const p of props) {
    // 有真实默认值则填入（组件代码提取）；无则保持 undefined（组件用自身默认，不覆盖）
    if (p.default !== undefined) out[p.name] = p.default;
  }
  return out;
}

// 保存时按 props 类型递归转换（number/boolean 不落成字符串），并去掉未设置字段
export function normalizeParams(params: AnyLensProps, fields: PropField[]): AnyLensProps {
  const out: AnyLensProps = {};
  for (const f of fields) {
    const v = params[f.name];
    if (v === undefined) continue;
    if (Array.isArray(v)) {
      out[f.name] = f.fields
        ? v.map((item) => normalizeParams((item ?? {}) as AnyLensProps, f.fields!))
        : v;
    } else if (f.fields && typeof v === 'object' && v !== null) {
      out[f.name] = normalizeParams(v as AnyLensProps, f.fields);
    } else if (f.type === 'number') {
      out[f.name] = v === '' ? 0 : Number(v);
    } else if (f.type === 'boolean') {
      out[f.name] = v === 'true' || v === true;
    } else {
      out[f.name] = v;
    }
  }
  return out;
}

// 后台预热播放包：启动后分批加载全部镜头模块（import 有模块缓存，hover 时立即可用）
export function prewarm(entries: { id: string; file: string }[]): void {
  const BATCH = 5;
  let i = 0;
  const step = () => {
    if (i >= entries.length) return;
    const batch = entries.slice(i, i + BATCH);
    Promise.all(batch.map((e) => loadLensComponent(e.id, e.file).catch(() => null))).then(() => {
      i += BATCH;
      setTimeout(step, 40);
    });
  };
  setTimeout(step, 600); // 首屏让位，后台预热
}
