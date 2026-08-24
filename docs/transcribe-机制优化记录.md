# automotion 转录机制优化记录（transcribe.py）

> 日期：2026-08-20
> 范围：工具仓库 `~/.automotion/scripts/transcribe.py`（转录、对齐、字幕切分、段归属、时长回填）
> 背景项目：`E:\桌面\打破信息差\视频文件\015`（《AI视频教程翻车》，20 段，音频 312s）
> 性质：机制级修正（不是打补丁），目标是让"字幕段归属错位 / 占位时间戳 / 时间倒挂"这类错误在任何项目都不再静默出现。

---

## 1. 发现的问题（旧机制实测现象）

首次运行转录后，独立核对发现三类问题：

1. **段归属系统性偏移**：每段字幕都混入了下一段开头的第一句（20/20 段全部偏移）。例如 seg-01 名下混进了 seg-02 的"我不知道为什么"，seg-02 少了它、又混进 seg-03 的"每一个刚刚上手"。
2. **8 条占位字幕**：如"今天我就彻彻底底的""只有大量实战才能积累下""你是不是觉得你已经可"，定位失败后被塞了"上一条结束 + 2 秒"的估计时间。
3. **词时间戳倒挂/重叠**（深挖后暴露）：whisper 词级时间戳本身有 182 处非单调（同一时间段被多词重复占用、个别词整体错位近 2 秒）。

影响：`durationSec` 段边界不准 → 工作台左栏展示错位 → 镜头切换点与口播内容对不上。字幕文字与时间轴本身不受影响。

---

## 2. 旧机制（问题版）流程与四个缺陷

### 旧流程

```
whisper 词级转录（1398 词）
  → jieba 分词 + difflib 对齐成文案词序列 phrases（1202 词，带时间戳）
  → 字符级字幕切分 split_subtitles（全片一次切）
  → generate_subtitles：在 phrases 里"凑字"定位每条字幕，记录 startIdx
  → 段归属：按"逐段分词数累加 +1"估算的 seg_word_bounds 反推 startIdx 落在哪段
  → 段时长 = 段内字幕跨度
  → 无任何校验；定位失败塞 2 秒占位继续跑
```

### 缺陷 1：段边界靠"估算"而非"测量"

`seg_word_bounds` 用 `len(jieba.cut(段text))` 累加再 `+1` 跳过换行，假设"每段单独分词 == 全文分词"。这个假设不成立（jieba 分词受上下文影响），边界会漂移；且机制不校验。

### 缺陷 2：字幕定位允许"从任意词开始凑"

匹配规则是"从某个词往后累加，去掉标点空白后与字幕文本相等即命中"。它不要求起点是字幕真正的首字，于是可以从上一段结尾的叹号/换行开始凑出下一段开头的句子——**跨段匹配是机制允许的合法结果**，startIdx 落在上一段，字幕就归错段。

### 缺陷 3：字符级切分 vs 词级时间戳，粒度不一致

字幕切分是字符级（"做出来"切成"做出"+"来的"），而时间戳挂在 jieba 词上（"做"+"出来"）。从词序列里永远凑不出"做出"这个字符片段 → 定位失败 → 静默塞 2 秒占位。

### 缺陷 4：词时间戳本身非单调，且映射会错位

whisper `word_timestamps` 输出的词级时间存在大量重叠/倒挂；difflib 对齐在识别文本与文案不一致时会把时间戳映射到错误词位（实测 182 处倒挂）。字幕时间由词时间插值而来，源头不单调，下游必然出现 start≥end、重叠、倒挂。

### 缺陷 5：没有不变量校验

定位失败给占位时间、归属错了不检查、切分与文案不一致不报错——错误全部静默通过，直到人工验收才暴露。

---

## 3. 新机制（当前已落地）

核心思想：**段是权威，字幕是段的展示；时间轴必须单调；任何不一致立即报错。**

### 3.1 段边界直接测量（替代估算）

`measure_segment_bounds(segments, script_words)`：段 text 是全文的子串，按"干净字符长度"（去标点/空白）逐段消费全文词序列，直接得到每段的词索引范围 `[start, end)`。消费长度与段文本不一致即抛错。不再做"逐段分词再累加"。

### 3.2 字幕 = 段字符轴上的区间（替代词序列凑字）

`generate_subtitles_per_segment`：
- 每段独立调用 `split_subtitles` 切分（不再全片一次切，杜绝跨段合并）；
- 建立段内"词 → 干净字符区间"映射（词 i 覆盖 `[cs[i], ce[i])`，时间 `[start[i], end[i])`）；
- 字幕在段内按 `seg_clean.find(chunk_clean, pos)` 顺序定位，`pos` 单调推进；
- 找不到就抛错——**机制上没有占位分支**。

### 3.3 词内字符线性插值（解决词内切割）

词级时间戳无法表达"词内某段字符"的时间。`char_time(cpos)` 定位字符所在词，词内按字符数线性插值；字幕时间取**半开区间**：

```
start = char_time(c0)
end   = char_time(c1)   # c1 = 末字符位置 + 1，而非末字符本身
```

这样单字字幕（c0 == c1-1）也有 `end > start`，同一词内相邻字幕时间严格递增，不会重叠。

### 3.4 全局词时间戳单调化（对齐后、定位前）

`enforce_monotonic_timestamps(phrases)`：顺序扫描，每词

```
start = max(start, prev_end)
end   = max(end, start)
end   = start + 0.05  （若仍为 0 时长）
```

保证全轴单调非降、无零时长。清洗幂等（重复运行结果不变），并在 main 中无论是否 `--skip-transcribe` 都执行并回写 `transcript.json`。

### 3.5 硬校验（机制不变量）

`validate_entries(entries, segments)`，任一不满足立即抛错：

1. 每段字幕拼接（去标点）必须与段文案逐字一致；
2. 每条字幕 `start < end`；
3. 全片字幕按 start 排序后单调不重叠。

### 3.6 主流程接线

```python
script_words = list(jieba.cut(script_text))
bounds = measure_segment_bounds(segments, script_words)
entries = generate_subtitles_per_segment(segments, phrases, bounds)
validate_entries(entries, segments)
```

---

## 4. 验证结果（项目 015，独立核对）

| 检查项 | 结果 |
|---|---|
| 每段字幕与文案逐字一致（去标点） | 20/20 ✓（旧机制 20/20 偏移） |
| start ≥ end 非法时间 | 0 条 ✓ |
| 时间倒挂/重叠 | 0 条 ✓ |
| 占位字幕（2.0s 估计） | 0 条 ✓（旧机制 8 条） |
| 全片字幕覆盖 | 0.38s → 311.62s，音频 311.98s ✓ |
| 段时长合计 | 306.04s（段间停顿不计入，符合"段内字幕跨度"定义） |
| 幂等重跑 | 166 条字幕、20 段时长完全一致 ✓ |

旧机制下被错误归段的示例（修复前 → 修复后）：

```
seg-01 原 7 条：…垃圾教程！ + "我不知道为什么"（错）
seg-01 现 6 条：…垃圾教程！（正确）
seg-02 现首条："我不知道为什么"（正确）
```

---

## 5. 代码改动位置

- `~/.automotion/scripts/transcribe.py`
  - 新增 `clean_text()`
  - 新增 `measure_segment_bounds()`
  - 重写 `generate_subtitles_per_segment()`（替换旧 `generate_subtitles()`）
  - 新增 `enforce_monotonic_timestamps()`
  - 新增 `validate_entries()`
  - main：`[4]` 段接线改为"测量边界 → 按段定位 → 校验"；`[2]` 后统一单调化并回写
- 未改动：`split_subtitles` 及其切分规则（仅调用方式改为按段）

---

## 6. 遗留问题与建议（给 skill 优化对话）

1. **改动未提交**：`~/.automotion` 是 git 仓库，当前分支 `fix-toolchain`（跟踪 `origin/fix/toolchain-issues-1-5`）。以上改动是本地工作树修改，**尚未 commit/push**。建议审查后合入工具仓库（含 main）。
2. **whisper 词级时间戳误差仍在**：单调化是兜底（保证一致性），不是修正源数据。若追求更高时间精度，可评估 better-whisper / faster-whisper / 更大模型 / `condition_on_previous_text` 等；difflib 对齐可考虑换成基于时间近邻的词对齐，减少"时间戳映射错位"。
3. **0 时长词兜底**：`enforce_monotonic_timestamps` 把 0 时长词扩为 0.05s；若希望更贴近真实停顿，可考虑用下一个有宽度词的 start 作 end（当前实现更简单、幂等）。
4. **段时长定义**：`durationSec = 段内字幕跨度`，段间停顿不计入（总计时长会略小于音频），这是 SKILL.md 定义的行为，未改。
5. **校验是"报错即停"**：定位/校验失败会中断转录，符合"宁可失败也不产出错误数据"；使用体验上可能需要一个"失败明细输出"便于定位是哪段哪条。
6. **建议给 SKILL.md 补一句**：转录产物自带硬校验，任何项目跑完若打印"机制校验通过"即可信任段归属与时间轴。

---

## 7. 复现与独立校验

```powershell
$env:V7_PROJECT_DIR = "E:\桌面\打破信息差\视频文件\015"
python "$HOME\.automotion\scripts\transcribe.py" --skip-transcribe   # 复用转录，重跑切分/定位/校验
```

独立校验要点（不依赖脚本自证）：

```python
# 1) 每段：clean(段内字幕拼接) == clean(段 text)
# 2) 每条字幕 startSec < endSec
# 3) 全片按 startSec 排序后单调（允许微小间隙，不允许重叠）
# 4) 首条 start ≈ 音频起点，末条 end ≈ 音频终点
```

clean 定义：`re.sub(r"[^\u4e00-\u9fffA-Za-z0-9]", "", s)`

---

## 8. 补充发现：工作台 /api/match 404（2026-08-20 追加，待修复）

> 本节是后续运行工作台时新发现的问题，与转录机制无关，记录供 skill 优化对话一并处理。

### 现象

- 打开工作台 http://localhost:5173/ 白屏，控制台报：
  - `GET /api/match 404`
  - `TypeError: Cannot read properties of undefined (reading 'find')` at `App.tsx:60`
- 链路：`/api/match` 404 → 前端把错误对象当匹配数据 `setMatch(...)` → `match.segments` 为 undefined → `match?.segments.find(...)` 崩溃。

### 根因

`~/.automotion/server/src/index.ts` 中默认匹配文件路径写错：

```ts
const DEFAULT_MATCH = path.join(ROOT, 'out', `match-${PROJECT_NAME}.json`);
// ROOT = 工具仓库根目录 → 实际去找 ~/.automotion/out/match-015.json
```

而按 SKILL.md 规范（"项目数据只在项目侧流转，不进工具仓库、不进 git"），匹配结果应写入**项目目录**的 `out/match-<项目名>.json`（实际产物在 `E:\桌面\打破信息差\视频文件\015\out\match-015.json`）。

佐证设计不一致：
- 仓库 `.gitignore` 明确忽略 `out/` → 仓库 out/ 从设计上就不该放项目数据；
- 同文件里 `/api/storyboard` 读的是 `PROJECT_DIR/storyboard.json`（项目侧），唯独 match 默认读仓库侧。

### 建议修复方向

`MATCH_FILE` 环境变量未设置时，默认匹配文件改为读项目侧（与 storyboard 一致）：

```ts
const DEFAULT_MATCH = PROJECT_DIR
  ? path.join(PROJECT_DIR, 'out', `match-${PROJECT_NAME}.json`)
  : path.join(ROOT, 'out', `match-${PROJECT_NAME}.json`);
```

可选加固：前端 `fetch('/api/match')` 应对非 200 响应做校验（404 时提示"匹配结果不存在"而不是把它当 MatchResult），避免白屏。

### 状态

- **待修复**（仅记录，尚未改动 server 代码）。

---

## 10. 整片段边界与录音时间不对齐：机制改正（2026-08-22）

### 现象

整片预览中画面切换早于口播：seg-04 画面 39.04s 切到该段，但口播"你就去看吧"40.02s 才开口（早 ~1s）；偏差逐段累积，seg-19 早 5.38s、seg-20 早 5.58s。

### 根因（机制层面，非实现 bug）

数据模型混淆了"段的时长"与"段在时间轴上的位置"：

- SKILL 旧规则把 `durationSec` 定义为"段内字幕跨度"（首条开始 → 末条结束），**不含**段间停顿与片头前导静音；
- 整片又用 `startFrame = round(cumSec × 30)` **累计** durationSec 推算段位置。

口播时间轴上有停顿（实测段间 0.2s 为主，还有 0.46/0.7/0.84s 的长停顿；片头 0.38s 前导静音），累计定位把停顿全部丢弃，边界逐段提前。到 seg-04 累积 ~1s、片尾 ~5.6s。

### 机制改正（与"转录段边界测量代替估算"同一原则：时间轴位置只能来自测量，不能来自推算）

1. **数据模型**：storyboard 每段写入**绝对时间边界** `startSec`（段首条字幕开始）/ `endSec`（段末条字幕结束），`durationSec = endSec - startSec`；转录阶段一次性写入，作为事实供所有下游使用。
2. **整片定位**：`startFrame = round(seg.startSec × 30)`（第一段从 0 开始，覆盖片头前导静音）；**禁止用 durationSec 累计**，段间停顿自然保留为背景帧。
3. **类型**：`shared/types.ts` StoryboardSegment 增加 `startSec?`/`endSec?`。
4. **SKILL.md**：Step 2 写明绝对时间边界定义；Step 5 改为绝对定位并记录本次教训。

### 验证（项目 015）

- storyboard 20 段均写入绝对边界（seg-04 = [40.02, 51.54]，与录音一致）；
- 渲染对比：39.03s 帧旧机制是段 4、新机制仍是段 3（平均像素差 28.2）；40.17s 帧已是段 4 画面（与 39.03s 差 31.1）→ 切换点 39.04s → 40.02s，与口播对齐。

### 2026-08-23 追加：修复漂移导致问题重现（单一事实源教训）

**现象**：切换到 automotion-v7 仓库后，整片缺镜头问题原样重现（10 段空白），且渲染日志暴露"缺 startSec，回退累计定位"。

**根因 1（修复漂移）**：此前的全部机制修复（WholeVideo require.context、整片闸门、绝对时间戳、本机 Chrome）只存在于 `~/.automotion` 的**未提交工作树**，从未进 git/远程。automotion-v7 是同一远程分支的另一个 clone，pull 不到这些修复 → 缺镜头静默重现。

**根因 2（数据被旧脚本重建）**：automotion-v7 环境用旧版 transcribe.py 重新生成过 storyboard（带入新字段 featuresEvidence），但旧脚本没有 startSec/endSec 写入逻辑 → 绝对时间边界丢失，整片静默回退累计定位。

**机制改正**：
- 修复全部提交并 push 到共享远程 `fix/toolchain-issues-1-5`（commit b59f50e：WholeVideo/transcribe/types/remotion/闸门），保证任何 clone 拉取后防错机制一致——**修复必须进 git，禁止只留在本地工作树**；
- 闸门增加 startSec/endSec 缺失检查（commit a73f068），整片启动前发现缺绝对时间边界即报错，不再静默回退累计定位；
- 项目数据用已同步脚本重跑 `transcribe.py --skip-transcribe` 回填绝对时间边界（startSec 20/20）。

**验证**：重渲染 seg-03 段（frames 760-800）无缺失警告、无 startSec 警告；闸门 `[OK]`。

---

## 9. 整片合成缺镜头：skill 流程因果链与机制修复（2026-08-22）

### 现象

工作台 20/20 段全部定稿（预览正常、保存成功），但整片预览里 seg-03 等 10 段画面为空（只有背景色）。

### 直接原因

`lenses/WholeVideo.tsx` 的静态映射表 `LENS_MAP` 只登记了 29 个镜头（示例项目用过的子集），而本项目 storyboard 用到的 20 个镜头里有 10 个不在表内（LineCarryTransition / WordRelayFilmstrip / SpotlightHeroCard / TimelineTravel / BentoLightUp / ParticleSandFill / LineUnfoldPanel / VoiceWaveformLive / PaperPlaneMessenger / BrandInkOpen）。整片渲染时 `Comp = LENS_MAP[seg.lensId]` 为 undefined → 渲染 `null` → 空画面，**静默失败**。

### skill 流程的四个错误（缺一不可，串起来才导致黑屏）

1. **匹配不受"整片可用性"约束**：Step 3 按镜头定位库（123 个）选候选，但整片只支持 LENS_MAP（29 个）子集；两套数据源规模不同，skill 未定义"候选必须来自整片可用集"。
2. **工作台给出虚假成功信号**：工作台预览是动态加载（任意 registry 镜头都能预览/保存），与整片静态映射的"可用集"不同步；流程没有工作台↔整片的一致性校验，定稿成功 ≠ 整片能渲染。
3. **整片静默失败**：`Comp ? <Sequence> : null`，缺失镜头不报错不警告，只能靠人眼验收发现。
4. **SKILL.md 未写约束**：文档没有说明"整片合成只支持 LENS_MAP 子集"，执行方从文档学不到限制。

### 机制修复（目标：下次一次跑通）

1. **单一事实源**：`LENS_MAP` 覆盖 registry 镜头全集（生成/同步，不再手维护子集），让"匹配可用集 = 整片可用集 = 镜头库"。
2. **流程闸门**：Step 4 → Step 5 前跑校验脚本，storyboard 所有 lensId 必须在整片映射内，缺失即报错停住。
3. **消除静默**：整片遇到缺失镜头时显示醒目占位 + console.error，不再渲染空背景。
4. **SKILL.md 写入约束**：匹配候选必须来自整片可用集；进整片前必须过校验。

### 落地状态

- 2026-08-22：文档记录 + 代码修复，验证通过：
  - `lenses/WholeVideo.tsx` 已重构：删除手写 `LENS_MAP`，改为 `require.context` 按 registry.file 动态解析镜头组件；镜头不在 registry 或组件导出缺失直接 throw，不再静默黑屏（渲染面 = 镜头库全集，单一事实源达成）。
  - `remotion.config.ts`：渲染浏览器改为优先本机 Chrome（`CHROME_PATH` 可覆盖），首次渲染不再从 Google storage 下载 headless shell。
  - 新增 `scripts/check-whole-lenses.py`：Step 4 → Step 5 闸门，校验 storyboard 所有 lensId 都在 registry，缺一即停（流程闸门达成）。
  - `SKILL.md`：写入"候选来自 registry 全集"约束 + 闸门步骤 + 渲染浏览器说明。
  - 验证：整片前 40s（1200 帧）渲染成功、无错误；抽查 seg-01/03/04 三帧均非空画面（抽样唯一颜色 61-110 种）；闸门脚本对当前项目输出 `[OK]`。

---

## 11. 口播锚点机制失效：流程时序错位 + "口播对齐流程"缺失（2026-08-23）

> 性质：机制级诊断记录。本文只记录根因与修正方向，**未改任何代码**；待用户确认后再按"改机制不补丁 + commit/push 到 fix/toolchain-issues-1-5"执行。

### 现象

- 015 整片预览普遍出现"画面内容出现的时刻 vs 口播说到对应字词的时刻"对不上（seg-01/seg-02 等尤甚）。
- 根因不是单个镜头写错，而是整套"口播锚点"（cueSec/revealAtSec）机制未在任何环节实际落地。

### 数据层面的暴露

- storyboard 全部 20 段 params 均无 `cueSec`/`revealAtSec`（仅 seg-10 含无关的 `exitAt`）。
- 镜头设计时长多为 6s（registry `durationInFrames=180`），实际段长 5.5~27.5s；**18 段被弹刚等比拉伸 1.9~4.6 倍**（seg-07 0.92× / seg-20 1.04× 例外）。
- 无锚点时组件走 `useShotFrame(SHOT_TIME)` 弹刚缩放，动效关键帧随段长整体缩放，与口播词错位。

### 真正的根因（机制设计层面，非执行疏漏）

1. **锚点被放在"定稿前"的填参阶段**：`M4 §3.5` 写"填参时……写入 params"；而填参是 Skill Step 3.5（工作台定稿前、镜头仅 Top1 建议）。此时镜头未定、内容项↔口播词对应未定，锚点语义前提不成立。
2. **"internal"只是工作台的"隐藏输入框"，本身不产生数据**：`client/src/components/ParamForm.tsx` L10-12 `shouldShow()` 内 `if (f.internal) return false`（internal 字段不作为用户可调参数，工作台不渲染输入框）。设计本意是"锚点由技能自动生成、非用户手输"（registry `WordRelayFilmstrip.cueSec` 注释即如此）。但该标记**只隐藏了输入框，不生成锚点数据**；且 registry 目前**仅 `WordRelayFilmstrip.cueSec` 标了 internal**，其余几十个镜头的 `cueSec/revealAtSec` 均未标 → 工作台对大多数镜头仍显示锚点字段、可手动输入，"靠机制自动生成"并未实现。
3. **设计者预期的"口播对齐流程"未实现、未挂进主流程**：`scripts/` 只有 `query-cues.py`（手动查单个词），无自动生成/填充锚点脚本；SKILL.md 主流程无"口播对齐"步骤；无"缺锚点即报错"闸门。
4. **锚点"两头落空"**：定稿前做不了（镜头未定），定稿后没人做（无流程承接 / 无工具 / 无闸门），机制整体悬空。
5. **附加不一致**：registry 仅 `WordRelayFilmstrip.cueSec` 标了 `internal`，其余几十个镜头的 `cueSec/revealAtSec` 未标 internal → 锚点机制被零散嵌入，未作为统一机制贯彻。

### 修正方向（讨论稿，未落代码）

- **时序**：口播锚点归为"定稿后"行为。新增 Skill 一步：**Step 4 工作台定稿 → 自动生成锚点 → 进 Step 5 前加闸门校验**（registry 声明应对齐的镜头必须已带锚点，缺则报错）。
- **工具**：把 `query-cues.py` 升级为按"镜头声明的 内容项↔文案 映射"批量生成锚点；段起点用**绝对 `startSec`**（与整片一致，消除 `durationSec` 累计基准差——与第 10 节同一原则）。
- **声明**：registry/组件声明 `align: 'cue' | 'event' | 'none'` + 内容项↔字段映射，让"该镜头是否必须对齐"机器可读。
- **用户目标（已确认）**：**所有锚点字段（全部 `cueSec`/`revealAtSec`）一律标 `internal`**——工作台全部隐藏、彻底禁止手动输入，锚点统一改由机制自动生成；`internal` 标记应覆盖全部锚点字段而非仅 WordRelayFilmstrip。
- **组件兜底**：声明了对齐但缺锚点时 Dev 下 `console.warn`，与闸门形成双保险。

### 一个诚实的边界

"哪些镜头必须对齐、没做就报错"是纯规则、可机器化、守得住下限；但"某个内容项到底对应文案哪一句"涉及语义判断，难以 100% 自动化（可保留 AI 填参、但须在闸门监督下）。机制改进的目标不是彻底无人，而是把"必须做且没做=报错"变成强约束。

### 状态

- 仅记录，未改任何代码；待用户确认修正方向后执行。
