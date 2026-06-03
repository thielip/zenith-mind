jest.mock("@/infrastructure/redis/client", () => ({
  redis: {
    incr: jest.fn(),
    expire: jest.fn(),
  },
}));

import { redis } from "@/infrastructure/redis/client";
import {
  assertPostPasswordAttemptAllowed,
  delayAfterPostPasswordFailure,
} from "@/lib/security/post-password-guard";
import { resetMemoryRateLimitStore } from "@/lib/security/rate-limit-memory";

const redisIncr = jest.mocked(redis.incr);
const redisExpire = jest.mocked(redis.expire);

describe("post-password-guard", () => {
  beforeEach(() => {
    resetMemoryRateLimitStore();
    jest.clearAllMocks();
    redisIncr.mockImplementation(async () => 1);
    redisExpire.mockResolvedValue(1);
  });

  it("blocks after too many attempts per slug and ip", async () => {
    redisIncr.mockRejectedValue(new Error("Redis down"));

    const slug = "my-post";
    const ip = "203.0.113.1";

    for (let i = 0; i < 10; i++) {
      const r = await assertPostPasswordAttemptAllowed(slug, ip);
      expect(r.allowed).toBe(true);
    }
    const blocked = await assertPostPasswordAttemptAllowed(slug, ip);
    expect(blocked.allowed).toBe(false);
  });

  it("applies increasing delay on failures", async () => {
    redisIncr.mockRejectedValue(new Error("Redis down"));
    const slug = "locked-post";
    const ip = "203.0.113.2";
    const start = Date.now();
    await delayAfterPostPasswordFailure(slug, ip);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(300);
  });
});
