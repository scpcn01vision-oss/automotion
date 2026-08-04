/**
 * 时间轴引擎：刚性锚点 + 弹性拉伸。
 * 纯函数，无 Remotion 依赖，可独立测试。
 */

export interface ShotTimeSegment {
  from: number;
  to: number;
  mode: "rigid" | "elastic";
  minFrames?: number;
}

export interface ShotTime {
  segments: ShotTimeSegment[];
  minFrames: number;
}

export function buildShotMap(shotTime: ShotTime, duration: number): {
  map: (frame: number) => number;
  valid: boolean;
  error?: string;
} {
  const segs = [...shotTime.segments].sort((a, b) => a.from - b.from);
  if (segs.length === 0) {
    return { map: (f) => f, valid: true };
  }

  const rigidTotal = segs
    .filter((s) => s.mode === "rigid")
    .reduce((acc, s) => acc + (s.to - s.from), 0);
  const elastics = segs.filter((s) => s.mode === "elastic");
  const minTotal = elastics.reduce((acc, s) => acc + (s.minFrames ?? 8), 0);

  const minDuration = rigidTotal + minTotal;
  if (duration < minDuration) {
    return {
      map: () => 0,
      valid: false,
      error: `时长不足：该镜头至少需要 ${minDuration} 帧（刚性 ${rigidTotal} + 弹性下限 ${minTotal}），当前 ${duration} 帧`,
    };
  }

  const elasticBudget = duration - rigidTotal;
  const base = elastics.map((s) => s.minFrames ?? 8);
  const baseSum = base.reduce((a, b) => a + b, 0);
  const extraTotal = Math.max(0, elasticBudget - baseSum);
  const weightSum = elastics.reduce(
    (acc, s, i) => acc + Math.max(0, s.to - s.from - base[i]),
    0
  );

  let ei = 0;
  const tgtLens = segs.map((s) => {
    if (s.mode === "rigid") return s.to - s.from;
    const weight = Math.max(0, s.to - s.from - base[ei]);
    const len = base[ei] + (weightSum > 0 ? (weight / weightSum) * extraTotal : 0);
    ei++;
    return len;
  });

  const spans: { origStart: number; origEnd: number; tgtStart: number; tgtEnd: number }[] = [];
  let tgtCursor = 0;
  segs.forEach((s, i) => {
    spans.push({
      origStart: s.from,
      origEnd: s.to,
      tgtStart: tgtCursor,
      tgtEnd: tgtCursor + tgtLens[i],
    });
    tgtCursor += tgtLens[i];
  });

  const last = spans[spans.length - 1];
  const map = (frame: number): number => {
    if (frame < 0) return spans[0]?.origStart ?? 0;
    for (const sp of spans) {
      if (frame >= sp.tgtStart && frame < sp.tgtEnd) {
        const p = (frame - sp.tgtStart) / (sp.tgtEnd - sp.tgtStart);
        return sp.origStart + p * (sp.origEnd - sp.origStart);
      }
    }
    return last ? last.origEnd : frame;
  };

  return { map, valid: true };
}
