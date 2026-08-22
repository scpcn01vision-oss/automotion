import { Config } from "@remotion/cli/config";
import fs from "node:fs";

// v7 预览入口统一走 3003 端口（Mineradio 占用 3000，勿改）
Config.setPort(3003);
Config.setOverwriteOutput(true);

// 渲染浏览器：优先本机 Chrome，避免首次渲染从 Google storage 下载
// headless shell（网络不可达时下载会无限卡住，且每次版本更新还要重下）。
// 可用环境变量 CHROME_PATH 覆盖。
const LOCAL_CHROME =
  process.env.CHROME_PATH ||
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
if (fs.existsSync(LOCAL_CHROME)) {
  Config.setBrowserExecutable(LOCAL_CHROME);
} else {
  console.warn(`[remotion] 未找到本机 Chrome（${LOCAL_CHROME}），将回退到 headless shell 下载`);
}

// 项目侧数据 alias：整片预览/导出直接消费项目侧 storyboard/subtitles（一套文件，无快照）
// 用 V7_PROJECT_DIR 环境变量指定（与工作台 dev 启动同一变量）；文件变化触发 Studio 热更新
Config.overrideWebpackConfig((config) => {
  const projectDir = process.env.V7_PROJECT_DIR;
  const alias = config.resolve?.alias as Record<string, string> | undefined;
  if (projectDir && alias) {
    alias["project-data"] = projectDir;
  }
  return config;
});
