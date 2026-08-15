# automotion-v7

通用的口播视频成片自动化工具链：输入「文案 + 录音」，自动完成
**转录分段 → 镜头匹配 → 工作台定稿 → 整片合成导出**，输出
1920×1080@30 的 mp4（带字幕与口播、无 BGM）。

## 功能特性

- 122 个纸墨风镜头（参数化、G 色板统一），全部具备明确时间策略（弹刚 ShotTime / 口播锚点 / 固定帧）
- 口播对齐：逐项 `cueSec` / 单事件 `revealAtSec`，画面事件对齐口播词级时间
- 工作台：三栏浏览器 UI（段列表 / 镜头预览+参数表单 / Top5 推荐+镜头库），保存式交互
- 整片合成：音频真实时长唯一基准，逐段精确帧边界，带响度自检

## 环境要求

- Node.js（npm workspaces）
- Python 3.11+（转录：`whisper`、`jieba`、`opencc`）
- ffmpeg（响度检测/成片检查）

## 安装

```bash
npm install
pip install whisper jieba opencc
```

## 启动

项目侧准备数据目录（录音 `full.wav`、`storyboard.json`、段画像），记作 `V7_PROJECT_DIR`：

```powershell
$env:V7_PROJECT_DIR = "E:\路径\到\项目目录"
```

工作台（浏览器 5173）：

```bash
npm run dev
```

整片预览（工作台 5173 + Remotion Studio 3003）：

```bash
npm run dev:whole
```

转录（whisper 词级转录 → 对齐 → 字幕切分 → 段真实时长）：

```bash
python scripts/transcribe.py            # 已有 transcript.json 时加 --skip-transcribe
```

导出：

```bash
npx remotion render out/whole-<项目>.tsx <CompositionId> out/whole.mp4 --port=3005
```

完整流程说明见 `docs/` 与 skill 封装（`automotion-v7` skill）。

## 架构

| 目录 | 职责 |
|---|---|
| `lenses/` | 122 个镜头组件 + 整片合成（WholeVideo）+ 系统样式（色板/字体） |
| `engine/` | 时间轴引擎（ShotTime 刚弹映射 + useShotFrame） |
| `client/` | 工作台浏览器 UI（React + Vite + Remotion Player） |
| `server/` | 工作台数据 API + 音频路由（Express） |
| `scripts/` | 转录（transcribe.py）、registry 生成、校验、口播查询（query-cues.py） |
| `shared/` | 数据模型 / 类型 / 字幕样式默认值 |
| `docs/` | 设计规范、交接文档、匹配机制、字幕切分规范等 |

## 来源与许可

本项目基于 [video-shotcraft](https://github.com/Vincentwei1021/video-shotcraft)
（Copyright 2026 Wei Yihao）的镜头源码衍生改造，遵循 Apache License 2.0；
修改说明与第三方素材来源见 [NOTICE](NOTICE)。

本项目使用 Apache License 2.0，见 [LICENSE](LICENSE)。
