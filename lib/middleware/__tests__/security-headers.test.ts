import { buildCsp } from "@/lib/middleware/security-headers";

describe("buildCsp connect-src", () => {
  it("allows Sentry ingest endpoints in production", () => {
    const csp = buildCsp("test-nonce", true);
    expect(csp).toContain("connect-src");
    expect(csp).toContain("https://*.ingest.sentry.io");
    expect(csp).toContain("https://*.ingest.us.sentry.io");
  });
});
