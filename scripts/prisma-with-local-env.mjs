/**
 * 載入專案根目錄 `.env.local` 後執行 `npx prisma …`。
 * Prisma CLI 預設不讀 `.env.local`，與 Next.js 不一致時可用：
 *   node scripts/prisma-with-local-env.mjs migrate deploy
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const envPath = join(root, ".env.local");
if (!existsSync(envPath)) {
  console.error("[prisma-with-local-env] 找不到 .env.local（請放在專案根目錄）");
  process.exit(1);
}

const content = readFileSync(envPath, "utf8");
for (const line of content.split(/\r?\n/)) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const eq = t.indexOf("=");
  if (eq <= 0) continue;
  const key = t.slice(0, eq).trim();
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;
  let val = t.slice(eq + 1).trim();
  if (
    (val.startsWith('"') && val.endsWith('"')) ||
    (val.startsWith("'") && val.endsWith("'"))
  ) {
    val = val.slice(1, -1);
  }
  val = val.replace(/\\n/g, "\n");
  process.env[key] = val;
}

const prismaArgs = process.argv.slice(2);
if (prismaArgs.length === 0) {
  console.error("用法: node scripts/prisma-with-local-env.mjs migrate deploy");
  process.exit(1);
}

const r = spawnSync("npx", ["prisma", ...prismaArgs], {
  stdio: "inherit",
  shell: true,
  cwd: root,
  env: process.env,
});
process.exit(r.status ?? 1);
