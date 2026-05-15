jest.mock("@/env", () => ({
  env: require("@/test-utils/env-mock").env,
}));

import { signAccessToken, signTempToken, verifyAccessToken, verifyTempToken } from "../jwt";

describe("JWT helpers", () => {
  it("accepts only typed admin access tokens", async () => {
    const token = await signAccessToken({
      userId: "user-1",
      email: "admin@example.com",
      role: "ADMIN",
    });

    const payload = await verifyAccessToken(token);

    expect(payload.tokenType).toBe("access");
    expect(payload.role).toBe("ADMIN");
  });

  it("rejects temporary TOTP tokens as access tokens", async () => {
    const tempToken = await signTempToken("user-1");

    await expect(verifyAccessToken(tempToken)).rejects.toThrow("INVALID_ACCESS_TOKEN");
  });

  it("verifies temporary TOTP tokens only through the temp verifier", async () => {
    const tempToken = await signTempToken("user-1");

    const payload = await verifyTempToken(tempToken);

    expect(payload.tokenType).toBe("temp");
    expect(payload.purpose).toBe("totp_pending");
  });
});
