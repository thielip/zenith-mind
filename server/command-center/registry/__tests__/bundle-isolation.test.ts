import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(__dirname, "..");

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
});
