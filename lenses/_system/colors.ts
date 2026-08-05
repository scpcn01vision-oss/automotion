// === 纸墨色板 ===
// 主色板：暖白仿宣纸底 + 深棕墨色 + 琥珀强调
// v7 镜头库唯一色板源（lenses/_system/colors.ts），与占位组件解耦。
export const G = {
  bg: '#faf7f2',       // 暖白仿宣纸（原 #ececea）
  panel: '#f5f0e8',    // 略深纸色（原 #f7f7f6）
  line: '#d9d3c7',     // 暖灰线（原 #dcdcda）
  bar: '#b8ae9e',      // 暖灰条（原 #c2c2c0）
  ink: '#2c2416',      // 深棕墨色（恢复原值，用阴影柔化而非调淡）
  mid: '#8b7355',      // 灰褐辅色（原 #8f8f8d）
  card: '#fefcf8',     // 卡片白（原 #ffffff）
  border: '#d4ccbd',   // 暖灰边框（原 #d8d8d6）
  side: '#3d3022',     // 深棕侧栏（暗场类镜头用，保持深色）
  nav: '#e8e0d2',      // 浅色侧栏（FakeDashboard 专用，标题可读性）
  sideBar: '#8b7355',  // 灰褐侧栏装饰条
  accent: '#d3923c',   // 琥珀强调色（新增）
};

export type GType = typeof G;
