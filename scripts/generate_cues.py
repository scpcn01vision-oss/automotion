"""自动生成镜头口播锚点（cueSec[] / revealAtSec）——定稿后对齐流程。

用量（项目目录经 --project-dir 或 V7_PROJECT_DIR 指定）：
    python scripts/generate_cues.py --project-dir "<项目目录>" [--write]

原理：
- 对声明了锚点的镜头（ANCHOR_SCHEMA），从 params 的内容项/字段提取"文案关键词"，
  在 transcript.json 的 phrases（词级时间戳，整片秒）里精确匹配，得整片秒。
- 段内秒 = 整片秒 - 段起点。段起点 = 第 0 段用 0，其余用 storyboard 绝对 startSec
  （与整片 WholeVideo 一致，禁止用 durationSec 累加——丢弃段间停顿会整体偏前）。
- 匹配不到（多为"提炼文本"而非原文）→ 不静默，记入 pending 清单，交由 AI 语义定位。

未加 --write 时只输出结果，不改 storyboard.json。
"""
import json
import os
import sys
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass


def resolve_project_dir():
    argv = sys.argv[1:]
    if "--project-dir" in argv:
        i = argv.index("--project-dir")
        if i + 1 < len(argv):
            return Path(argv[i + 1])
    env = os.environ.get("V7_PROJECT_DIR")
    if env:
        return Path(env)
    sys.exit("[FAIL] 未指定项目目录（用 --project-dir 或设 V7_PROJECT_DIR）")


# ---- 锚点来源映射：lensId -> 如何从 params 提词查 transcript ----
# align='cue'   ：内容项数组逐项对齐，array=数组字段名，key=每项取词的字段（None 表示元素本身即词）
# align='event' ：单事件锚点，fields=从 params 按优先级取词的字段名列表（支持 a.b.c 嵌套）
ANCHOR_SCHEMA = {
    "CardFlipReveal": {"align": "cue", "array": "cards", "key": "label"},
    "WordRelayFilmstrip": {"align": "cue", "array": "items", "key": "word"},
    "CommandPaletteSummon": {"align": "cue", "array": "commands", "key": "label"},
    "StreamResponse": {"align": "cue", "array": "rows", "key": "title"},
    "BeatStepListThemeCycle": {"align": "cue", "array": "words", "key": None},
    "PopupBookRise": {"align": "cue", "array": "cards", "key": "label"},
    "SkeletonReveal": {"align": "cue", "array": "messages", "key": "text"},
    "GridWaveFlip": {"align": "cue", "array": "cards", "key": "title"},
    "BentoLightUp": {"align": "cue", "array": "cards", "key": "title"},
    "PaperTitleCard": {"align": "cue", "array": "words", "key": "text"},
    "CelFlashStomp": {"align": "cue", "array": "words", "key": None},
    "HashtagToPillMaterialize": {"align": "event", "fields": ["hashtag", "pillText", "title"]},
    "BarnDoorSplit": {"align": "event", "fields": ["sceneB.rows.0.value", "sceneB.rows.0.label", "sceneB.title"]},
    "MarkerUnderlineTitle": {"align": "event", "fields": ["highlight", "title", "prefix"]},
    "VersusSlam": {"align": "event", "fields": ["sceneB.rows.0.value", "sceneB.rows.0.label", "sceneB.title"]},
    "InkBleedReveal": {"align": "event", "fields": ["newScene.rows.0.label", "newScene.title"]},
    "RedHeadFileQuote": {"align": "cue", "array": "body", "key": None},
    "LineUnfoldPanel": {"align": "event", "fields": ["panel.title", "panel.rows.0.label"]},
    "TextAsMask": {"align": "event", "fields": ["card.title"]},
    "MaskingTapeSlap": {"align": "event", "fields": ["card.title"]},
    "LineCarryTransition": {"align": "event", "fields": ["sceneB.rows.0.value", "sceneB.rows.0.label", "sceneB.title"]},
    "ParticleSandFill": {"align": "event", "fields": ["label", "cardTitle"]},
    "PaperPlaneMessenger": {"align": "event", "fields": ["windowB.rows.0.value", "windowB.title", "windowB.rows.0.label"]},
    "SplitFlapFlip": {"align": "event", "fields": ["text"]},
    "LetterDropPhysics": {"align": "event", "fields": ["word"]},
    "ScrambleDecode": {"align": "event", "fields": ["text"]},
    "LetterspaceMaterialize": {"align": "event", "fields": ["word"]},
    "LetterformDriftAssembly": {"align": "event", "fields": ["word"]},
    "TextOnPath": {"align": "event", "fields": ["text"]},
    "TrackingExpandReveal": {"align": "event", "fields": ["word", "subtitle"]},
    "TextColumnConverge": {"align": "event", "fields": ["leftWord", "subtitle"]},
    "TerminalTypewriter": {"align": "event", "fields": ["command"]},
    "RisoMisregistrationHit": {"align": "event", "fields": ["text"]},
    "MorphFromPrimitive": {"align": "event", "fields": ["card.label"]},
}


def get_path(obj, dotted):
    cur = obj
    for part in dotted.split("."):
        if isinstance(cur, dict) and part in cur:
            cur = cur[part]
        elif isinstance(cur, list) and part.isdigit() and int(part) < len(cur):
            cur = cur[int(part)]
        else:
            return None
    return cur


def split_terms(text):
    """把文本按标点/斜杠/空格切成候选词，逐段尝试匹配。"""
    import re
    return [t for t in re.split(r"[/,，;；、\s]+", text) if t]


def find_start(phrases, term, lo, hi):
    """在词序列里精确匹配 term（去空格连续拼接），且词首/词尾都落在 [lo, hi) 段区间内。
    返回整片秒；找不到或落在段外返回 None。"""
    key = term.replace(" ", "").replace("\u3000", "")
    if not key:
        return None
    n = len(key)
    for p in range(len(phrases)):
        st = phrases[p]["start"]
        if st < lo:
            continue
        if st >= hi:
            break
        acc = ""
        for q in range(p, min(p + 40, len(phrases))):
            acc += phrases[q]["text"].replace(" ", "")
            if acc == key:
                if phrases[q]["end"] <= hi:
                    return st
                break
            if len(acc) > n + 1:
                break
    return None


def loc_term(phrases, text, lo, hi):
    """对一段文本尝试多个候选词，取落在 [lo,hi) 内的最早命中；返回整片秒或 None。"""
    for t in split_terms(text):
        s = find_start(phrases, t, lo, hi)
        if s is not None:
            return s
    return None


def main():
    project = resolve_project_dir()
    if "--write" not in sys.argv:
        print("[dry-run] 未加 --write，仅输出结果，不写回 storyboard.json")

    sb_path = project / "storyboard.json"
    tr_path = project / "transcript.json"
    sb = json.loads(sb_path.read_text(encoding="utf-8"))
    trans = json.loads(tr_path.read_text(encoding="utf-8"))
    phrases = trans["phrases"]
    segments = sb["segments"]

    generated = []
    pending = []
    for i, seg in enumerate(segments):
        lens = seg.get("lensId")
        schema = ANCHOR_SCHEMA.get(lens)
        if not schema:
            continue
        params = seg.get("params", {})
        seg_base = 0.0 if i == 0 else seg.get("startSec", 0.0)
        seg_hi = seg_base + seg.get("durationSec", 0.0)
        seg_id = seg["id"]

        if schema["align"] == "cue":
            arr = params.get(schema["array"])
            if not isinstance(arr, list) or not arr:
                pending.append((seg_id, lens, f"内容项数组 {schema['array']} 为空"))
                continue
            cues = []
            item_pending = []
            for item in arr:
                raw = item if schema["key"] is None else item.get(schema["key"])
                if not isinstance(raw, str) or not raw.strip():
                    item_pending.append(str(raw))
                    cues.append(None)
                    continue
                whole = loc_term(phrases, raw, seg_base, seg_hi)
                if whole is None:
                    item_pending.append(raw)
                    cues.append(None)
                else:
                    cues.append(round(whole - seg_base, 2))
            if any(c is None for c in cues):
                params["cueSec"] = cues  # 保留 null 占位，AI 补
                pending.append((seg_id, lens, f"{schema['array']} 项未定位: {item_pending}"))
            else:
                params["cueSec"] = [c for c in cues if c is not None]
                generated.append((seg_id, lens, "cue", params["cueSec"]))
            continue

        # event
        reveal = None
        used_field = None
        for fd in schema["fields"]:
            raw = get_path(params, fd)
            if not isinstance(raw, str) or not raw.strip():
                continue
            whole = loc_term(phrases, raw, seg_base, seg_hi)
            if whole is not None:
                reveal = round(whole - seg_base, 2)
                used_field = fd
                break
        if reveal is None:
            pending.append((seg_id, lens, "未能定位单事件锚点（需 AI 语义指定）"))
        else:
            params["revealAtSec"] = reveal
            generated.append((seg_id, lens, "event", (reveal, used_field)))

    if "--write" in sys.argv:
        sb_path.write_text(json.dumps(sb, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"[written] storyboard.json 已更新（段起点用绝对 startSec）")

    print("\n=== 自动生成 ===")
    for g in generated:
        print(f"  {g[0]} {g[1]} {g[2]} -> {g[3]}")
    print(f"\n=== 未自动定位（待 AI 语义补齐）: {len(pending)} ===")
    for seg_id, lens, why in pending:
        print(f"  {seg_id} {lens}: {why}")
    print(f"\n自动 {len(generated)} 段 / 待 AI {len(pending)} 段")


if __name__ == "__main__":
    raise SystemExit(main())
