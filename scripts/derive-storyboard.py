"""automotion：定稿分割版 → storyboard.json 骨架（派生）

用法：python scripts/derive-storyboard.py <分割版.md> [--project-dir <项目目录>] [--title <标题>] [--force]
  项目目录也可经环境变量 V7_PROJECT_DIR 指定（未设置且未传 --project-dir 时报错退出）

输入：人工审核定稿后的文案分割版（`## 段 N` + 段文本，语义单元）
输出：V7_PROJECT_DIR/storyboard.json 骨架（segments 的 text 就位；summary/role/features 由 AI 补，
      durationSec 由转录回填真实时长）

保护：storyboard.json 已存在时不覆盖（--force 才覆盖），避免误跑丢掉定稿数据。
"""
import argparse
import json
import os
import re
import sys
from datetime import datetime
from pathlib import Path


def parse_segments(md_text):
    """解析 `## 段 N` 分割版 → 段列表（按序号升序）。"""
    blocks = re.split(r"^##\s*段\s*(\d+)\s*$", md_text, flags=re.MULTILINE)
    segs = []
    for i in range(1, len(blocks), 2):
        index = int(blocks[i])
        text = blocks[i + 1].strip()
        if not text:
            print(f"[warn] 段 {index} 无正文，跳过")
            continue
        segs.append({
            "id": f"seg-{index:02d}",
            "text": text,
            "keywords": [],
            "phraseRange": [0, 0],
            "durationSec": 0,
            "lensId": "",
            "params": {},
        })
    segs.sort(key=lambda s: s["id"])
    return segs


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("script_file", help="定稿分割版 md 路径")
    parser.add_argument("--project-dir", help="项目目录（缺省用 V7_PROJECT_DIR）")
    parser.add_argument("--title", help="视频标题（缺省取分割版首个 # 标题或目录名）")
    parser.add_argument("--force", action="store_true", help="storyboard.json 已存在时仍覆盖")
    args = parser.parse_args()

    project_dir = args.project_dir or os.environ.get("V7_PROJECT_DIR")
    if not project_dir:
        sys.exit("[FAIL] 未指定项目目录（--project-dir 或 V7_PROJECT_DIR）")
    script_path = Path(args.script_file)
    if not script_path.exists():
        sys.exit(f"[FAIL] 分割版不存在：{script_path}")

    out_path = Path(project_dir) / "storyboard.json"
    if out_path.exists() and not args.force:
        sys.exit(f"[FAIL] {out_path} 已存在（可能已有定稿），如需覆盖请加 --force")

    md_text = script_path.read_text(encoding="utf-8")
    segments = parse_segments(md_text)
    if not segments:
        sys.exit("[FAIL] 分割版未解析出任何段（需 `## 段 N` 格式）")

    title = args.title
    if not title:
        m = re.search(r"^#\s*(.+)$", md_text, flags=re.MULTILINE)
        title = m.group(1).strip() if m else Path(project_dir).name

    storyboard = {
        "meta": {
            "title": title,
            "created": datetime.now().astimezone().isoformat(),
            "subtitleStyle": {},
        },
        "segments": segments,
    }
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(
        json.dumps(storyboard, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[OK] 派生完成：{out_path}（{len(segments)} 段）")
    print("    下一步：AI 为每段补 summary/role/features，再进入转录")


if __name__ == "__main__":
    main()
