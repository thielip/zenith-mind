import {
  postArticlePath,
  postDeleteRedirectTarget,
  shouldSkipRedirectLookup,
} from "@/lib/redirects/paths";

describe("redirect paths", () => {
  it("builds article paths per locale", () => {
    expect(postArticlePath("zh-TW", "hello-world")).toBe(
      "/zh-TW/blog/hello-world"
    );
    expect(postArticlePath("en", "hello-world")).toBe("/en/blog/hello-world");
  });

  it("prefers category list as delete redirect target", () => {
    expect(postDeleteRedirectTarget("zh-TW", "mindfulness")).toBe(
      "/zh-TW/blog?category=mindfulness"
    );
    expect(postDeleteRedirectTarget("en", "mindfulness")).toBe(
      "/en/blog?category=mindfulness"
    );
  });

  it("falls back to blog index without category", () => {
    expect(postDeleteRedirectTarget("zh-TW", null)).toBe("/zh-TW/blog");
    expect(postDeleteRedirectTarget("en", "")).toBe("/en/blog");
  });

  it("skips static and internal paths for lookup", () => {
    expect(shouldSkipRedirectLookup("/api/redirect")).toBe(true);
    expect(shouldSkipRedirectLookup("/admin/posts")).toBe(true);
    expect(shouldSkipRedirectLookup("/images/banner.jpg")).toBe(true);
    expect(shouldSkipRedirectLookup("/logo.png")).toBe(true);
    expect(shouldSkipRedirectLookup("/zh-TW/blog/old-slug")).toBe(false);
  });
});
