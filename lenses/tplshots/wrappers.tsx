// === 可调参数 ===
// DURATION: 见各 Composition（BrandInkOpen 83 / SpotlightHeroCard 138 /
//   RowEmbed 100 / ListStackPress 105 / DocumentTypewriterReveal 110 / OutroGroupPhotoLaunch 145）
// 色彩: 模板片原生纸墨风（INK oklch(18%) / AMBER oklch(52%) / PAPER 暖白），走自身常量
// 依赖: PageCam（2.5D 相机，需 three）+ live-layout.json（template 版）+ textures/live 纹理
// props: 无内容可变项（wrapper 仅做帧段裁剪；模板场景内容由 Scene 组件承载）
// === 时间特性 ===
// 刚性（不可压缩）: 各镜头动作核心（发牌/打字/落卡/字标 hold≥1s），见配方卡 references/shots/
// 弹性（可伸缩）: 场景内过渡段可等比缩放（Scene 组件支持 start 偏移裁剪）
// === 适配注意 ===
// 场景来自 template/src/aifl/live/，含 AI Foundation Lab 模板内容——M2 评估替换/中性化（Scene 为底层组件，保留 id）
// 字标/文档内容为项目真实内容；start prop 控制镜头帧段起点。
// 8 个 template 场景镜头 wrapper（按配方卡参考实现帧段裁剪）
import { SceneOpen } from "./SceneOpen";
import { SceneDetail } from "./SceneDetail";
import { ScenePapers } from "./ScenePapers";
import { SceneWbr } from "./SceneWbr";
import { SceneOutroLive } from "./SceneOutroLive";

// brand-ink-open：墨线十字准星 → 字标逐字压印 → 打字机副标 → 1s 静止 → 上浮消散（0–83）
export const BrandInkOpen: React.FC = () => <SceneOpen start={0} />;

// spotlight-hero-card：暖光巡视 dashboard → 锁定单卡 → 推近摇摆 → 悬停光束两圈 → 归位（82–220）
export const SpotlightHeroCard: React.FC = () => <SceneOpen start={82} />;

// deck-deal-flyin：实体牌堆加速甩进网格（0–127）


// row-embed：内容行逐条飞入嵌入 + 强调色缝（0–100）
export const RowEmbed: React.FC = () => <SceneDetail start={0} />;

// list-stack-press：论文卡逐张落入堆叠 + 计数（0–105）
export const ListStackPress: React.FC = () => <ScenePapers start={0} />;

// document-typewriter-reveal：整页文档打字机写入 + 侧栏历史条目（0–110）
export const DocumentTypewriterReveal: React.FC = () => <SceneWbr start={0} />;

// outro-group-photo-launch：元素聚拢 + 字标 + 金粉收尾（0–145）
export interface OutroGroupPhotoLaunchProps {
  wordmark?: string;
}
export const OutroGroupPhotoLaunch: React.FC<OutroGroupPhotoLaunchProps> = ({ wordmark }) => (
  <SceneOutroLive start={0} wordmark={wordmark} />
);
