/**
 * 從 .env.import.tmp + 公開變數產生 .dev.vars（勿提交 Git）
 */
import { readFileSync, writeFileSync } from "node:fs";

const importPath = process.argv[2] ?? ".env.import.tmp";
const content = readFileSync(importPath, "utf8");
const header = [
  "# 本機 wrangler / OpenNext 預覽用",
  "SKIP_ENV_VALIDATION=true",
  "NEXTJS_ENV=development",
  "",
].join("\n");
writeFileSync(".dev.vars", header + content + "\n");
console.log("wrote .dev.vars");
