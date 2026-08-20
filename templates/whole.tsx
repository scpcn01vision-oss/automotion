// 通用整片入口（任何项目复用同一份，无需按项目复制）
// 项目数据经 webpack alias `project-data` 指向 V7_PROJECT_DIR（见 remotion.config.ts）
import React from 'react';
import { Composition, registerRoot } from 'remotion';
import { WholeVideo } from '../lenses/WholeVideo';
import storyboard from 'project-data/storyboard.json';
import subtitles from 'project-data/subtitles.json';

// 项目录音（项目侧，不进仓库）——预览/导出时带声音
// 必须走 server 音频路由：浏览器无法加载本地绝对路径，只有 http 地址才能预览出声
const AUDIO_SRC = 'http://localhost:3004/api/audio/full.wav';

const props = { storyboard, subtitles, audioSrc: AUDIO_SRC };

// Composition 总时长 = 音频真实时长（音频是时间轴唯一基准），meta 缺失时兜底回段时长之和
const audioFrames = Math.round((subtitles?.meta?.audioDurationSec ?? 0) * 30);
const totalFrames = Math.max(
  1,
  audioFrames ||
    Math.round(props.storyboard.segments.reduce((a: number, s: any) => a + s.durationSec, 0) * 30),
);

export const RemotionRoot: React.FC = () => (
  <Composition
    id="Whole"
    component={WholeVideo}
    durationInFrames={totalFrames}
    fps={30}
    width={1920}
    height={1080}
    defaultProps={props as any}
  />
);

registerRoot(RemotionRoot);
