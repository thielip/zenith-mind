import { isAllowedMediaUrl } from "@/lib/security/allowed-media-url";

describe("isAllowedMediaUrl", () => {
  it("allows external HTTPS image URLs with allowed extensions", () => {
    expect(isAllowedMediaUrl("https://cdn.example.com/photos/hero.webp")).toBe(
      true
    );
    expect(
      isAllowedMediaUrl(
        "https://qhutexisyfbclxntgkvx.supabase.co/storage/v1/object/public/media/x.png"
      )
    ).toBe(true);
  });

  it("rejects non-http(s) and non-image extensions", () => {
    expect(isAllowedMediaUrl("http://example.com/x.png")).toBe(true);
    expect(isAllowedMediaUrl("ftp://example.com/x.png")).toBe(false);
    expect(isAllowedMediaUrl("https://evil.example.com/x.gif")).toBe(false);
    expect(isAllowedMediaUrl("https://evil.example.com/noext")).toBe(false);
  });

  it("allows empty for optional fields", () => {
    expect(isAllowedMediaUrl("")).toBe(true);
  });
});
