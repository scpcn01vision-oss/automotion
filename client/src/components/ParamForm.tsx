// 参数表单：递归渲染（基础类型 / 数组行编辑 / 嵌套对象 / JSON 兜底）
import type { PropField } from '../../../shared/types';
import type { AnyLensProps } from '../playback';

const isArray = (t: string) => t.includes('[]');
const isNumber = (t: string) => t === 'number';
const isBoolean = (t: string) => t === 'boolean';

function defaultFieldValue(f: PropField): unknown {
  if (isNumber(f.type)) return 0;
  if (isBoolean(f.type)) return false;
  return '';
}

function FieldEditor({
  field,
  value,
  onChange,
  indent = 0,
}: {
  field: PropField;
  value: unknown;
  onChange: (v: unknown) => void;
  indent?: number;
}) {
  const pad = { paddingLeft: indent * 16 };

  // 数组（对象数组 → 行列表；简单数组 → JSON 文本）
  if (isArray(field.type)) {
    const arr = Array.isArray(value) ? value : [];
    if (field.fields) {
      return (
        <div style={{ ...pad, marginBottom: 8 }}>
          {arr.length === 0 && (
            <div style={{ color: '#888', fontSize: 12, marginBottom: 4 }}>
              未设置（用镜头默认值）——点「添加行」开始编辑
            </div>
          )}
          {arr.map((item, i) => (
            <div
              key={i}
              style={{
                border: '1px solid #e0e0e0', borderRadius: 6, padding: 6, marginBottom: 6,
              }}
            >
              <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>行 {i + 1}</div>
              {field.fields!.map((f2) => (
                <div key={f2.name} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span style={{ width: 110, fontSize: 12 }}>{f2.name}</span>
                  <div style={{ flex: 1 }}>
                    <FieldEditor
                      field={f2}
                      value={(item as AnyLensProps)?.[f2.name]}
                      onChange={(v) => {
                        const next = [...arr];
                        next[i] = { ...(item as AnyLensProps), [f2.name]: v };
                        onChange(next);
                      }}
                    />
                  </div>
                </div>
              ))}
              <button
                onClick={() => onChange(arr.filter((_, j) => j !== i))}
                style={{ fontSize: 11, cursor: 'pointer' }}
              >
                删除行
              </button>
            </div>
          ))}
          <button
            onClick={() => {
              const blank: AnyLensProps = {};
              for (const f2 of field.fields!) blank[f2.name] = defaultFieldValue(f2);
              onChange([...arr, blank]);
            }}
            style={{ fontSize: 12, cursor: 'pointer' }}
          >
            + 添加行
          </button>
        </div>
      );
    }
    // 简单数组（string[] 等）→ JSON 文本
    return (
      <div style={{ ...pad, marginBottom: 8 }}>
        <input
          style={{ width: '100%', padding: '4px 8px', boxSizing: 'border-box', fontSize: 12 }}
          placeholder='JSON 数组，如 ["a","b"]'
          value={value === undefined ? '' : JSON.stringify(value)}
          onChange={(e) => {
            try {
              onChange(JSON.parse(e.target.value || '[]'));
            } catch {
              /* 输入中，暂不更新 */
            }
          }}
        />
      </div>
    );
  }

  // 嵌套对象（有 fields）→ 递归子表单
  if (field.fields) {
    const obj = (value ?? {}) as AnyLensProps;
    return (
      <div style={{ ...pad, marginBottom: 8 }}>
        {field.fields.map((f2) => (
          <div key={f2.name} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span style={{ width: 110, fontSize: 12 }}>{f2.name}</span>
            <div style={{ flex: 1 }}>
              <FieldEditor
                field={f2}
                value={obj[f2.name]}
                onChange={(v) => onChange({ ...obj, [f2.name]: v })}
              />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // 基础类型
  if (isBoolean(field.type)) {
    return (
      <select
        style={{ width: '100%', padding: '4px 6px', fontSize: 12 }}
        value={String(value ?? 'false')}
        onChange={(e) => onChange(e.target.value === 'true')}
      >
        <option value="false">false</option>
        <option value="true">true</option>
      </select>
    );
  }
  if (isNumber(field.type)) {
    return (
      <input
        style={{ width: '100%', padding: '4px 8px', boxSizing: 'border-box', fontSize: 12 }}
        type="number"
        value={String(value ?? '')}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }
  return (
    <input
      style={{ width: '100%', padding: '4px 8px', boxSizing: 'border-box', fontSize: 12 }}
      type="text"
      value={String(value ?? '')}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export const ParamForm: React.FC<{
  fields: PropField[];
  params: AnyLensProps;
  onChange: (name: string, value: unknown) => void;
}> = ({ fields, params, onChange }) => {
  return (
    <div>
      {fields.length === 0 && <p style={{ color: '#888', fontSize: 13 }}>该镜头无参数</p>}
      {fields.map((f) => (
        <div key={f.name} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
          <span style={{ width: 160, fontSize: 13, paddingTop: 4, flexShrink: 0 }}>{f.name}</span>
          <div style={{ flex: 1 }}>
            <FieldEditor field={f} value={params[f.name]} onChange={(v) => onChange(f.name, v)} />
          </div>
        </div>
      ))}
    </div>
  );
};
