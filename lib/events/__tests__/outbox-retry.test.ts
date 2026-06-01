import {
  computeNextOutboxRetry,
  getOutboxRetryMeta,
  isOutboxReadyForProcessing,
  mergeOutboxPayloadWithRetry,
  OUTBOX_META_KEY,
} from "@/lib/events/outbox-retry";

describe("outbox-retry", () => {
  it("treats events without meta as immediately processable", () => {
    expect(isOutboxReadyForProcessing({ foo: 1 })).toBe(true);
  });

  it("defers processing until nextRetryAt", () => {
    const future = new Date(Date.now() + 60_000).toISOString();
    expect(
      isOutboxReadyForProcessing({
        [OUTBOX_META_KEY]: { retryCount: 1, nextRetryAt: future },
      })
    ).toBe(false);
  });

  it("computes exponential backoff and gives up after max retries", () => {
    const first = computeNextOutboxRetry(0);
    expect(first.giveUp).toBe(false);
    if (!first.giveUp) {
      expect(first.meta.retryCount).toBe(1);
      expect(new Date(first.meta.nextRetryAt).getTime()).toBeGreaterThan(
        Date.now()
      );
    }

    const exhausted = computeNextOutboxRetry(5);
    expect(exhausted.giveUp).toBe(true);
  });

  it("merges meta into payload without dropping business fields", () => {
    const merged = mergeOutboxPayloadWithRetry(
      { postId: "p1" },
      { retryCount: 2, nextRetryAt: "2026-01-01T00:00:00.000Z" },
      "boom"
    );
    expect(merged.postId).toBe("p1");
    expect(getOutboxRetryMeta(merged)?.lastError).toBe("boom");
  });

  it("deep-clones nested business payload so mutations do not alias DB row", () => {
    const original = {
      postId: "p1",
      nested: { views: 10, meta: { slug: "hello" } },
      tags: ["a", "b"],
    };
    const merged = mergeOutboxPayloadWithRetry(
      original,
      { retryCount: 1, nextRetryAt: "2026-06-01T00:00:00.000Z" }
    );
    (merged.nested as { views: number }).views = 999;
    expect(original.nested.views).toBe(10);
    expect(merged.tags).toEqual(["a", "b"]);
    expect(merged.postId).toBe("p1");
  });
});
