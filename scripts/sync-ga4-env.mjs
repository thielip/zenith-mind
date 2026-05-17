/**
 * 將 .env.local 的 GA4 相關鍵同步到 .env / .dev.vars（避免 .env 殘留舊 Property ID）
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";

const KEYS = [
  "GA4_CLIENT_EMAIL",
  "GA4_PRIVATE_KEY",
  "GA4_PROPERTY_ID",
  "GA4_ACCOUNT_ID",
  "NEXT_PUBLIC_GA4_MEASUREMENT_ID",
];

function parseEnv(content) {
  const out = {};
  let key = null;
  let buf = [];
  const flush = () => {
    if (!key) return;
    let val = buf.join("\n").trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val.replace(/\\n/g, "\n");
    key = null;
    buf = [];
  };
  for (const line of content.split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) {
      flush();
      key = m[1];
      buf = [m[2] ?? ""];
    } else if (key) buf.push(line);
  }
  flush();
  return out;
}

function serialize(key, value) {
  if (value.includes("\n")) return `${key}="${value.replace(/\n/g, "\\n")}"`;
  return `${key}=${value}`;
}

function mergeKeys(targetPath, source) {
  if (!existsSync(targetPath)) return;
  const keys = new Set(KEYS);
  const incoming = Object.fromEntries(
    KEYS.filter((k) => source[k]).map((k) => [k, source[k]])
  );
  const lines = readFileSync(targetPath, "utf8").split(/\r?\n/);
  const kept = lines.filter((line) => {
    const m = line.match(/^([A-Z0-9_]+)=/);
    return !m || !keys.has(m[1]);
  });
  const block = KEYS.filter((k) => incoming[k]).map((k) =>
    serialize(k, incoming[k])
  );
  writeFileSync(
    targetPath,
    [...kept.filter((l, i, arr) => !(l === "" && arr[i + 1] === "")), "", ...block, ""].join(
      "\n"
    )
  );
  console.log(`synced GA4 keys -> ${targetPath}`);
}

const local = parseEnv(readFileSync(".env.local", "utf8"));
mergeKeys(".env", local);
mergeKeys(".dev.vars", local);

console.log("\nGA4 對照（不含私鑰）：");
for (const k of KEYS) {
  if (k === "GA4_PRIVATE_KEY") {
    console.log(`  ${k}: ${local[k] ? `已設定（${local[k].length} 字元）` : "缺少"}`);
  } else {
    console.log(`  ${k}: ${local[k] ?? "缺少"}`);
  }
}
