/**
 * Lightweight bundle audit for public routes (P1/P2).
 * Run after `npm run build` to list largest client chunks.
 *
 * Usage: node scripts/perf/public-bundle-audit.mjs
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const nextDir = path.join(root, ".next");

function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.isDirectory()) {
      walk(path.join(dir, ent.name), acc);
    } else if (ent.isFile() && ent.name.endsWith(".js")) {
      const full = path.join(dir, ent.name);
      const stat = fs.statSync(full);
      acc.push({
        file: full.replace(root, ""),
        kb: Math.round(stat.size / 1024),
      });
    }
  }
  return acc;
}

function main() {
  if (!fs.existsSync(nextDir)) {
    console.log("Run `npm run build` first.");
    process.exit(1);
  }

  const staticDir = path.join(nextDir, "static");
  const chunksDir = path.join(staticDir, "chunks");
  const appDir = path.join(staticDir, "chunks", "app");

  const files = [];
  if (fs.existsSync(chunksDir)) {
    walk(chunksDir, files);
  }
  if (fs.existsSync(appDir)) {
    walk(appDir, files);
  }

  files.sort((a, b) => b.kb - a.kb);
  const top = files.slice(0, 20);

  console.log("Top client chunks (approx, gzip may differ):");
  for (const f of top) {
    console.log(`${String(f.kb).padStart(6)} KB  ${f.file}`);
  }

  const suspicious = top.filter((f) =>
    /command-center|war-room|recharts|dashboard\/|admin\/dashboard/i.test(f.file)
  );

  if (suspicious.length > 0) {
    console.log("\nPotential admin/dashboard chunks in public build:");
    for (const f of suspicious) {
      console.log(`  ${f.file}`);
    }
  } else {
    console.log("\nNo obvious admin/dashboard chunk names in top-level client chunks.");
  }
}

main();
