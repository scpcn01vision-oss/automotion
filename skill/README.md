# automotion skill（Codex 用法包装）

本目录是 automotion 工具链的 **Codex skill 用法包装**（对外层），与工具库本体同仓分发。

- `SKILL.md`：skill 主文件（用法说明，触发即读）。
- `scripts/setup-toolchain.ps1`：标准入口——自动拉 `fix/toolchain-issues-1-5` 到 `~/.automotion`（可用 `V7_TOOL_DIR` 覆盖）、`npm install` + `pip install` + 自检（`lenses/`、`shared/registry.json`、`scripts/generate_cues.py`、`templates/whole.tsx`、npm/pip 在位）。
- `references/`：设计规范（参数化 / 工作台 / 时间策略 / 匹配 / 合成 / 字幕 / 自动填参）。

**用途**：作为 skill 分发由此目录生成；本机安装实例在 `~/.codex/skills/automotion/`。工具库本体即本仓库根（lenses / engine / scripts / shared 等）。
