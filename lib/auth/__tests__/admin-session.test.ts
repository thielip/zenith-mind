import { assertCanWrite, type AdminSession } from "@/lib/auth/admin-session";

describe("assertCanWrite", () => {
  const session: AdminSession = {
    userId: "cluser00000000000000000",
    email: "admin@example.com",
    role: "ADMIN",
  };

  it("allows settings write for own userId", () => {
    expect(() =>
      assertCanWrite(session, "settings", "cluser00000000000000000")
    ).not.toThrow();
  });

  it("forbids settings write for another userId", () => {
    expect(() =>
      assertCanWrite(session, "settings", "clother00000000000000000")
    ).toThrow("FORBIDDEN");
  });

  it("allows post write without entityId match", () => {
    expect(() => assertCanWrite(session, "post", "post-123")).not.toThrow();
  });
});
