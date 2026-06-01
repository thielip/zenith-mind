import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(__dirname, "..", "..");
const FORBIDDEN_IMPORT = '@/lib/db/cf-public-runtime';

const ALLOWED = new Set([
  join(ROOT, "db", "cf-public-runtime.ts"),
  join(ROOT, "public-content", "runtime.ts"),
]);

function collectTsFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (name === "node_modules" || name === ".next" || name === "__tests__") continue;
    const st = statSync(full);
    if (st.isDirectory()) collectTsFiles(full, out);
    else if (name.endsWith(".ts") || name.endsWith(".tsx")) out.push(full);
  }
  return out;
}

describe("public content loaders must not import cf-public-runtime directly", () => {
  const loaderRoots = [
    join(ROOT, "blog"),
    join(ROOT, "homepage"),
    join(ROOT, "sitemap"),
    join(ROOT, "site"),
  ];

  it("has no forbidden imports under blog/homepage/sitemap/site", () => {
    const violations: string[] = [];
    for (const root of loaderRoots) {
      for (const file of collectTsFiles(root)) {
        if (ALLOWED.has(file)) continue;
        const text = readFileSync(file, "utf8");
        if (text.includes(FORBIDDEN_IMPORT) || text.includes('from "@/lib/db/cf-public-runtime"')) {
          violations.push(file.replace(ROOT, "lib"));
        }
      }
    }
    expect(violations).toEqual([]);
  });
});
