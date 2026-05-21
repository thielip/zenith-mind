/**
 * 掃描 repo 是否殘留疑似 secret（排除 node_modules、.next、.open-next）
 * 用法：node scripts/scan-secrets.mjs
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const SKIP_DIRS = new Set([
  "node_modules",
  ".next",
  ".open-next",
  ".git",
  "coverage",
  ".cf-build-skip",
  ".vercel",
]);

const PATTERNS = [
  { name: "postgres_url", re: /postgresql:\/\/[^\s'"]+:[^\s'"]+@/i },
  { name: "openai_key", re: /sk-[a-zA-Z0-9]{20,}/ },
  { name: "gemini_key", re: /AIzaSy[a-zA-Z0-9_-]{20,}/ },
  { name: "jwt_like", re: /eyJ[a-zA-Z0-9_-]{20,}\.[a-zA-Z0-9_-]{20,}\./ },
];

const ALLOW_FILES = new Set([
  join(root, "jest.setup.ts"),
  join(root, "test-utils", "env-mock.ts"),
  join(root, "lib", "admin", "__tests__", "integration-health.test.ts"),
]);

const hits = [];

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (SKIP_DIRS.has(name)) continue;
    const st = statSync(path);
    if (st.isDirectory()) {
      walk(path);
      continue;
    }
    if (!/\.(ts|tsx|js|mjs|cjs|json|toml|md|txt|yml|yaml|env\.example)$/i.test(name)) {
      continue;
    }
    if (name === ".env.example") continue;
    if (ALLOW_FILES.has(path)) continue;
    let text;
    try {
      text = readFileSync(path, "utf8");
    } catch {
      continue;
    }
    for (const p of PATTERNS) {
      if (p.re.test(text)) {
        hits.push({ path: path.replace(root + "\\", "").replace(root + "/", ""), kind: p.name });
        break;
      }
    }
  }
}

walk(root);

if (hits.length === 0) {
  console.log("OK: 未發現疑似硬編碼 secret（已排除測試假資料路徑）");
  process.exit(0);
}

console.log("疑似 secret 殘留：");
for (const h of hits) console.log(`  [${h.kind}] ${h.path}`);
process.exit(1);
