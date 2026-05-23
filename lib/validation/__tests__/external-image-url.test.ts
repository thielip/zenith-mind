import {
  checkExternalImageUrl,
  isValidExternalImageUrl,
  optionalExternalImageUrlSchema,
  requiredExternalImageUrlSchema,
} from "@/lib/validation/external-image-url";

describe("isValidExternalImageUrl", () => {
  it("accepts http(s) URLs ending with allowed extensions", () => {
    expect(isValidExternalImageUrl("https://cdn.example.com/photo.jpg")).toBe(true);
    expect(isValidExternalImageUrl("http://img.example.org/a/b/image.jpeg")).toBe(true);
    expect(isValidExternalImageUrl("https://x.com/pic.PNG")).toBe(true);
    expect(isValidExternalImageUrl("https://x.com/pic.webp?v=1")).toBe(true);
  });

  it("accepts duk.tw URLs (format valid; may warn in UI)", () => {
    expect(isValidExternalImageUrl("https://duk.tw/BiJVOF.png")).toBe(true);
    expect(isValidExternalImageUrl("https://duk.tw/0MFnJo.png")).toBe(true);
    expect(checkExternalImageUrl("https://duk.tw/BiJVOF.png").warning).toBeTruthy();
    expect(checkExternalImageUrl("https://cdn.example.com/x.jpg").warning).toBeUndefined();
  });

  it("rejects missing protocol, wrong extension, or non-http(s)", () => {
    expect(isValidExternalImageUrl("/local/x.png")).toBe(false);
    expect(isValidExternalImageUrl("https://x.com/pic.gif")).toBe(false);
    expect(isValidExternalImageUrl("https://x.com/pic")).toBe(false);
    expect(isValidExternalImageUrl("ftp://x.com/a.jpg")).toBe(false);
    expect(isValidExternalImageUrl("")).toBe(false);
  });
});

describe("optionalExternalImageUrlSchema", () => {
  it("allows empty string", () => {
    expect(optionalExternalImageUrlSchema.safeParse("").success).toBe(true);
  });
});

describe("requiredExternalImageUrlSchema", () => {
  it("requires valid URL", () => {
    expect(
      requiredExternalImageUrlSchema.safeParse("https://a.com/x.jpg").success
    ).toBe(true);
    expect(requiredExternalImageUrlSchema.safeParse("").success).toBe(false);
  });
});
