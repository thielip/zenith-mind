import { assertRevalidateTarget } from "@/lib/security/revalidate-target";

describe("assertRevalidateTarget", () => {
  it("accepts safe paths and tags", () => {
    expect(assertRevalidateTarget("path", "/zh-TW/blog")).toBe(true);
    expect(assertRevalidateTarget("tag", "posts")).toBe(true);
  });

  it("rejects path traversal and odd targets", () => {
    expect(assertRevalidateTarget("path", "/../etc/passwd")).toBe(false);
    expect(assertRevalidateTarget("path", "https://evil.com")).toBe(false);
    expect(assertRevalidateTarget("tag", "posts;drop")).toBe(false);
  });
});
