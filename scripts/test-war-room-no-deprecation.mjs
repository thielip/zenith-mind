/**
 * 模擬戰情室載入路徑，確認無 url.parse (DEP0169) 棄用
 * npx tsx --env-file=.env.local scripts/test-war-room-no-deprecation.mjs
 */
import { config } from "dotenv";

config({ path: ".env.local" });

const deprecations = [];
process.on("warning", (w) => {
  if (w.name === "DeprecationWarning" && String(w.message).includes("url.parse")) {
    deprecations.push(w.message);
  }
});

const { runInsightPipeline } = await import(
  "../features/ai-insights/services/pipeline.ts"
);
const { probeGemini } = await import("../infrastructure/health/probes.ts");
const { fetchSearchConsoleSummary } = await import(
  "../services/google/search-console.ts"
);

await probeGemini();
await fetchSearchConsoleSummary();
await runInsightPipeline();

if (deprecations.length) {
  console.error("FAIL: url.parse deprecation:", deprecations);
  process.exit(1);
}
console.log("PASS: 戰情室關鍵路徑無 url.parse 棄用警告");
