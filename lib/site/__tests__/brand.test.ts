import { DEFAULT_SITE_LOGO_PATH, resolveSiteLogoSrc } from "@/lib/site/brand";

describe("resolveSiteLogoSrc", () => {
  it("falls back when logo URL host is blocked", () => {
    expect(resolveSiteLogoSrc("https://duk.tw/0MFnJo.png")).toBe(
      DEFAULT_SITE_LOGO_PATH
    );
  });

  it("keeps relative and valid absolute URLs", () => {
    expect(resolveSiteLogoSrc("/custom.png")).toBe("/custom.png");
    expect(
      resolveSiteLogoSrc(
        "https://qhutexisyfbclxntgkvx.supabase.co/storage/v1/object/public/site/logo.png"
      )
    ).toContain("supabase.co");
  });

  it("uses default when empty", () => {
    expect(resolveSiteLogoSrc("")).toBe(DEFAULT_SITE_LOGO_PATH);
    expect(resolveSiteLogoSrc(null)).toBe(DEFAULT_SITE_LOGO_PATH);
  });
});
