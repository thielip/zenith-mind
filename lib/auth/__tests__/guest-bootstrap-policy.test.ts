import {
  assertGuestBootstrapPasswordAllowed,
  GuestBootstrapSecurityError,
  isWeakGuestPassword,
  resolveGuestBootstrapPassword,
} from "@/lib/auth/guest-bootstrap-policy";

describe("guest-bootstrap-policy", () => {
  const env = process.env as Record<string, string | undefined>;

  beforeEach(() => {
    delete env["GUEST_BOOTSTRAP_PASSWORD"];
  });

  it("returns dev default when not production", () => {
    env["NODE_ENV"] = "development";
    delete process.env["GUEST_BOOTSTRAP_PASSWORD"];
    expect(resolveGuestBootstrapPassword()).toBe("guest123");
  });

  it("returns null in production without env password", () => {
    env["NODE_ENV"] = "production";
    delete process.env["GUEST_BOOTSTRAP_PASSWORD"];
    expect(resolveGuestBootstrapPassword()).toBeNull();
  });

  it("rejects weak production passwords", () => {
    env["NODE_ENV"] = "production";
    expect(() => assertGuestBootstrapPasswordAllowed("guest123")).toThrow(
      GuestBootstrapSecurityError
    );
    expect(() => assertGuestBootstrapPasswordAllowed("short")).toThrow(
      GuestBootstrapSecurityError
    );
  });

  it("allows strong production passwords", () => {
    env["NODE_ENV"] = "production";
    expect(() =>
      assertGuestBootstrapPasswordAllowed("unique-guest-secret-2026")
    ).not.toThrow();
    expect(isWeakGuestPassword("unique-guest-secret-2026")).toBe(false);
  });
});
