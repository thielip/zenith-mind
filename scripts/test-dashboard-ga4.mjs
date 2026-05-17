/**
 * 模擬 Next 載入 .env + .env.local 後跑儀表板 GA4 bundle
 * 用法：node scripts/test-dashboard-ga4.mjs
 */
import { readFileSync, existsSync } from "node:fs";

if (existsSync(".env.local")) {
  process.loadEnvFile(".env.local");
}
if (existsSync(".env")) {
  process.loadEnvFile(".env");
}

console.log("GA4_PROPERTY_ID:", process.env.GA4_PROPERTY_ID);
console.log("MEASUREMENT:", process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID);

const { fetchGa4DashboardBundle } = await import(
  "../infrastructure/ga4/dashboard-bundle.ts"
);
const bundle = await fetchGa4DashboardBundle();
console.log("probe:", bundle.reportingProbe);
console.log("realtime:", bundle.realtimeUsers);
console.log("stats:", bundle.stats);
