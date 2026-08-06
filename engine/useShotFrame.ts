/**
 * Remotion hook：组件内把 useCurrentFrame() 替换为 useShotFrame(time)。
 * 返回"原始时间轴坐标"，组件内部 interpolate 关键帧数组无需改动。
 */
import { useCurrentFrame, useVideoConfig } from "remotion";
import { buildShotMap } from "./time";
import type { ShotTime } from "./time";

export function useShotFrame(shotTime: ShotTime): number {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const { map, valid } = buildShotMap(shotTime, durationInFrames);
  if (!valid) {
    // 时长不足：回退原始坐标（由上层负责换镜头/提示）
    return frame;
  }
  return map(frame);
}
