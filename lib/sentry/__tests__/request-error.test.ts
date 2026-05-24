import { isIgnorableRequestError } from "../request-error";

describe("isIgnorableRequestError", () => {
  it("ignores aborted errors", () => {
    expect(isIgnorableRequestError(new Error("aborted"))).toBe(true);
    expect(isIgnorableRequestError({ name: "AbortError", message: "x" })).toBe(true);
  });

  it("does not ignore real errors", () => {
    expect(isIgnorableRequestError(new Error("database down"))).toBe(false);
  });
});
