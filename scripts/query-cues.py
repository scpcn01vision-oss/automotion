"""查文案词/短语在指定段内的口播开始秒（口播对齐填参工具）

用法：python scripts/query-cues.py --segment 4 "Agentic AI" "以模治模"
  项目目录经环境变量 V7_PROJECT_DIR 指定（缺省回退 013B 开发默认路径）
  输出：每个词/短语的 整片秒 → 段内秒（段内秒 = 整片秒 − 段起始整片秒）
  数据源：transcript.json 的 phrases（文案词级时间戳）
"""
import json
import os
import sys
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

PROJECT = Path(os.environ.get("V7_PROJECT_DIR", r"E:\桌面\打破信息差\视频文件\013B"))


def main():
    args = sys.argv[1:]
    seg_id = None
    terms = []
    i = 0
    while i < len(args):
        if args[i] == "--segment" and i + 1 < len(args):
            seg_id = f"seg-{int(args[i + 1]):02d}"
            i += 2
        else:
            terms.append(args[i])
            i += 1
    if not seg_id or not terms:
        print(__doc__)
        return 2

    sb = json.loads((PROJECT / "storyboard.json").read_text(encoding="utf-8"))
    trans = json.loads((PROJECT / "transcript.json").read_text(encoding="utf-8"))
    phrases = trans["phrases"]

    segs = sb["segments"]
    try:
        idx = next(i for i, s in enumerate(segs) if s["id"] == seg_id)
    except StopIteration:
        print(f"段不存在：{seg_id}")
        return 1
    seg_start = round(sum(s["durationSec"] for s in segs[:idx]), 3)
    print(f"段 {seg_id} 起始整片秒: {seg_start}s")

    def find_term(term):
        key = term.replace(" ", "")
        for p in range(len(phrases)):
            acc = ""
            for q in range(p, min(p + 25, len(phrases))):
                acc += phrases[q]["text"].replace(" ", "")
                if acc == key:
                    return phrases[p]["start"]
                if len(acc) > len(key) + 2:
                    break
        return None

    for term in terms:
        whole = find_term(term)
        if whole is None:
            print(f"  {term}: 未在转录词序列中找到")
        else:
            print(
                f"  {term}: 整片 {whole:.2f}s → 段内 {round(whole - seg_start, 2):.2f}s"
            )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
