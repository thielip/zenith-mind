import {
  containsCjk,
  isValidBlurHash,
  stripCjkFromBlurHashInput,
} from "../blurhash";

describe("blurhash validation", () => {
  it("accepts empty optional value", () => {
    expect(isValidBlurHash("")).toBe(true);
    expect(isValidBlurHash("   ")).toBe(true);
  });

  it("rejects Chinese characters", () => {
    expect(isValidBlurHash("中文測試")).toBe(false);
    expect(containsCjk("L6PZfSi_.AyE_3t7t7R**0o#DgR4")).toBe(false);
    expect(containsCjk("錯誤")).toBe(true);
  });

  it("accepts typical blurhash strings", () => {
    expect(isValidBlurHash("L6PZfSi_.AyE_3t7t7R**0o#DgR4")).toBe(true);
  });

  it("strips CJK on input", () => {
    expect(stripCjkFromBlurHashInput("L6中PZf")).toBe("L6PZf");
  });
});
