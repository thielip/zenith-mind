export type RateLimitBackend = "redis" | "memory" | "deny";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  backend: RateLimitBackend;
}

type MemoryEntry = {
  timestamps: number[];
};

/** 程序內滑動視窗（Redis 故障時降級；Edge isolate 各自計數） */
const store = new Map<string, MemoryEntry>();
const MAX_KEYS = 10_000;

function pruneStore(now: number, windowMs: number): void {
  if (store.size <= MAX_KEYS) return;
  const cutoff = now - windowMs;
  for (const [key, entry] of store) {
    entry.timestamps = entry.timestamps.filter((t) => t > cutoff);
    if (entry.timestamps.length === 0) store.delete(key);
  }
  if (store.size > MAX_KEYS) {
    const drop = store.size - MAX_KEYS;
    let i = 0;
    for (const key of store.keys()) {
      store.delete(key);
      if (++i >= drop) break;
    }
  }
}

/**
 * 滑動視窗限流（記憶體）
 * @param windowMs 視窗長度（毫秒）
 */
export function checkMemoryRateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const windowStart = now - windowMs;

  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

  entry.timestamps = entry.timestamps.filter((t) => t > windowStart);

  if (entry.timestamps.length >= limit) {
    pruneStore(now, windowMs);
    return { allowed: false, remaining: 0, backend: "memory" };
  }

  entry.timestamps.push(now);
  pruneStore(now, windowMs);

  return {
    allowed: true,
    remaining: Math.max(0, limit - entry.timestamps.length),
    backend: "memory",
  };
}

/** 測試用：清空記憶體桶 */
export function resetMemoryRateLimitStore(): void {
  store.clear();
}

const counterStore = new Map<string, MemoryEntry>();

/** 遞增計數（滑動視窗內累計） */
export function incrementMemoryRateLimitCounter(
  key: string,
  windowMs: number
): number {
  const now = Date.now();
  const windowStart = now - windowMs;
  let entry = counterStore.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    counterStore.set(key, entry);
  }
  entry.timestamps = entry.timestamps.filter((t) => t > windowStart);
  entry.timestamps.push(now);
  return entry.timestamps.length;
}

export function resetMemoryRateLimitCounterStore(): void {
  counterStore.clear();
}
