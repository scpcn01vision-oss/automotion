// 参数表单：递归渲染（基础类型 / 数组行编辑 / 嵌套对象 / JSON 兜底）
import { useEffect, useState, useRef } from 'react';
import type { PropField } from '../../../shared/types';
import type { AnyLensProps } from '../playback';
import { ColorField } from './ColorField';

const isArray = (t: string) => t.includes('[]');
const isNumber = (t: string) => t === 'number' || /^-?\d+(?:\s*\|\s*-?\d+)+$/.test(t);
const isBoolean = (t: string) => t === 'boolean';
const isEnumStr = (t: string) => /^'[^']+'(?:\s*\|\s*'[^']+')+$/.test(t.trim());
// 条件显示：showWhen 字段未设置（undefined：按默认）或等于声明的值时显示
const shouldShow = (f: PropField, parent: AnyLensProps | undefined) => {
  if (f.internal) return false; // 内部字段（如口播锚点 cueSec）不作为用户可调参数
  if (!f.showWhen) return true;
  const v = parent?.[f.showWhen.field];
  return v === undefined || v === f.showWhen.value;
};
// 非标量结构：内联对象字面量 / 元组 / 值已是数组或对象（ReactNode、命名类型、tuple 等兜底）
const looksStructured = (t: string, v: unknown) =>
  t.includes('{') ||
  t.trim().startsWith('[') ||
  Array.isArray(v) ||
  (v !== null && typeof v === 'object');

function defaultFieldValue(f: PropField): unknown {
  if (isArray(f.type)) return [];
  if (isNumber(f.type)) return 0;
  if (isBoolean(f.type)) return false;
  return '';
}

// 上传图片到项目 pic/ 并返回可访问 URL（工作台 server /api/image）
async function uploadImage(file: File): Promise<string> {
  const dataBase64 = await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(',')[1] || '');
    r.onerror = () => reject(new Error('读取文件失败'));
    r.readAsDataURL(file);
  });
  const resp = await fetch('/api/image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename: file.name, dataBase64 }),
  });
  const json = await resp.json();
  if (!json.ok) throw new Error(json.error || '图片上传失败');
  return json.url;
}

// 「选择图片」字段：文件选择器按钮 + 隐藏 input，选图后上传并回填 URL
function ImagePickField({ value, onChange }: { value: unknown; onChange: (v: unknown) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div>
      <button type="button" onClick={() => ref.current?.click()}>选择图片</button>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          try {
            onChange(await uploadImage(f));
          } catch (err) {
            // eslint-disable-next-line no-alert
            alert('图片上传失败：' + String(err));
          }
          e.target.value = '';
        }}
      />
      {value ? <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{String(value)}</div> : null}
    </div>
  );
}

// 深层未定类型 JSON 兜底：格式化 textarea，实时解析（非法 JSON 不更新，红框提示）
function JsonFieldEditor({
  value,
  onChange,
  placeholder,
}: {
  value: unknown;
  onChange: (v: unknown) => void;
  placeholder: string;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const [invalid, setInvalid] = useState(false);
  const text = draft ?? (value === undefined ? '' : JSON.stringify(value, null, 2));

  // 外部 value 变化（reload/换段）时清 draft；本次输入回传的解析结果与 value 一致时保留 draft
  useEffect(() => {
    setDraft((d) => {
      if (d === null) return null;
      try {
        if (JSON.stringify(JSON.parse(d)) === JSON.stringify(value)) return d;
      } catch {
        return null; // 空/非法草稿且 value 已变化：显示新值
      }
      return null;
    });
    setInvalid(false);
  }, [value]);

  return (
    <div>
      <textarea
        style={{
          width: '100%', padding: '4px 8px', boxSizing: 'border-box', fontSize: 12,
          minHeight: 72, fontFamily: 'monospace',
          border: invalid ? '1px solid #c00' : '1px solid #ccc',
          borderRadius: 4,
        }}
        placeholder={placeholder}
        value={text}
        onChange={(e) => {
          setDraft(e.target.value);
          const t = e.target.value.trim();
          if (t === '') {
            setInvalid(false);
            onChange(undefined);
            return;
          }
          try {
            onChange(JSON.parse(t));
            setInvalid(false);
          } catch {
            setInvalid(true);
          }
        }}
        onBlur={() => {
          setDraft(null);
          setInvalid(false);
        }}
      />
      {invalid && (
        <div style={{ color: '#c00', fontSize: 11, marginTop: 2 }}>JSON 无效，未更新（修正后自动生效）</div>
      )}
    </div>
  );
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

  // 「选择图片」字段：渲染文件选择器（替代文本输入）
  if (field.file) {
    return <ImagePickField value={value} onChange={onChange} />;
  }

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
                <div key={f2.name} style={{ display: shouldShow(f2, item as AnyLensProps) ? 'flex' : 'none', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <div style={{ width: 110, fontSize: 12, flexShrink: 0 }}>
                    {f2.name}
                    {f2.description && <div style={{ color: '#888', fontSize: 10 }}>{f2.description}</div>}
                  </div>
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
  // 简单数组（string[] 等）→ JSON 兜底
  return (
    <div style={{ ...pad, marginBottom: 8 }}>
      <JsonFieldEditor
        value={value}
        onChange={onChange}
        placeholder='未设置（用镜头默认值）——输入 JSON 数组，如 ["a","b"]'
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
          <div key={f2.name} style={{ display: shouldShow(f2, obj as AnyLensProps) ? 'flex' : 'none', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <div style={{ width: 110, fontSize: 12, flexShrink: 0 }}>
              {f2.name}
              {f2.description && <div style={{ color: '#888', fontSize: 10 }}>{f2.description}</div>}
            </div>
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
  if (isEnumStr(field.type)) {
    const opts = (field.type.match(/'([^']+)'/g) || []).map((s) => s.replace(/'/g, ''));
    return (
      <select
        style={{ width: '100%', padding: '4px 6px', fontSize: 12 }}
        value={String(value ?? opts[0] ?? '')}
        onChange={(e) => onChange(e.target.value)}
      >
        {opts.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    );
  }
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
  // 颜色字段（名字含 color）：渲染取色盘（ColorField）
  if (field.type === 'string' && /color|colour/i.test(field.name)) {
    return <ColorField label="" value={String(value ?? '')} onChange={(hex) => onChange(hex)} />;
  }
  // 深层未定类型（对象/元组/ReactNode 等）→ JSON 兜底
  if (looksStructured(field.type, value)) {
    return (
      <div style={{ ...pad, marginBottom: 8 }}>
        <JsonFieldEditor
          value={value}
          onChange={onChange}
          placeholder={
            Array.isArray(value)
              ? '未设置（用镜头默认值）——输入 JSON 数组，如 ["a","b"]'
              : '未设置（用镜头默认值）——输入 JSON 对象，如 {"title":"示例"}'
          }
        />
      </div>
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
        <div key={f.name} style={{ display: shouldShow(f, params) ? 'flex' : 'none', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
          <div style={{ width: 160, fontSize: 13, paddingTop: 4, flexShrink: 0 }}>
            {f.name}
            {f.description && <div style={{ color: '#888', fontSize: 10 }}>{f.description}</div>}
          </div>
          <div style={{ flex: 1 }}>
            <FieldEditor field={f} value={params[f.name]} onChange={(v) => onChange(f.name, v)} />
          </div>
        </div>
      ))}
    </div>
  );
};
