import { readFileSync } from "node:fs";
import { join } from "node:path";
import { seoModuleMeta } from "@/server/command-center/modules/seo/meta";

const root = join(__dirname, "..");
const seoPagePath = join(
  root,
  "../../../app/admin/dashboard/seo/page.tsx"
);

describe("command-center registry bundle isolation", () => {
  it("registry index does not statically import module implementations", () => {
    const indexSrc = readFileSync(join(root, "index.ts"), "utf8");
    const manifestSrc = readFileSync(join(root, "manifest.ts"), "utf8");
    const loadersSrc = readFileSync(join(root, "module-loaders.ts"), "utf8");

    expect(indexSrc).not.toMatch(
      /from ["']@\/server\/command-center\/modules\/[^"']+\/module["']/
    );
    expect(manifestSrc).not.toMatch(/load-seo/);
    expect(manifestSrc).not.toMatch(/search-console/);
    expect(loadersSrc).toMatch(/import\s*\(/);
    expect(loadersSrc).toMatch(/modules\/seo\/module/);
  });

  it("seo page revalidate literal stays in sync with module manifest", () => {
    const pageSrc = readFileSync(seoPagePath, "utf8");
    const match = pageSrc.match(/export const revalidate = (\d+)/);
    expect(match).not.toBeNull();
    expect(Number(match![1])).toBe(seoModuleMeta.revalidate);
  });
});
