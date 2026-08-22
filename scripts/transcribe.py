"""automotion-v7 M5：转录 + 对齐 + 字幕切分

输入（项目侧，由 V7_PROJECT_DIR 指定）：full.wav + storyboard.json
输出（项目侧）：transcript.json / subtitles.json / storyboard.durationSec 更新
依赖：whisper / jieba / opencc
切分规则：docs/字幕切分规范-M5.md（v4，2026-08-11 定稿）

用法：python scripts/transcribe.py [--skip-transcribe]
  项目目录经环境变量 V7_PROJECT_DIR 指定（未设置时直接报错退出）
  --skip-transcribe：跳过 whisper 转录（复用已生成的 transcript.json，调试切分用）
"""
import json
import math
import os
import re
import sys
import wave
import warnings
from pathlib import Path

# jieba 0.42.1（PyPI 最新版）内部仍 import pkg_resources，触发 setuptools 废弃警告；
# 定向抑制该已知噪音，待 jieba 上游修复后移除
warnings.filterwarnings("ignore", message="pkg_resources is deprecated as an API")

_v7_project_dir = os.environ.get("V7_PROJECT_DIR")
if not _v7_project_dir:
    sys.exit("[FAIL] 未设置 V7_PROJECT_DIR 环境变量（指向项目目录，需含 full.wav / storyboard.json）")
PROJECT_DIR = Path(_v7_project_dir)
AUDIO = PROJECT_DIR / "full.wav"
STORYBOARD = PROJECT_DIR / "storyboard.json"
OUT_TRANSCRIPT = PROJECT_DIR / "transcript.json"
OUT_SUBTITLES = PROJECT_DIR / "subtitles.json"

# ---------- 1. 读取 ----------
def read_storyboard(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def validate_storyboard(sb):
    """转录前校验 storyboard 结构，返回错误列表（空 = 通过）。

    与 shared/types.ts 的 isStoryboard 保持同规则（Python 侧独立实现）。
    """
    errors = []
    meta = sb.get("meta") if isinstance(sb, dict) else None
    if not isinstance(meta, dict):
        errors.append("meta 缺失或不是对象")
    else:
        for k in ("title", "created"):
            if not isinstance(meta.get(k), str):
                errors.append(f"meta.{k} 缺失或不是字符串")
    segments = sb.get("segments") if isinstance(sb, dict) else None
    if not isinstance(segments, list):
        errors.append("segments 缺失或不是数组")
        return errors
    for i, s in enumerate(segments):
        tag = f"segments[{i}]"
        if not isinstance(s, dict):
            errors.append(f"{tag} 不是对象")
            continue
        for k in ("id", "text"):
            if not isinstance(s.get(k), str):
                errors.append(f"{tag}.{k} 缺失或不是字符串")
        keywords = s.get("keywords")
        if not isinstance(keywords, list) or not all(isinstance(w, str) for w in keywords):
            errors.append(f"{tag}.keywords 缺失或不是字符串数组")
        pr = s.get("phraseRange")
        if (
            not isinstance(pr, list)
            or len(pr) != 2
            or not all(
                isinstance(v, (int, float)) and not isinstance(v, bool) and math.isfinite(v)
                for v in pr
            )
        ):
            errors.append(f"{tag}.phraseRange 缺失或不是 [number, number]")
        ds = s.get("durationSec")
        if not isinstance(ds, (int, float)) or isinstance(ds, bool) or not math.isfinite(ds):
            errors.append(f"{tag}.durationSec 缺失或不是数字")
        if not isinstance(s.get("lensId"), str):
            errors.append(f"{tag}.lensId 缺失或不是字符串")
        if not isinstance(s.get("params"), dict):
            errors.append(f"{tag}.params 缺失或不是对象")
    return errors

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
        print("[!] opencc 未安装（需 pip install opencc-python-reimplemented），转录文本将不做繁→简转换")

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


def enforce_monotonic_timestamps(phrases):
    """词时间戳单调化：口语时间轴不可倒流。

    whisper 词级时间戳本身存在非单调（同一时间段被多词重复占用、倒挂），
    difflib 对齐错位还会把时间戳映射到错误词位；不清洗则字幕时间会出现
    重叠/倒挂。顺序扫描：每词 start 不得早于前词 end，end 不得早于 start；
    0 时长词给最小宽度 0.05s。清洗幂等（重复运行结果不变）。
    """
    prev_end = 0.0
    for p in phrases:
        st = max(p["start"], prev_end)
        en = max(p["end"], st)
        if en <= st:
            en = st + 0.05
        p["start"] = round(st, 3)
        p["end"] = round(en, 3)
        prev_end = en
    return phrases

# ---------- 4. 字幕切分（规范 v4） ----------
def clean_text(s):
    """去标点/空白，得到纯字符序列（对齐、定位、校验共用）"""
    return re.sub(r"[^\u4e00-\u9fffA-Za-z0-9]", "", s)


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

# ---------- 6. 段边界测量 + 段内字幕定位（机制：段是权威，字幕是段的展示） ----------
def measure_segment_bounds(segments, script_words):
    """在全文词序列中直接测量每段的词索引范围 [start, end)。

    原理：段 text 是全文的子串，按干净字符长度逐段消费全文词序列；
    不依赖"每段单独分词再累加"的估算（估算会受 jieba 分词上下文影响而漂移）。
    """
    bounds = []
    cur = 0
    n_words = len(script_words)
    for s in segments:
        target = len(clean_text(s["text"]))
        start = cur
        # 跳过段首空词（标点/换行等无干净字符的词）
        while start < n_words and not clean_text(script_words[start]):
            start += 1
        end = start
        acc = 0
        while end < n_words and acc < target:
            acc += len(clean_text(script_words[end]))
            end += 1
        if acc != target:
            raise ValueError(
                f"[FAIL] 段 {s['id']} 在全文词序列中消费 {acc} 字符，"
                f"预期 {target}，段边界测量失败")
        bounds.append((s["id"], start, end))
        cur = end
    return bounds


def generate_subtitles_per_segment(segments, phrases, bounds):
    """按段切分字幕，并把字幕作为"段字符轴上的区间"直接映射到词级时间戳。

    机制要点：
    1. 段边界直接测量（measure_segment_bounds），不做估算；
    2. 字幕在段内按字符区间顺序定位，跨段凑字在机制上不可能；
    3. 时间 = 覆盖字幕首字符的词 start → 覆盖末字符的词 end，
       彻底消除"字符级切分 vs 词级时间戳"的粒度错位
       （旧机制在词序列里"凑"字幕文本，词内切割永远凑不出）；
    4. 找不到就抛错，绝不产出"上一条结束 + 2 秒"之类的占位时间。
    """
    all_entries = []
    seg_by_id = {s["id"]: s for s in segments}
    for sid, w0, w1 in bounds:
        seg = seg_by_id[sid]
        chunks = split_subtitles(seg["text"])
        seg_phrases = phrases[w0:w1]
        # 词 i 在段 clean 字符轴上的范围 [cs[i], ce[i])
        cs = []
        ce = []
        starts = []
        ends = []
        acc = 0
        for p in seg_phrases:
            cs.append(acc)
            acc += len(clean_text(p["text"]))
            ce.append(acc)
            starts.append(p["start"])
            ends.append(p["end"])
        seg_clean = clean_text(seg["text"])
        if acc != len(seg_clean):
            raise ValueError(
                f"[FAIL] 段 {sid} 词序列 clean 长度 {acc} != 段文本 {len(seg_clean)}")
        total = acc

        # 0 时长词修正：结束时间取下一个有宽度词的开始（无则 +0.05s），
        # 否则单字/词内字幕会得到 start==end 的非法时间
        for i in range(len(starts)):
            if ends[i] <= starts[i]:
                nxt = next(
                    (starts[j] for j in range(i + 1, len(starts))
                     if ends[j] > starts[j]),
                    None,
                )
                ends[i] = nxt if nxt is not None else starts[i] + 0.05

        def char_time(cpos):
            """字符 cpos 的时间：定位所在词，词内按字符数线性插值。

            词级时间戳无法表达"词内某段字符"的时间；字幕边界落在词中间时，
            相邻字幕若都引用整词时间戳必然重叠。插值后字符轴上的任意区间
            都有明确定义的时间，且同一词内相邻字幕时间严格递增。
            cpos >= total（段末位置）时返回段内最后一个有宽度词的结束时间。
            """
            if cpos >= total:
                for i in range(len(cs) - 1, -1, -1):
                    if ce[i] > cs[i]:
                        return ends[i]
                return 0.0
            for i in range(len(cs)):
                if cs[i] <= cpos < ce[i]:
                    span = ce[i] - cs[i]
                    if span <= 1:
                        return starts[i]
                    ratio = (cpos - cs[i]) / span
                    return starts[i] + ratio * (ends[i] - starts[i])
            raise ValueError(f"[FAIL] 字符位置 {cpos} 超出段 {sid} 词范围")

        pos = 0
        for chunk in chunks:
            chunk_clean = clean_text(chunk)
            if not chunk_clean:
                continue
            c0 = seg_clean.find(chunk_clean, pos)
            if c0 < 0:
                raise ValueError(f"[FAIL] 段 {sid} 字幕定位失败：{chunk!r}")
            c1 = c0 + len(chunk_clean)
            all_entries.append({
                "text": chunk,
                "start": char_time(c0),
                "end": char_time(c1),
                "segmentId": sid,
            })
            pos = c1
    return all_entries


def validate_entries(entries, segments):
    """机制不变量校验：任何一条不满足立即报错，不产出错误数据。

    1. 每段字幕拼接（去标点）必须与段文案逐字一致；
    2. 每条字幕必须有真实且非零的时间跨度；
    3. 全片字幕时间单调不重叠。
    """
    from collections import defaultdict
    by_seg = defaultdict(list)
    for e in entries:
        if not (e["start"] < e["end"]):
            raise ValueError(f"[FAIL] 字幕时间非法（start>=end）：{e}")
        by_seg[e["segmentId"]].append(e)
    for s in segments:
        es = by_seg.get(s["id"], [])
        joined = clean_text("".join(e["text"] for e in es))
        expect = clean_text(s["text"])
        if joined != expect:
            raise ValueError(
                f"[FAIL] 段 {s['id']} 字幕未完整覆盖文案\n"
                f"  字幕拼接: {joined}\n"
                f"  段文案:   {expect}")
    prev_end = 0.0
    for e in sorted(entries, key=lambda x: x["start"]):
        if e["start"] < prev_end - 0.001:
            raise ValueError(f"[FAIL] 字幕时间重叠：{e}")
        prev_end = e["end"]
    return True

# ---------- 主流程 ----------
if __name__ == "__main__":
    skip_transcribe = "--skip-transcribe" in sys.argv

    # 音频实际时长（时间轴唯一基准；Composition 总时长依据）
    with wave.open(str(AUDIO), "rb") as w:
        audio_duration = w.getnframes() / w.getframerate()
    print(f"[0] 音频时长: {audio_duration:.3f}s")

    storyboard = read_storyboard(STORYBOARD)
    sb_errors = validate_storyboard(storyboard)
    if sb_errors:
        sys.exit("[FAIL] storyboard.json 校验失败：\n  " + "\n  ".join(sb_errors))
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
        print(f"    transcript.json 已保存 ({len(phrases)} 词)")

    phrases = enforce_monotonic_timestamps(phrases)
    OUT_TRANSCRIPT.write_text(
        json.dumps({"whisper_words": whisper_words, "phrases": phrases},
                   ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"    词时间戳单调化完成（transcript.json 已回写）")

    print("[4] 段边界测量 + 按段字幕切分/定位...")
    import jieba
    jieba.setLogLevel(0)
    script_words = list(jieba.cut(script_text))
    bounds = measure_segment_bounds(segments, script_words)
    entries = generate_subtitles_per_segment(segments, phrases, bounds)
    validate_entries(entries, segments)
    print(f"    字幕 {len(entries)} 条（按段定位，机制校验通过）")

    subtitles = {
        "entries": [
            {"index": i + 1, "text": e["text"], "startSec": round(e["start"], 3),
             "endSec": round(e["end"], 3), "segmentId": e["segmentId"]}
            for i, e in enumerate(entries)
        ],
        "style": storyboard.get("meta", {}).get("subtitleStyle", {}),
        "meta": {"audioDurationSec": round(audio_duration, 3)},
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
            start_sec = round(min(x[0] for x in t), 3)
            end_sec = round(max(x[1] for x in t), 3)
            real = round(end_sec - start_sec, 3)
            if (
                abs(real - s.get("durationSec", 0)) > 0.001
                or s.get("startSec") != start_sec
                or s.get("endSec") != end_sec
            ):
                print(
                    f"    seg {s['id']}: [{start_sec},{end_sec}] "
                    f"durationSec {s.get('durationSec')} → {real}"
                )
                s["durationSec"] = real
                s["startSec"] = start_sec
                s["endSec"] = end_sec
                updated += 1
    if updated:
        STORYBOARD.write_text(
            json.dumps(storyboard, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"    storyboard 段时间边界已更新 {updated} 段"
              f"（startSec/endSec/durationSec，绝对时间戳）")

    print(f"\n完成！转录 {len(whisper_words)} 词 → 字幕 {len(subtitles['entries'])} 条")
    print(f"  {OUT_TRANSCRIPT}")
    print(f"  {OUT_SUBTITLES}")
