import { RetryAbortedError, withRetry } from "@/lib/http/with-retry";

describe("withRetry", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("retries on 429 then succeeds", async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(Object.assign(new Error("rate"), { status: 429 }))
      .mockResolvedValueOnce("ok");

    const promise = withRetry(fn, { baseDelayMs: 100, maxAttempts: 3 });
    await jest.runAllTimersAsync();
    await expect(promise).resolves.toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("stops retry loop when AbortSignal fires during backoff", async () => {
    const controller = new AbortController();
    const err = Object.assign(new Error("rate"), { status: 429 });
    const fn = jest.fn().mockRejectedValue(err);

    const promise = withRetry(fn, {
      maxAttempts: 5,
      baseDelayMs: 10_000,
      signal: controller.signal,
    });
    const assertion = expect(promise).rejects.toBeInstanceOf(RetryAbortedError);

    await Promise.resolve();
    controller.abort();
    await jest.runAllTimersAsync();
    await assertion;
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("throws after max attempts", async () => {
    const err = Object.assign(new Error("always"), { status: 503 });
    const fn = jest.fn().mockRejectedValue(err);

    const promise = withRetry(fn, { maxAttempts: 2, baseDelayMs: 10 });
    const assertion = expect(promise).rejects.toThrow("always");
    await jest.runAllTimersAsync();
    await assertion;
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
