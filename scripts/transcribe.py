"""automotion-v7 M5：转录 + 对齐 + 字幕切分

输入（项目侧 013B）：full.wav + storyboard.json
输出（项目侧 013B）：transcript.json / subtitles.json / storyboard.durationSec 更新
依赖：whisper / jieba / opencc
切分规则：docs/字幕切分规范-M5.md（v3，2026-08-11 定稿）

用法：python scripts/transcribe.py [--skip-transcribe]
  --skip-transcribe：跳过 whisper 转录（复用已生成的 transcript.json，调试切分用）
"""
import json
import re
import sys
from pathlib import Path

PROJECT_DIR = Path(r"E:\桌面\打破信息差\视频文件\013B")
AUDIO = PROJECT_DIR / "full.wav"
STORYBOARD = PROJECT_DIR / "storyboard.json"
OUT_TRANSCRIPT = PROJECT_DIR / "transcript.json"
OUT_SUBTITLES = PROJECT_DIR / "subtitles.json"

# ---------- 1. 读取 ----------
def read_storyboard(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def segment_full_text(segments):
    """把 32 段 text 拼成全文（段间用特殊分隔符标记边界）"""
    parts = []
    for s in segments:
        parts.append(s["text"].strip())
    return "\n".join(parts)

# ---------- 2. whisper 转录（词级时间戳） ----------
def whisper_transcribe(audio_path):
    import whisper
    print("[2] whisper 转录中（medium，词级时间戳）...")
    model = whisper.load_model("medium")
    result = model.transcribe(str(audio_path), word_timestamps=True, language="zh", verbose=False)
    words = []
    for seg in result["segments"]:
        for w in seg.get("words", []):
            words.append({
                "text": w["word"].strip(),
                "start": round(w["start"], 3),
                "end": round(w["end"], 3),
            })
    print(f"    转录: {len(words)} 词, 总时长 {words[-1]['end']:.2f}s")
    return words

# ---------- 3. 对齐：文案词 → 时间戳（jieba + difflib） ----------
def align_to_script(whisper_words, script_text):
    print("[3] jieba 分词 + difflib 对齐...")
    import jieba
    jieba.setLogLevel(0)
    try:
        import opencc
        cc = opencc.OpenCC("t2s")
        for w in whisper_words:
            w["text"] = cc.convert(w["text"])
        print("    繁→简完成")
    except ImportError:
        pass

    script_words = list(jieba.cut(script_text))
    print(f"    文案分词: {len(script_words)} 词")

    def cln(s):
        return re.sub(r"[^\u4e00-\u9fff\w]", "", s)

    whisper_clean = cln("".join(w["text"] for w in whisper_words))
    script_clean = cln("".join(script_words))

    from difflib import SequenceMatcher
    matcher = SequenceMatcher(None, whisper_clean, script_clean)

    script_char_to_word = []
    for i, w in enumerate(script_words):
        for _ in cln(w):
            script_char_to_word.append(i)

    whisper_char_to_time = []
    for w in whisper_words:
        for _ in cln(w["text"]):
            whisper_char_to_time.append((w["start"], w["end"]))

    phrases = [{"text": w, "start": 0.0, "end": 0.0} for w in script_words]

    for tag, i1, i2, j1, j2 in matcher.get_opcodes():
        if tag == "equal":
            for offset in range(i2 - i1):
                wi = i1 + offset
                si = j1 + offset
                if wi < len(whisper_char_to_time) and si < len(script_char_to_word):
                    sw = script_char_to_word[si]
                    st, et = whisper_char_to_time[wi]
                    if phrases[sw]["start"] == 0.0 or st < phrases[sw]["start"]:
                        phrases[sw]["start"] = st
                    if et > phrases[sw]["end"]:
                        phrases[sw]["end"] = et

    # 未匹配词补时长
    for i in range(len(phrases)):
        if phrases[i]["start"] == 0.0:
            if i > 0:
                phrases[i]["start"] = phrases[i - 1]["end"]
                phrases[i]["end"] = phrases[i - 1]["end"] + 0.1
            elif i < len(phrases) - 1:
                phrases[i]["start"] = max(0.0, phrases[i + 1]["start"] - 0.1)
                phrases[i]["end"] = phrases[i + 1]["start"]

    return phrases

# ---------- 4. 字幕切分（规范 v4） ----------
def han_count(s):
    """汉字数（单条字幕 ≤18 汉字）"""
    return sum(1 for ch in s if "\u4e00" <= ch <= "\u9fff")

def effective_han(content, protected):
    """汉字数 + 占位符对应的书名号内容长度（书名号整体计入）"""
    n = han_count(content)
    for idx, val in enumerate(protected):
        ph = "\x00" + str(idx)
        cnt = content.count(ph)
        if cnt:
            n += cnt * han_count(val)
    return n

def visual_len(s):
    """视觉宽度（半角字符 2 个 = 1，顿号分组用）"""
    half = sum(1 for ch in s if ord(ch) < 128)
    full = len(s) - half
    return full + half / 2

SPECIAL_STANDALONE = [
    "第一", "第二", "第三", "第四", "第五", "第六", "第七", "第八",
    "好", "说实话", "换句话说", "你可能会问", "举个例子", "更重要的是",
    "那现在", "现在", "其次是现在", "现在是",
]
TAIL_ADVERBS = ["原本", "基本上", "基本", "直接", "大抵"]  # 兜底修正：不允许留在句尾
HEAD_CONNECTORS = ["和", "与"]  # 不允许留在句首
# 强语义切点（不论长短都切；语义边界明显：副词/转折/介宾/动宾分界）
CUT_WORDS_STRONG = [
    "很大程度上", "不再是", "甚至", "现在", "原本", "基本上", "基本", "大抵", "完全",
    "可能", "根本", "尽量", "不再", "相比", "贡献", "解决",
    "纳入", "转向", "写进", "创造", "做到", "就是", "都是", "才是", "也是",
    "还是", "正是", "让", "一起", "降到",
]
# 弱语义切点（仅超 18 字时用：句内介词/系词/副词，避免过度切分）
CUT_WORDS_WEAK = [
    "通过", "用", "在", "是", "被", "把", "来", "从", "搭",
    "就", "都", "也", "再", "将", "正式", "变成", "直接", "共享",
]
# 动词切其后（写进/创造了/做到 留前句，宾语跟后句），强切点
# （「叫」不设切点——「一个叫FFmpeg的开源项目」整体动宾，切「叫」会悬置动词）
CUT_VERB_AFTER = ["写进", "创造", "做到"]

def split_subtitles(script_text):
    """按规范切分文案 → 字幕块列表"""
    # 合并多余空白但保留英文单词间空格
    text = re.sub(r"\s+", " ", script_text)

    # 4.1 书名号保护（整体不切；引号不做保护——避免跨句错配，由语义切点处理）
    protected = []
    PLACEHOLDER = "\x00"
    def protect(s):
        out = []
        i = 0
        while i < len(s):
            if s[i] == "《":
                j = s.find("》", i + 1)
                if j > i:
                    protected.append(s[i:j + 1])
                    out.append(PLACEHOLDER + str(len(protected) - 1))
                    i = j + 1
                    continue
            out.append(s[i])
            i += 1
        return "".join(out)
    def restore(s):
        for idx, val in enumerate(protected):
            s = s.replace(PLACEHOLDER + str(idx), val)
        return s

    text = protect(text)

    # 4.2 标点切分（问号/感叹号保留在块内，问答分开；后引号归引文前块）
    raw = re.split(r"([，。？！；：])", text)
    blocks = []
    cur = ""
    quote_count = 0
    for part in raw:
        if not part:
            continue
        # 后引号（第偶数个 "）在块首 → 引号并入前块，剩余内容另起块
        if part.startswith('"') and quote_count % 2 == 1 and blocks:
            blocks[-1] += '"'
            part = part[1:]
            quote_count += 1
            if not part:
                continue
        quote_count += part.count('"')
        cur += part
        if part in "，。？！；：" :
            blocks.append(cur)
            cur = ""
    if cur:
        blocks.append(cur)

    # 4.3 语义切分：全部走 split_long（强切点不论长短；≤18 无强切点则单条）
    result = []
    for b in blocks:
        content = b.rstrip("，。；：、").strip()  # 保留「？」「！」；去段间前导空格
        if not content:
            continue
        out_parts = split_long(content, protected)
        result.extend(out_parts)

    # 4.4 词边界修正
    result = fix_word_boundaries(result, protected)

    # 4.4b 句首「现在」独立块并入后块（「现在它们被一口气写进了」）
    fixed_now = []
    i = 0
    while i < len(result):
        if result[i] == "现在" and i + 1 < len(result):
            result[i + 1] = "现在" + result[i + 1]
            i += 1
            continue
        fixed_now.append(result[i])
        i += 1
    result = fixed_now

    # 4.5 短块合并（<3 汉字 且非特殊独立词 且前条不是问句——问答分开）
    merged = []
    for chunk in result:
        prev_is_question = bool(merged) and merged[-1].rstrip("，。；：、").endswith("？")
        if (
            visual_len(chunk) < 3
            and not is_standalone(chunk)
            and not prev_is_question
            and "\x00" not in chunk  # 书名号/引号占位块不参与短块合并
        ):
            if merged:
                merged[-1] = merged[-1] + chunk
            else:
                merged.append(chunk)
        else:
            merged.append(chunk)

    return [restore(c).strip() for c in merged]

def is_standalone(chunk):
    c = chunk.rstrip("，。？！；：、")
    return any(c == s or c.startswith(s) for s in SPECIAL_STANDALONE)

def best_cut(content, use_weak=False):
    """找语义切点：强切点（不论长短）+ 可选弱切点（仅超长时）；两侧≥4；最近中间"""
    candidates = []
    # 书名号占位符前（《…》整体跟后句）
    for m in re.finditer("\x00", content):
        p = m.start()
        if p >= 4 and len(content) - p >= 2:
            candidates.append(p)
    covered_now = set()
    skip_now = set()
    # 「现在」整体（跳过 出现在/呈现/体现/展现）
    for m in re.finditer("现在", content):
        p = m.start()
        if p > 0 and content[p - 1] in "出呈体现展":
            skip_now.update(range(p, p + 1))  # 只跳「现」，保留「在」触发动词+在切点
            continue
        if p >= 4 and len(content) - p >= 4:
            candidates.append(p)
            covered_now.update(range(p, p + 2))
    # 词表（长词在前，re 交替）：强 + （超长时）弱
    words = list(CUT_WORDS_STRONG)
    if use_weak:
        words += CUT_WORDS_WEAK
    pattern = "|".join(re.escape(w) for w in words)
    for m in re.finditer(f"({pattern})", content):
        p = m.start()
        if p in covered_now or p in skip_now:
            continue
        w = m.group(1)
        if p >= 4 and len(content) - p >= 4:
            # 「贡献度」专名不切（贡献度评价体系）
            if w == "贡献":
                after_w = p + 2
                if after_w < len(content) and content[after_w] == "度":
                    continue
            # 「应用/使用/运用/利用/采用/选用」的「用」不切（词尾，非动词引导）
            if w == "用" and p > 0 and content[p - 1] in "应使运利采选":
                continue
            # 「动词+在」搭配（出现在/站在…）：切点移到「在」后
            if w == "在" and p > 0 and content[p - 1] in "出现站写放坐落停现":
                p2 = p + 1
                if len(content) - p2 >= 4:
                    candidates.append(p2)
                continue
            # 动词切其后（写进了/创造了/做到/叫 留前句，宾语跟后句）
            if w in CUT_VERB_AFTER:
                after = p + len(w)
                if after < len(content) and content[after] == "了":
                    after += 1
                if len(content) - after >= 4:
                    candidates.append(after)
                continue
            candidates.append(p)
    if not candidates:
        return None
    mid = len(content) // 2
    return min(candidates, key=lambda p: (abs(p - mid), -p))

def group_dunhao(content, protected):
    """顿号分组（并列项，视觉≤18/组）；组内汉字超 18 递归"""
    parts = content.split("、")
    groups = []
    cur = ""
    for p in parts:
        if cur and visual_len(cur + "、" + p) <= 18:
            cur += "、" + p
        else:
            if cur:
                groups.append(cur)
            cur = p
    if cur:
        groups.append(cur)
    out = []
    for g in groups:
        if han_count(g) > 18:
            out.extend(split_long(g, protected))
        else:
            out.append(g)
    return out

def split_long(content, protected):
    """语义切分：强切点（不论长短）→（超 18）弱切点/顿号/「的」/兜底；递归"""
    # 纯占位符块（书名号/引号整体）直接返回，允许超长（例外）
    if content and not any(ch != "\x00" and not ch.isdigit() for ch in content):
        return [content]
    han = effective_han(content, protected)
    # 1. 强语义切点（语义优先，无论长短）
    cut = best_cut(content, use_weak=False)
    if cut is not None:
        left, right = content[:cut], content[cut:]
        out = []
        for part in (left, right):
            if part:
                out.extend(split_long(part, protected))
        return out
    # 2. ≤18 且无强切点 → 单条
    if han <= 18:
        return [content]
    # 3. 超 18：弱切点 → 顿号分组 → 「的」→ 兜底
    cut = best_cut(content, use_weak=True)
    if cut is not None:
        left, right = content[:cut], content[cut:]
    elif "、" in content:
        return group_dunhao(content, protected)
    else:
        pos = [m.start() for m in re.finditer("的", content)]
        pos = [p for p in pos if p >= 4 and len(content) - p >= 4]
        if pos:
            mid = len(content) // 2
            best = min(pos, key=lambda p: (abs(p - mid), -p))
            left, right = content[:best], content[best:]
        else:
            mid = len(content) // 2
            best = None
            for d in range(len(content)):
                for cand in (mid - d, mid + d):
                    if 0 < cand < len(content):
                        prev_half = ord(content[cand - 1]) < 128
                        cur_half = ord(content[cand]) < 128
                        if not (prev_half and cur_half):
                            best = cand
                            break
                if best is not None:
                    break
            if best is None:
                best = mid
            left, right = content[:best], content[best:]

    # 递归
    out = []
    for part in (left, right):
        if part:
            out.extend(split_long(part, protected))
    return out

def fix_word_boundaries(chunks, protected):
    """修正：副词不留句尾、连接词不留在句首、问答分开"""
    fixed = []
    for i, c in enumerate(chunks):
        if c in SPECIAL_STANDALONE:
            # 特殊独立块（那现在/现在是/第一…）不参与副词移动
            fixed.append(c)
            continue
        # 副词留句尾 → 移给下一条
        for adv in TAIL_ADVERBS:
            if c.endswith(adv) and c != adv and i + 1 < len(chunks):
                # 「出现在/其次是/现在是…」里的「现在」不是副词「现在」
                if adv == "现在" and len(c) >= 3 and c[-3] in "出呈体现展是次":
                    continue
                # 把 adv 从本条末尾移到下条开头
                c = c[: -len(adv)]
                chunks[i + 1] = adv + chunks[i + 1]
        fixed.append(c)

    # 问答分开：问号结尾的块后若紧跟答案，不合并（标点切分已保证分开）
    # 连接词留在句首 → 移给上一条
    out = []
    for c in fixed:
        for hc in HEAD_CONNECTORS:
            if c.startswith(hc) and out:
                out[-1] = out[-1] + c
                c = None
                break
        if c:
            out.append(c)
    return out

# ---------- 6. 字幕时间定位 ----------
def generate_subtitles(chunks, phrases, script_text):
    """每条字幕在词级时间戳中定位起止"""
    # phrases 是文案词序列（已对齐时间）；把 chunks 映射到 phrases 的词范围
    entries = []
    search_pos = 0

    for chunk in chunks:
        chunk_clean = re.sub(r"[，。？！；：、\s]", "", chunk)
        found = False
        for start_idx in range(search_pos, len(phrases)):
            acc = ""
            for end_idx in range(start_idx, min(start_idx + 40, len(phrases))):
                acc += phrases[end_idx]["text"]
                acc_clean = re.sub(r"[，。？！；：、\s]", "", acc)
                if acc_clean == chunk_clean:
                    entries.append({
                        "text": chunk,
                        "start": phrases[start_idx]["start"],
                        "end": phrases[end_idx]["end"],
                        "startIdx": start_idx,
                    })
                    search_pos = end_idx + 1
                    found = True
                    break
            if found:
                break
        if not found:
            prev_end = entries[-1]["end"] if entries else 0.0
            entries.append({"text": chunk, "start": prev_end, "end": prev_end + 2.0, "startIdx": search_pos})

    return entries

# ---------- 主流程 ----------
if __name__ == "__main__":
    skip_transcribe = "--skip-transcribe" in sys.argv

    storyboard = read_storyboard(STORYBOARD)
    segments = storyboard["segments"]
    script_text = segment_full_text(segments)
    print(f"[1] storyboard: {len(segments)} 段, 全文 {len(script_text)} 字符")

    if skip_transcribe and OUT_TRANSCRIPT.exists():
        data = json.loads(OUT_TRANSCRIPT.read_text(encoding="utf-8"))
        whisper_words = data["whisper_words"]
        phrases = data["phrases"]
        print(f"[2] 复用转录: {len(whisper_words)} 词 / {len(phrases)} 对齐词")
    else:
        whisper_words = whisper_transcribe(AUDIO)
        phrases = align_to_script(whisper_words, script_text)
        OUT_TRANSCRIPT.write_text(
            json.dumps({"whisper_words": whisper_words, "phrases": phrases},
                       ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        print(f"    transcript.json 已保存 ({len(phrases)} 词)")

    print("[4] 字幕切分...")
    chunks = split_subtitles(script_text)
    print(f"    切分: {len(chunks)} 条")

    print("[6] 字幕时间定位...")
    entries = generate_subtitles(chunks, phrases, script_text)

    # 段归属：按字幕匹配到的词序号（startIdx）落在哪个段的词范围
    import jieba
    jieba.setLogLevel(0)
    script_words = list(jieba.cut(script_text))
    seg_word_bounds = []
    wid = 0
    for s in segments:
        n = len(list(jieba.cut(s["text"])))
        seg_word_bounds.append((s["id"], wid, wid + n))
        wid += n + 1  # +1 跳过段间换行 token（script_words 含 \n）

    for e in entries:
        si = e.get("startIdx", 0)
        e["segmentId"] = next(
            (sid for sid, a, b in seg_word_bounds if a <= si < b), segments[0]["id"]
        )
        e.pop("startIdx", None)

    subtitles = {
        "entries": [
            {"index": i + 1, "text": e["text"], "startSec": round(e["start"], 3),
             "endSec": round(e["end"], 3), "segmentId": e["segmentId"]}
            for i, e in enumerate(entries)
        ],
        "style": storyboard.get("meta", {}).get("subtitleStyle", {}),
    }
    OUT_SUBTITLES.write_text(
        json.dumps(subtitles, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"    subtitles.json 已保存 ({len(subtitles['entries'])} 条)")

    # 更新 storyboard.durationSec（真实时长 = 段内字幕时间跨度）
    from collections import defaultdict
    seg_times = defaultdict(list)
    for e in entries:
        seg_times[e["segmentId"]].append((e["start"], e["end"]))
    updated = 0
    for s in segments:
        t = seg_times.get(s["id"])
        if t:
            real = round(max(x[1] for x in t) - min(x[0] for x in t), 3)
            if abs(real - s.get("durationSec", 0)) > 0.2:
                print(f"    seg {s['id']}: durationSec {s.get('durationSec')} → {real}")
                s["durationSec"] = real
                updated += 1
    if updated:
        STORYBOARD.write_text(
            json.dumps(storyboard, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"    storyboard.durationSec 已更新 {updated} 段（真实转录时长）")

    print(f"\n完成！转录 {len(whisper_words)} 词 → 字幕 {len(subtitles['entries'])} 条")
    print(f"  {OUT_TRANSCRIPT}")
    print(f"  {OUT_SUBTITLES}")
