// 环节二：字幕样式（两栏：预览 + 参数），保存写回 storyboard.meta.subtitleStyle
import type { SubtitleStyle } from '../../../shared/types';

const TEXT_FIELDS: { key: keyof SubtitleStyle; label: string }[] = [
  { key: 'fontFamily', label: '字体' },
  { key: 'color', label: '文字颜色' },
  { key: 'strokeColor', label: '描边色' },
  { key: 'backgroundColor', label: '背景色' },
];
const NUMBER_FIELDS: { key: keyof SubtitleStyle; label: string }[] = [
  { key: 'fontSize', label: '字号' },
  { key: 'strokeWidth', label: '描边宽' },
  { key: 'letterSpacing', label: '字间距' },
];

export const SubtitlePanel: React.FC<{
  style: SubtitleStyle;
  onChange: (patch: Partial<SubtitleStyle>) => void;
  onSave: () => void;
  onBack: () => void;
}> = ({ style, onChange, onSave, onBack }) => {
  const field = (key: keyof SubtitleStyle, value: unknown, set: (v: string) => void) => (
    <input
      style={{ width: '100%', padding: '4px 8px', boxSizing: 'border-box' }}
      value={String(value ?? '')}
      onChange={(e) => set(e.target.value)}
    />
  );

  return (
    <div style={{ display: 'flex', gap: 16, height: '100%' }}>
      {/* 左：预览区（纸色底 + 字幕模拟） */}
      <div
        style={{
          flex: 1, borderRadius: 8, background: style.backgroundColor || '#faf7f2',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0 40px 60px',
        }}
      >
        <div
          style={{
            fontFamily: style.fontFamily || 'Helvetica, Arial, sans-serif',
            fontSize: style.fontSize ?? 48,
            color: style.color ?? '#2c2416',
            WebkitTextStroke: `${style.strokeWidth ?? 0}px ${style.strokeColor ?? 'transparent'}`,
            letterSpacing: style.letterSpacing ?? 0,
            textAlign: style.align ?? 'center',
            position: style.position === 'top' ? 'absolute' : 'static',
            top: style.position === 'top' ? 30 : undefined,
            lineHeight: 1.3,
          }}
        >
          示例字幕：时势造英雄
        </div>
      </div>

      {/* 右：参数表单 */}
      <div style={{ width: 280, overflow: 'auto' }}>
        <h3 style={{ marginTop: 0, fontSize: 14 }}>字幕样式</h3>
        {TEXT_FIELDS.map((f) => (
          <label key={f.key} style={{ display: 'block', marginBottom: 8, fontSize: 12 }}>
            {f.label}
            {field(f.key, style[f.key], (v) => onChange({ [f.key]: v }))}
          </label>
        ))}
        {NUMBER_FIELDS.map((f) => (
          <label key={f.key} style={{ display: 'block', marginBottom: 8, fontSize: 12 }}>
            {f.label}
            {field(f.key, style[f.key], (v) => onChange({ [f.key]: Number(v) }))}
          </label>
        ))}
        <label style={{ display: 'block', marginBottom: 8, fontSize: 12 }}>
          位置
          <select
            style={{ width: '100%', padding: '4px 6px' }}
            value={style.position ?? 'bottom'}
            onChange={(e) => onChange({ position: e.target.value as SubtitleStyle['position'] })}
          >
            <option value="bottom">底部</option>
            <option value="top">顶部</option>
            <option value="center">居中</option>
          </select>
        </label>
        <label style={{ display: 'block', marginBottom: 8, fontSize: 12 }}>
          对齐
          <select
            style={{ width: '100%', padding: '4px 6px' }}
            value={style.align ?? 'center'}
            onChange={(e) => onChange({ align: e.target.value as SubtitleStyle['align'] })}
          >
            <option value="left">左</option>
            <option value="center">中</option>
            <option value="right">右</option>
          </select>
        </label>
        <div style={{ display: 'flex', gap: 6, marginTop: 14 }}>
          <button onClick={onBack} style={{ flex: 1, padding: '6px 0', cursor: 'pointer' }}>
            返回上一步
          </button>
          <button onClick={onSave} style={{ flex: 1, padding: '6px 0', cursor: 'pointer' }}>
            确定当前设置
          </button>
        </div>
      </div>
    </div>
  );
};
