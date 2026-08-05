// M1 全量预览验证：bundle 一次 + 逐个 renderStill（默认帧 = 中段），输出失败清单
// 用法：node scripts/verify-lenses.mjs [compId] [frame]
import { bundle } from "@remotion/bundler";
import {
  getCompositions,
  renderStill,
  openBrowser,
} from "@remotion/renderer";
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const ENTRY = path.join(ROOT, "lenses", "Root.preview.tsx");
const PUBLIC_DIR = path.join(ROOT, "public");
const OUT_DIR = path.join(ROOT, "out", "verify");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const only = process.argv[2];
const frameArg = process.argv[3];
const propsArg = process.argv[4];
const inputProps = propsArg && existsSync(propsArg)
  ? JSON.parse(readFileSync(propsArg, "utf8"))
  : undefined;

console.log("bundle...");
const serveUrl = await bundle({
  entryPoint: ENTRY,
  rootDir: ROOT,
  publicDir: PUBLIC_DIR,
});

console.log("getCompositions...");
let comps = await getCompositions(serveUrl, { browserExecutable: CHROME });
if (only) {
  comps = comps.filter((c) => c.id === only);
}
console.log(`rendering ${comps.length} compositions -> ${OUT_DIR}`);

mkdirSync(OUT_DIR, { recursive: true });

const browser = await openBrowser("chrome", { browserExecutable: CHROME });
const failed = [];
let ok = 0;

for (const comp of comps) {
  const frame =
    frameArg !== undefined
      ? Number(frameArg)
      : Math.min(90, Math.floor(comp.durationInFrames * 0.5));
  const out = path.join(OUT_DIR, `${comp.id}.png`);
  try {
    await renderStill({
      composition: comp,
      serveUrl,
      output: out,
      frame,
      browser,
      inputProps,
    });
    ok++;
    console.log(`ok ${ok}/${comps.length} ${comp.id} frame=${frame}`);
  } catch (e) {
    const msg = String(e && e.message ? e.message : e).slice(0, 500);
    failed.push({ id: comp.id, error: msg });
    console.error(`FAIL ${comp.id}: ${msg.slice(0, 200)}`);
  }
}
await browser.close({ silent: true });

const report = path.join(ROOT, "out", "verify-report.json");
writeFileSync(report, JSON.stringify({ total: comps.length, ok, failed }, null, 2));
console.log(`done. ok=${ok} failed=${failed.length} report=${report}`);
