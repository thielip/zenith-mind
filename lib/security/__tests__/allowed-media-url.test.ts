import { isAllowedMediaUrl } from "@/lib/security/allowed-media-url";

describe("isAllowedMediaUrl", () => {
  it("allows Supabase storage HTTPS URLs", () => {
    expect(
      isAllowedMediaUrl(
        "https://qhutexisyfbclxntgkvx.supabase.co/storage/v1/object/public/media/x.png"
      )
    ).toBe(true);
  });

  it("rejects non-HTTPS and untrusted hosts", () => {
    expect(isAllowedMediaUrl("http://example.com/x.png")).toBe(false);
    expect(isAllowedMediaUrl("https://evil.example.com/x.png")).toBe(false);
  });
});
