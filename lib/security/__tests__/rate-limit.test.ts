jest.mock("@/infrastructure/redis/client", () => ({
  redis: {
    incr: jest.fn(),
    expire: jest.fn(),
  },
}));

import { redis } from "@/infrastructure/redis/client";
import { checkRateLimit } from "@/lib/security/rate-limit";
import {
  checkMemoryRateLimit,
  resetMemoryRateLimitStore,
} from "@/lib/security/rate-limit-memory";

const redisIncr = jest.mocked(redis.incr);
const redisExpire = jest.mocked(redis.expire);

describe("checkMemoryRateLimit", () => {
  beforeEach(() => resetMemoryRateLimitStore());

  it("allows requests under the limit within the window", () => {
    const key = "test:memory";
    expect(checkMemoryRateLimit(key, 3, 60_000).allowed).toBe(true);
    expect(checkMemoryRateLimit(key, 3, 60_000).allowed).toBe(true);
    expect(checkMemoryRateLimit(key, 3, 60_000).allowed).toBe(true);
    expect(checkMemoryRateLimit(key, 3, 60_000).allowed).toBe(false);
  });
});

describe("checkRateLimit", () => {
  beforeEach(() => {
    resetMemoryRateLimitStore();
    jest.clearAllMocks();
  });

  it("uses redis when available", async () => {
    redisIncr.mockResolvedValue(1);
    redisExpire.mockResolvedValue(1);

    const result = await checkRateLimit("ip:1", 10, 60);

    expect(result.allowed).toBe(true);
    expect(result.backend).toBe("redis");
    expect(redisIncr).toHaveBeenCalled();
  });

  it("falls back to memory when redis fails (fail-closed, not fail-open)", async () => {
    redisIncr.mockRejectedValue(new Error("Redis down"));

    const first = await checkRateLimit("fallback:ip", 2, 60);
    const second = await checkRateLimit("fallback:ip", 2, 60);
    const third = await checkRateLimit("fallback:ip", 2, 60);

    expect(first.backend).toBe("memory");
    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(true);
    expect(third.allowed).toBe(false);
  });
});
