import { shouldSkipRedirectLookup } from "@/lib/redirects/matcher";

describe("redirect matcher", () => {
  it("skips next, api, static assets", () => {
    expect(shouldSkipRedirectLookup("/_next/static/chunk.js")).toBe(true);
    expect(shouldSkipRedirectLookup("/api/redirect")).toBe(true);
    expect(shouldSkipRedirectLookup("/favicon.ico")).toBe(true);
    expect(shouldSkipRedirectLookup("/images/hero.png")).toBe(true);
    expect(shouldSkipRedirectLookup("/assets/logo.svg")).toBe(true);
    expect(shouldSkipRedirectLookup("/file.webp")).toBe(true);
    expect(shouldSkipRedirectLookup("/style.css")).toBe(true);
  });

  it("allows blog paths", () => {
    expect(shouldSkipRedirectLookup("/zh-TW/blog/old-slug")).toBe(false);
    expect(shouldSkipRedirectLookup("/en/blog/old-slug/")).toBe(false);
  });
});
