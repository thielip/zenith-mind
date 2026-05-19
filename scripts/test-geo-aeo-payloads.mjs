/**
 * 驗證 GEO / AEO payload（需 .env.local + DB）
 * npx tsx --env-file=.env.local scripts/test-geo-aeo-payloads.mjs
 */
import { readFileSync, existsSync } from "node:fs";
if (existsSync(".env.local")) process.loadEnvFile(".env.local");

const { loadAeoPayload } = await import("../server/command-center/load-aeo.ts");
const { loadGeoPayload } = await import("../server/command-center/load-geo.ts");

const aeo = await loadAeoPayload();
const geo = await loadGeoPayload();

console.log("=== AEO ===");
console.log({
  isLiveGaq: aeo.isLiveGsc,
  metrics: aeo.metrics,
  appearanceRows: aeo.appearances.length,
});
console.log("\n=== GEO ===");
console.log({
  isDemo: geo.isDemo,
  dataSource: geo.dataSource,
  engines: geo.engines.map((e) => e.name),
  kpiLabels: geo.kpis.map((k) => k.label),
});
