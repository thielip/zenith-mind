/** 載入專案根目錄 .env.local（與 prisma-with-local-env 相同邏輯） */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export function loadDotenvLocal(cwd = process.cwd()) {
  const envPath = join(cwd, ".env.local");
  if (!existsSync(envPath)) return false;

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
  return true;
}
