# 镜头场景总表（草稿 v1）

> 用途：镜头场景定位的权威来源，解析进 registry 的 scenes/usage 字段。
> 职责：场景标签 = 系统侧维护（文件头「功能」注释自动提取 + 缺漏由系统补）；使用场景描述 = 你填写。
> 生成：2026-08-07；标签自动提取，使用场景描述人工填写。
> 规则：场景标签是排序信号（不做排除）；每个镜头可标 1-3 个标签。
> 「使用场景描述」：这个镜头适合用在什么内容的段落上（匹配段的参考），如「适合宣布重要结论」「适合展示增长数据」；画面描述只讲画面在做什么。

## 标签参考（现有词频）：展开49 宣告40 举证25 钩子19 承接13 转折11 收束5 对比5 全景3 强调2 节奏1 序列1

## data（3）

| id | 中文名 | 场景标签 | 使用场景描述 |
|---|---|---|---|
| OscilloscopeStream | 示波流 | 举证 | 展现数据随时间变化的图形（资金/指标随时间波动），适合有数字的时间序列 |
| UnitDotSwarmRegroup | 点阵重组 | 举证 | 仅适合数字/统计强关联内容：几组数量的点阵对比（如比例、占比、数量差） |
| AxisRescaleShock | 轴缩冲击 | 举证 | 描述一个量的持续变化的，有数字进行匹配更好 |

## effects（3）

| id | 中文名 | 场景标签 | 使用场景描述 |
|---|---|---|---|
| GlowOrbAmbient | 辉光漫游 | 强调 | 强调一件事情，辉光背景 |
| LineUnfoldPanel | 线展成板 | 强调 | 强调一件事情，纸墨背景 |
| ReticleLockOn | 准星锁定 | 强调 | 强调一件事情的部分内容 |

## interaction（1）

| id | 中文名 | 场景标签 | 使用场景描述 |
|---|---|---|---|
| VoiceWaveformLive | 声纹起伏 | 展开 | 表达语音输入的内容 |

## light（21）

| id | 中文名 | 场景标签 | 使用场景描述 |
|---|---|---|---|
| CardFlipReveal | 翻牌揭结 | 展开 | 展示或对比多个参数，有悬疑的揭示 |
| CardFlockTumble | 卡群翻飞 | 钩子,宣告 | 展示多个事情或参数或事情，绚丽背景 |
| AxialStretch | 轴向拉伸 | 展开 | 展示或对比多个参数或事情 |
| ContactShadowLift | 阴影抬升 | 展开 | 展示或对比多个参数或事情 |
| MorphFromPrimitive | 原形化卡 | 钩子,展开 | 展示单个参数或事情 |
| ImpactBurstKit | 冲击迸发 | 钩子,宣告 | 着重展示多个参数中的其中一个 |
| KanadaPerspectiveSnap | 透视瞬折 | 钩子,宣告 | 展示单个参数或事情 |
| TextAsMask | 字底藏印 | 钩子,宣告 | 展示或演示一个事物的详情或原理 |
| TextColumnConverge | 双词咬合 | 宣告 | 品牌或标题式宣告（两个词咬合成主旨），不适合概念对比或论据阐述 |
| TitleDemoteToLabel | 题降为签 | 宣告,承接 | 对一个或多个事情的详情进行陈列展示 |
| LetterformDriftAssembly | 字母漂移 | 宣告,展开 | 标题展示 |
| SplitTextStagger | 分段错开 | 宣告,展开 | 标题展示 |
| TextOnPath | 沿径排字 | 宣告,展开 | 标题展示 |
| TrackingExpandReveal | 字距舒展 | 宣告,展开 | 标题展示 |
| LetterDropPhysics | 字母坠落 | 钩子,宣告 | 标题展示 |
| ScrambleDecode | 乱码归位 | 钩子,宣告 | 仅适合英文/数字内容（乱码字符集为字母与数字）；不适合中文标题或段落 |
| UiStripAwayOutro | 逐层剥离 | 收束 | 对于事情或工作的最后总结处理 |
| IconFlipBloomLogo | 图标绽放 | 收束 | 标题展示 |
| InputMorphsIntoLogo | 输入化标 | 收束 | 标题展示 |
| WordRelayFilmstrip | 胶片传词 | 展开,序列 | 多功能或事情展示 |

## medium（36）

| id | 中文名 | 场景标签 | 使用场景描述 |
|---|---|---|---|
| StreamResponse | 流式应答 | 展开,举证 | 一个主题的多个分点的展示 |
| AutolayoutGapDial | 间距旋钮 | 展开 | 仅适合 UI 布局/间距调整的画面，不适合文字含义或抽象概念 |
| BeforeAfterSliderScrub | 前后推杆 | 对比,举证 | 视觉上的前后对比专用（如修图前后、界面改造前后），动态分栏拉杆 |
| BubbleSwarmTakeover | 气泡吞幕 | 承接,转折, 对比 | 两事物对比，气泡分栏 |
| DiagramCascadeBuild | 图表级建 | 展开 | 一个主题的分支展示 |
| PanelToCanvasMaterialize | 面板化板 | 展开 | 多任务展示 |
| CursorCastEnsemble | 光标合奏 | 展开 | 协同合作 |
| CursorDialogueDuet | 光标对谈 | 展开 | 两方协同合作 |
| CommandPaletteSummon | 命令唤出 | 展开 | 精确搜索 |
| NeedleSweepSelftest | 指针自检 | 举证 | 多指标展示，仪表 |
| TapeScrollFixedPointer | 刻度奔袭 | 举证 | 仅适合有统计意义的单指标刻度展示（如价格、数量、比例）；不适合文字含义或抽象概念 |
| GradientWordSweep | 光扫词面 | 宣告 | 仅适合单个短词的扫光强调（如单句口号）；不适合长句、结论或段落级内容 |
| HashtagToPillMaterialize | 标签化签 | 展开 | 关键词解释 |
| IconFieldColorize | 图标点亮 | 展开 | 图标墙 |
| AttentionBounce | 注目弹跳 | 宣告 | 消息提醒 |
| PopBurstConfirm | 爆点确认 | 宣告 | 任务完成 |
| CursorPerformancePunchIn | 光标冲入 | 展开 | 事情或任务确认 |
| HalationBloom | 光晕弥散 | 宣告,举证 | 倍数宣告 |
| SheenSweepRetry | 光泽扫过 | 宣告,举证 | 单个事物的强调 |
| OdometerDigitRoll | 里程滚数 | 举证,宣告 | 参数滚动 |
| FlipGridReflow | 格阵重排 | 展开 | 卡片排列 |
| ConfettiCrossfire | 彩纸交叉 | 钩子,收束 | 节点完成庆祝 |
| CounterTickSparks | 计数星火 | 钩子,收束 | 节点达成庆祝 |
| ParticleSandFill | 沙粒填形 | 举证 | 多个数字用图形（沙粒填柱）展现，仅适合有具体数值的数据 |
| PillSlotCycle | 胶囊旋转 | 展开 | 多功能展示 |
| BrakeReticleLock | 急停准星 | 展开 | 多项目选中一个项目 |
| ChangelogScrollBrake | 长页急停 | 展开 | 多项目选中一个项目 |
| SegmentedThumbHero | 分段切换 | 举证 | 双模式切换 |
| SkeletonReveal | 骨架填充 | 展开 | 列表陈列 |
| CornerSpotlightReveal | 角落追光 | 展开,承接 | 一个事物的揭露 |
| GlowWakeSleepPanel | 光眠醒板 | 展开,承接 | 一个事物的揭露、展示 |
| SlideSpotlightPan | 滑光扫视 | 展开,承接 | 一个事物的揭露、展示 |
| TimelineTravel | 时间轴行 | 展开,举证 | 表达事物的发展和演进的时间线 |
| KaraokeFillSync | 歌词填充 | 宣告,举证 | 歌词 |
| BentoLightUp | 方块点亮 | 钩子,展开 | 多个事物先后提及或展示 |
| GridWaveFlip | 格浪翻涌 | 钩子,展开 | 多个事物先后提及或展示 |

## minimal（26）

| id | 中文名 | 场景标签 | 使用场景描述 |
|---|---|---|---|
| BeatCutAccelerando | 节拍加速切 | 钩子,宣告 | 单一事物局部的展示或强调 |
| BeatStepListThemeCycle | 拍点列词 | 宣告,节奏 | 多个关键词/形容词的连打轮换（多主题、多气质体量展示，节奏密集） |
| BottomPushStackWipe | 底推换景 | 转折 | 多个事物按顺序逐一展现/换景（一页推一页） |
| CircleMatchIris | 圆心虹膜 | 举证 | 多个事物中对其中一个事物的具体展示 |
| CraneRiseReveal | 吊臂升起 | 展开 | 多个事物先后提及或展示 |
| DollyZoomReal | 滑动变焦 | 举证 | 多个事物中对其中一个事物的具体展示 |
| MultiplaneReal | 多层视差 | 展开,举证 | 多个事物先后提及或展示 |
| GrazeFaceTour | 掠面巡览 | 展开 | UI展示 |
| LineCarryTransition | 线引换场 | 承接 | 多个事物的阶段性演进 |
| DominoCascade | 多米诺 | 展开,举证 | UI展示 |
| TiltReveal | 倾斜揭面 | 钩子,展开 | 单一事物的展示或强调 |
| RunwayGroundSkim | 低空掠卡 | 展开 | UI展示 |
| SmearMultiples | 残影多联 | 展开, 对比 | 单一事物在两个阶段的变化对比 |
| DroneDiveLanding | 俯冲降落 | 展开 | 从高空俯冲到单一事物的展示/强调（空间运动感，聚焦落地） |
| ExplodedView | 爆炸分解 | 展开 | UI展示 |
| FreezeAnnotateReal | 冻结标注 | 举证,宣告 | 多个事物中对其中一个事物的具体展示 |
| SpeedRampReal | 变速急停 | 举证,宣告 | 多个事物中对其中一个事物的具体展示 |
| BulletTimeFreezeOrbit | 子弹时间 | 宣告,举证 | 柱状图及说明 |
| DutchRollToLevel | 荷兰角回正 | 宣告,举证 | 问题被解决的声明（痛点斜置 → 滚正解决）；不能用作两个阶段/前后对比 |
| PullBackIsolation | 拉远孤立 | 宣告,举证 | 对事物系统性的进度说明 |
| InvisibleCut | 隐形切 | 转折, 对比 | 单一事物在两个阶段的变化对比 |
| LightLeakBurn | 漏光烧灼 | 转折, 对比 | 单一事物在两个阶段的变化对比 |
| VersusSlam | 对决砸幕 | 转折, 对比 | 两个事物的对比 |
| BlindsSlice | 百叶横切 | 转折,承接, 对比 | 单一事物在两个阶段的变化对比 |
| ClockWipe | 时钟扫过 | 转折,承接, 对比 | 单一事物在两个阶段的变化对比 |

## native（17）

| id | 中文名 | 场景标签 | 使用场景描述 |
|---|---|---|---|
| BrandFrameSnap | 品牌框定 | 宣告,承接 | 模式切换 |
| DrawSvgTrace | 墨线描边 | 钩子,宣告 | 单一事物的展示或强调 |
| RedHeadFileQuote | 红头引文 | 举证 | 引用官方文件/政策原文（红头文件样式） |
| LetterspaceMaterialize | 字距显形 | 钩子,宣告 | 品牌展示 |
| LineBoil | 墨线沸腾 | 展开 | 单一事物的展示或强调 |
| MarkerUnderlineTitle | 笔锋划题 | 宣告 | 对一句话中关键词的强调或对一句包含关键词的话的强调 |
| BarnDoorSplit | 谷仓门裂 | 转折,承接, 对比 | 单一事物在两个阶段的变化对比 |
| PageWaterfallWall | 页墙瀑布 | 全景 | 多个事物的展示 |
| VerticalTickerWrapper | 滚动字幕 | 全景 | 多个事物的展示 |
| MaskingTapeSlap | 胶带落纸 | 展开,宣告 | 单一事物的展示或强调 |
| PopupBookRise | 立体书起 | 展开,宣告 | 多个事物的展示 |
| PaperPlaneMessenger | 纸鸢传信 | 承接,转折 | 一个进度推进到下一个进度 |
| InkBleedReveal | 墨渗揭幕 | 转折,承接 | 单一事物的展示或强调 |
| RisoMisregistrationHit | 套印错击 | 宣告,举证 | 用于强调单个字词 |
| SplitFlapFlip | 翻牌显字 | 钩子,宣告 | 一串数字或字母的展示 |
| StrokeSegmentBuild | 断笔成字 | 钩子,宣告 | 用于强调单个字词 |
| TerminalTypewriter | 终端打字 | 展开 | 用代码去执行某个事物 |
| TypewriterErrorRetype | 错误重打 | 展开 | 对于观点的修改 |

## opening（3）

| id | 中文名 | 场景标签 | 使用场景描述 |
|---|---|---|---|
| MagicianCardFlourish | 魔术卡弹 | 钩子,宣告 | 单一事物的展示或强调 |
| PaperTitleCard | 纸墨字卡 | 宣告 | 品牌或文字展示、强调 |
| DatavizLandscapeOpen | 数据景观 | 举证 | 时间线收束或进程的推进 |

## rhythm（2）

| id | 中文名 | 场景标签 | 使用场景描述 |
|---|---|---|---|
| SakugaTimingShift | 作画变速 | 节奏 | BGM节奏适配 |
| SpectrumMorphUi | 频谱标线 | 宣告 | 和音频相关的展示 |

## tplshots（7）

| id | 中文名 | 场景标签 | 使用场景描述 |
|---|---|---|---|
| BrandInkOpen | 墨印开场 | 钩子 | 品牌或IP展示 |
| SpotlightHeroCard | 追光主卡 | 举证 | 多个事物中对其中一个事物的具体展示 |
| RowEmbed | 行嵌入 | 展开 | 对于一个事物中包含内容的展示 |
| ListStackPress | 列表压叠 | 展开 | 对于一个事物中包含内容的展示 |
| DocumentTypewriterReveal | 文档打字 | 展开 | 对于一个事物中包含内容的展示 |
| OutroGroupPhotoLaunch | 群像收尾 | 收束 | 品牌或IP展示，带分支内容的 |

## transition（1）

| id | 中文名 | 场景标签 | 使用场景描述 |
|---|---|---|---|
| GlitchDisplace | 撕裂位移 | 转折 | 一个进度推进到下一个进度 |

## typography（1）

| id | 中文名 | 场景标签 | 使用场景描述 |
|---|---|---|---|
| CelFlashStomp | 大字跺拍 | 宣告 | 有节拍的主旨宣告 |

## ui-entrance（3）

| id | 中文名 | 场景标签 | 使用场景描述 |
|---|---|---|---|
| NeonFrameForerun | 霓虹框跑 | 展开 | UI展示 |
| NeonFrameForerunOrbit | 霓虹环绕 | 展开 | UI展示 |
| IntegrationHubMap | 集成枢纽 | 举证,展开 | 表现多协同的系统或事物 |
