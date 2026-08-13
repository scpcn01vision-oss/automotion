import { Config } from "@remotion/cli/config";

// v7 预览入口统一走 3003 端口（Mineradio 占用 3000，勿改）
Config.setPort(3003);
Config.setOverwriteOutput(true);

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
