import { newPageViewId, sha256Hex } from "@/lib/analytics/visitor-hash";

describe("visitor-hash (edge-safe)", () => {
  it("produces stable sha256 hex", async () => {
    const a = await sha256Hex("test-input");
    const b = await sha256Hex("test-input");
    expect(a).toBe(b);
    expect(a).toMatch(/^[a-f0-9]{64}$/);
  });

  it("generates uuid-like ids", () => {
    const id = newPageViewId();
    expect(id.length).toBeGreaterThan(10);
  });
});
