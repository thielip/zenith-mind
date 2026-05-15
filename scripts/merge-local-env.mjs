/**
 * 將 .env.import.tmp 的鍵合併進 .env.local（不輸出值）
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const importPath = process.argv[2];
const targetPath = process.argv[3] ?? ".env.local";
if (!importPath) process.exit(1);

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
  if (value.includes("\n")) {
    return `${key}="${value.replace(/\n/g, "\\n")}"`;
  }
  return `${key}=${value}`;
}

const incoming = parseEnv(readFileSync(importPath, "utf8"));
const importKeys = new Set(Object.keys(incoming));
const existing = existsSync(targetPath)
  ? readFileSync(targetPath, "utf8").split(/\r?\n/)
  : [];

const kept = existing.filter((line) => {
  const m = line.match(/^([A-Z0-9_]+)=/);
  return !m || !importKeys.has(m[1]);
});

const block = Object.entries(incoming).map(([k, v]) => serialize(k, v));
writeFileSync(
  targetPath,
  [...kept.filter((l, i, arr) => !(l === "" && arr[i + 1] === "")), "", ...block, ""].join(
    "\n"
  )
);
console.log(`merged ${importKeys.size} keys into ${targetPath}`);
