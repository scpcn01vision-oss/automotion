"""口播锚点闸门：工作台定稿后、进整片前校验故事板已对齐。

用法：python scripts/check-cues.py --project-dir "<项目目录>"

检查：
- 段镜头在 ANCHOR_SCHEMA 声明为 cue/event 的，params 必须给出对应锚点
  （cue 类需 cueSec 且与内容数组同长、无 null 占位；event 类需 revealAtSec）。
- registry 声明了 cueSec/revealAtSec 但 ANCHOR_SCHEMA 未定义自动规则的镜头：
  输出警告（非阻断），提示需人工确认，防止静默漏掉。
任一分级为错误则退出码 2；全部通过输出 [OK] 并退出码 0。
"""
import json
import os
import sys
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

# 让同目录的 generate_cues 可被 import（脚本所在目录加入 sys.path）
sys.path.insert(0, str(Path(__file__).resolve().parent))
from generate_cues import ANCHOR_SCHEMA, resolve_project_dir


def load_json(path):
    return json.loads(path.read_text(encoding="utf-8"))


def main():
    project = resolve_project_dir()
    sb = load_json(project / "storyboard.json")
    registry = load_json(Path(__file__).resolve().parent.parent / "shared" / "registry.json")
    anchor_lens = {e["id"] for e in registry["entries"] if any(
        p.get("name") in ("cueSec", "revealAtSec") for p in e.get("props", [])
    )}

    errors = []
    warnings = []
    for i, seg in enumerate(sb["segments"]):
        lens = seg.get("lensId")
        params = seg.get("params", {})
        schema = ANCHOR_SCHEMA.get(lens)
        if schema:
            if schema["align"] == "cue":
                arr = params.get(schema["array"])
                cues = params.get("cueSec")
                if not isinstance(arr, list) or not arr:
                    errors.append(f"{seg['id']} {lens}: 内容数组 {schema['array']} 为空")
                elif not isinstance(cues, list) or len(cues) != len(arr):
                    errors.append(f"{seg['id']} {lens}: 缺 cueSec（应为 {len(arr)} 项）")
                elif any(c is None for c in cues):
                    errors.append(f"{seg['id']} {lens}: cueSec 仍含未定位占位(需 AI 补齐)")
            else:  # event
                if not isinstance(params.get("revealAtSec"), (int, float)):
                    errors.append(f"{seg['id']} {lens}: 缺 revealAtSec（需 AI 语义定位）")
        elif lens in anchor_lens:
            warnings.append(f"{seg['id']} {lens}: registry 声明了锚点但未定义自动规则，请人工确认是否需对齐")

    if warnings:
        print("--- 警告（非阻断）---")
        for w in warnings:
            print("  [WARN]", w)
    if errors:
        print("--- 错误（阻断，需补齐后再进整片）---")
        for e in errors:
            print("  [ERR]", e)
        print(f"\n[FAIL] 共 {len(errors)} 段未对齐；缺锚点会使画面与口播脱节。")
        return 2
    print("[OK] 锚点全部就绪（声明为 cue/event 的段均已对齐）")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
