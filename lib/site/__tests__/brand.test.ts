import { DEFAULT_SITE_LOGO_PATH, resolveSiteLogoSrc } from "@/lib/site/brand";

describe("resolveSiteLogoSrc", () => {
  it("keeps valid external logo URLs including common hotlink hosts", () => {
    expect(resolveSiteLogoSrc("https://duk.tw/0MFnJo.png")).toBe(
      "https://duk.tw/0MFnJo.png"
    );
  });

  it("falls back when logo URL format is invalid", () => {
    expect(resolveSiteLogoSrc("https://duk.tw/no-extension")).toBe(
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
