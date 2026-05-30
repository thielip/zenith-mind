import {
  PROBE_TIMEOUT_MS,
  SLOW_PROBE_TIMEOUT_MS,
  withProbeTimeout,
} from "@/infrastructure/health/probe-timeout";

describe("withProbeTimeout", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("rejects with 探測逾時 after timeout", async () => {
    const pending = withProbeTimeout(new Promise<string>(() => {}), 1000);
    const assertion = expect(pending).rejects.toThrow("探測逾時");
    jest.advanceTimersByTime(1000);
    await assertion;
  });

  it("resolves when promise completes before timeout", async () => {
    await expect(withProbeTimeout(Promise.resolve("ok"), 1000)).resolves.toBe("ok");
  });

  it("exports timeout constants", () => {
    expect(PROBE_TIMEOUT_MS).toBe(15_000);
    expect(SLOW_PROBE_TIMEOUT_MS).toBe(25_000);
  });
});
