import fs from "node:fs";
import path from "node:path";

const root = path.join(import.meta.dirname, "..");
const list = fs
  .readFileSync(path.join(root, ".audit-source-files.txt"), "utf8")
  .split(/\r?\n/)
  .filter(Boolean);

const skip =
  /^(\.audit|\.wrangler|lighthouse|tail-|tailwindcss-|test-results|禁止上傳|圖檔|\.vercel\/state)/;

const files = list.filter(
  (f) =>
    !skip.test(f) &&
    !f.includes("tsbuildinfo") &&
    !f.endsWith(".docx") &&
    !f.endsWith(".png") &&
    !f.endsWith(".svg") &&
    !f.endsWith(".sqlite")
);

const out = [];

for (const rel of files) {
  const p = path.join(root, rel);
  if (!fs.existsSync(p)) continue;
  const stat = fs.statSync(p);
  const ext = path.extname(rel);
  let summary = "";
  let exports = [];
  let imports = [];

  if ([".ts", ".tsx", ".mjs", ".js"].includes(ext)) {
    const text = fs.readFileSync(p, "utf8").slice(0, 12000);
    summary = text
      .split(/\r?\n/)
      .slice(0, 25)
      .join(" ")
      .replace(/\s+/g, " ")
      .slice(0, 220);
    const ex = [
      ...text.matchAll(
        /export\s+(?:async\s+)?(?:function|const|class|enum|type|interface)\s+([A-Za-z0-9_$]+)/g
      ),
    ].map((m) => m[1]);
    const ex2 = [
      ...text.matchAll(/export\s+default\s+function\s+([A-Za-z0-9_$]+)/g),
    ].map((m) => m[1]);
    exports = [...new Set([...ex, ...ex2])].slice(0, 15);
    imports = [
      ...new Set([...text.matchAll(/from\s+["']([^"']+)["']/g)].map((m) => m[1])),
    ].slice(0, 10);
  } else if (ext === ".sql") {
    summary = fs.readFileSync(p, "utf8").split(/\r?\n/).slice(0, 6).join(" ").slice(0, 220);
  } else if ([".json", ".md", ".toml", ".css", ".txt"].includes(ext)) {
    summary = fs.readFileSync(p, "utf8").slice(0, 180).replace(/\s+/g, " ");
  } else {
    summary = "[binary or non-text asset]";
  }

  out.push({ rel, size: stat.size, exports, imports, summary });
}

fs.writeFileSync(path.join(root, ".audit-inventory.json"), JSON.stringify(out, null, 2));
console.log("inventory files:", out.length);
