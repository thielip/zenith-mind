import { formatApiError } from "@/lib/admin/format-api-error";

describe("formatApiError", () => {
  it("handles useless gRPC message", () => {
    const err = new Error("undefined undefined: undefined");
    expect(formatApiError(err)).not.toBe("undefined undefined: undefined");
    expect(formatApiError(err)).toBe("未知錯誤");
  });

  it("handles useless message with Error prefix from stack", () => {
    const err = new Error("undefined undefined: undefined");
    err.stack = "Error: undefined undefined: undefined\n    at foo";
    expect(formatApiError(err)).toBe("未知錯誤");
  });

  it("uses Gaxios-style errors array", () => {
    expect(
      formatApiError({
        errors: [{ message: "7 PERMISSION_DENIED: insufficient permissions" }],
      })
    ).toContain("PERMISSION_DENIED");
  });

  it("returns Error message when useful", () => {
    expect(formatApiError(new Error("7 PERMISSION_DENIED: test"))).toBe(
      "7 PERMISSION_DENIED: test"
    );
  });
});
