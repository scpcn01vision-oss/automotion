// AIFL 模板片时间线（从 template/src/aifl/Main.tsx 提取，供 Scene 组件使用）
export const AIFL_SHOTS = {
  morning: { from: 0, duration: 220 },
  card1: { from: 220, duration: 55 },
  table: { from: 275, duration: 190 },
  macro: { from: 465, duration: 100 },
  card2: { from: 565, duration: 55 },
  chart: { from: 620, duration: 105 },
  cardWbr: { from: 725, duration: 50 },
  wbr: { from: 775, duration: 110 },
  card3: { from: 885, duration: 55 },
  outro: { from: 940, duration: 145 },
} as const;