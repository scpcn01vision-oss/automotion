"""automotion：整片合成前的镜头可用性闸门。

用途：Step 4 工作台定稿后、Step 5 整片合成前，校验项目 storyboard 里
所有 lensId 都在镜头 registry（shared/registry.json）内。

历史教训（2026-08-22）：旧整片入口用一份手写 LENS_MAP（仅 29 个镜头），
与匹配/工作台开放的全量镜头库不一致，未登记镜头被静默渲染成空白，
造成"工作台 20/20 定稿、整片 10 段无画面"。新整片入口已改为按 registry
动态解析（渲染面=镜头库），本脚本是进入整片前的独立闸门，防止：
  - storyboard 里出现 registry 外的镜头 id；
  - 未来整片入口退化回静态映射时静默缺失。
  - storyboard 段缺绝对时间边界 startSec/endSec（整片会静默回退累计定位，
    段间停顿被丢弃，边界逐段偏移——2026-08-23 教训：automotion-v7 环境
    用旧转录脚本重新生成 storyboard 后该字段丢失，需重跑 transcribe.py 回填）。

用法：
  python scripts/check-whole-lenses.py --project-dir <项目目录>
  项目目录也可经环境变量 V7_PROJECT_DIR 指定。

退出码：0 = 全部通过；1 = 存在缺失/错误。
"""
import argparse
import json
import os
import sys
from pathlib import Path


def load_registry_ids(tool_root: Path) -> set[str]:
    reg = json.loads((tool_root / "shared" / "registry.json").read_text(encoding="utf-8"))
    entries = reg.get("entries", [])
    ids = {e.get("id") for e in entries if e.get("id")}
    if not ids:
        sys.exit("[FAIL] registry.json 无任何镜头条目")
    return ids


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--project-dir", help="项目目录（缺省用 V7_PROJECT_DIR）")
    args = parser.parse_args()

    tool_root = Path(__file__).resolve().parent.parent
    project_dir = args.project_dir or os.environ.get("V7_PROJECT_DIR")
    if not project_dir:
        sys.exit("[FAIL] 未指定项目目录（--project-dir 或 V7_PROJECT_DIR）")

    sb_path = Path(project_dir) / "storyboard.json"
    if not sb_path.exists():
        sys.exit(f"[FAIL] storyboard.json 不存在：{sb_path}")

    registry_ids = load_registry_ids(tool_root)
    storyboard = json.loads(sb_path.read_text(encoding="utf-8"))
    segments = storyboard.get("segments", [])
    if not segments:
        sys.exit("[FAIL] storyboard 无 segments")

    missing = []
    for s in segments:
        lens_id = s.get("lensId", "")
        if not lens_id:
            missing.append(f"{s['id']}: 未定稿（lensId 为空）")
        elif lens_id not in registry_ids:
            missing.append(f"{s['id']}: {lens_id} 不在 registry")
        if s.get("startSec") is None or s.get("endSec") is None:
            missing.append(
                f"{s['id']}: 缺绝对时间边界 startSec/endSec"
                f"（需用新脚本重跑 transcribe.py 回填）"
            )

    if missing:
        print("[FAIL] 整片镜头可用性校验未通过：")
        for m in missing:
            print(f"  - {m}")
        print("      处理：工作台为该段重新选镜头，或确认镜头已加入 registry 后重跑")
        sys.exit(1)

    used = {s["lensId"] for s in segments}
    print(f"[OK] 整片镜头可用性校验通过：{len(segments)} 段，"
          f"使用 {len(used)} 个镜头（registry 共 {len(registry_ids)} 个）")


if __name__ == "__main__":
    main()
