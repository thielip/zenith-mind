import {
  canReadAdminEntity,
  canWriteAdminEntity,
  hasAdminPermission,
} from "@/lib/auth/permissions";

describe("admin permissions", () => {
  it("allows guest read on content entities only", () => {
    expect(hasAdminPermission("GUEST", "post", "read")).toBe(true);
    expect(hasAdminPermission("GUEST", "site", "read")).toBe(true);
    expect(hasAdminPermission("GUEST", "media", "read")).toBe(true);
    expect(hasAdminPermission("GUEST", "affiliate", "read")).toBe(true);
  });

  it("denies guest read on sensitive entities", () => {
    expect(canReadAdminEntity("GUEST", "user")).toBe(false);
    expect(canReadAdminEntity("GUEST", "integration")).toBe(false);
    expect(canReadAdminEntity("GUEST", "analytics")).toBe(false);
    expect(canReadAdminEntity("GUEST", "audit")).toBe(false);
    expect(canReadAdminEntity("GUEST", "settings")).toBe(false);
  });

  it("denies guest write", () => {
    expect(canWriteAdminEntity("GUEST", "post")).toBe(false);
    expect(canWriteAdminEntity("ADMIN", "post")).toBe(true);
  });
});
