// 颜色控件：色块（原生取色盘）+ 文本输入 + 纸墨风预设色板，三者同步
import { useState } from 'react';

// 纸墨风常用色（G 色板）+ 阴影/文字常用色
const PRESETS = [
  '#2c2416', // ink 深棕墨色
  '#faf7f2', // bg 暖白仿宣纸
  '#d3923c', // accent 琥珀强调色
  '#8b7355', // mid 灰褐辅色
  '#d4ccbd', // border 暖灰边框
  '#e8e0d2', // nav 浅色侧栏
  '#fefcf8', // card 卡片白
  '#000000',
  '#ffffff',
  '#c0392b', // 警示红
];

function normalizeHex(s: string): string | null {
  const t = s.trim();
  return /^#?[0-9a-fA-F]{6}$/.test(t)
    ? (t.startsWith('#') ? t : '#' + t).toLowerCase()
    : null;
}

export const ColorField: React.FC<{
  label: string;
  value: string;
  onChange: (hex: string) => void;
}> = ({ label, value, onChange }) => {
  const [invalid, setInvalid] = useState(false);
  const current = normalizeHex(value) ?? '#000000';
  return (
    <label style={{ display: 'block', marginBottom: 8, fontSize: 12 }}>
      {label}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <input
          type="color"
          value={current}
          onChange={(e) => {
            onChange(e.target.value);
            setInvalid(false);
          }}
          style={{ width: 40, height: 26, padding: 0, border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer' }}
          title="点击打开取色盘"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => {
            const n = normalizeHex(e.target.value);
            if (n) {
              onChange(n);
              setInvalid(false);
            } else {
              setInvalid(true);
            }
          }}
          style={{
            flex: 1, padding: '4px 8px', boxSizing: 'border-box',
            border: invalid ? '1px solid #c00' : '1px solid #ccc',
            borderRadius: 4,
          }}
          placeholder="#rrggbb"
        />
      </div>
      {invalid && (
        <div style={{ color: '#c00', fontSize: 11, marginTop: 2 }}>色值需为 #rrggbb 格式</div>
      )}
      <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
        {PRESETS.map((c) => (
          <button
            key={c}
            onClick={() => {
              onChange(c);
              setInvalid(false);
            }}
            style={{
              width: 18, height: 18, background: c, padding: 0, cursor: 'pointer',
              border: c === current ? '2px solid #4a90d9' : '1px solid #ccc',
              borderRadius: 3,
            }}
            title={c}
          />
        ))}
      </div>
    </label>
  );
};
