import {
  canWriteAdminEntity,
  hasAdminPermission,
} from "@/lib/auth/permissions";

describe("admin permissions", () => {
  it("allows guest read on all entities", () => {
    expect(hasAdminPermission("GUEST", "post", "read")).toBe(true);
    expect(hasAdminPermission("GUEST", "site", "read")).toBe(true);
  });

  it("denies guest write", () => {
    expect(canWriteAdminEntity("GUEST", "post")).toBe(false);
    expect(canWriteAdminEntity("ADMIN", "post")).toBe(true);
  });
});
