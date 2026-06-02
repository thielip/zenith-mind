import { loginErrorMessage, safeRedirectPath } from "@/components/admin/login-form-utils";

describe("LoginForm helpers", () => {
  it("sanitizes open redirect targets", () => {
    expect(safeRedirectPath("/admin/dashboard")).toBe("/admin/dashboard");
    expect(safeRedirectPath("//evil.com")).toBe("/admin/dashboard");
    expect(safeRedirectPath(undefined)).toBe("/admin/dashboard");
  });

  it("maps action error codes to user-facing copy", () => {
    expect(loginErrorMessage("AUTH_FAILED")).toContain("密碼");
    expect(loginErrorMessage("RATE_LIMIT")).toContain("稍後");
    expect(loginErrorMessage(undefined)).toContain("登入失敗");
  });
});
