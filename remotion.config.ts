import { Config } from "@remotion/cli/config";

// v7 预览入口统一走 3003 端口（Mineradio 占用 3000，勿改）
Config.setPort(3003);
Config.setOverwriteOutput(true);
