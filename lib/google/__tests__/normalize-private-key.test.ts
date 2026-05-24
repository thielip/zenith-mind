import {
  normalizeServiceAccountPrivateKey,
  validateServiceAccountPrivateKey,
} from "../normalize-private-key";

const SAMPLE_PKCS8 = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7
-----END PRIVATE KEY-----`;

describe("normalizeServiceAccountPrivateKey", () => {
  it("expands escaped newlines", () => {
    const escaped = SAMPLE_PKCS8.replace(/\n/g, "\\n");
    const out = normalizeServiceAccountPrivateKey(escaped);
    expect(out).toContain("BEGIN PRIVATE KEY");
    expect(out).toContain("\n");
  });

  it("strips wrapping quotes", () => {
    const out = normalizeServiceAccountPrivateKey(`"${SAMPLE_PKCS8.replace(/\n/g, "\\n")}"`);
    expect(out.startsWith("-----BEGIN")).toBe(true);
  });

  it("reports invalid garbage", () => {
    const r = validateServiceAccountPrivateKey("not-a-key");
    expect(r.ok).toBe(false);
  });
});
