/** Outbox 冷路徑重試中繼資料（存於 payload._outboxMeta，免 DB migration） */
export const OUTBOX_META_KEY = "_outboxMeta" as const;

export type OutboxRetryMeta = {
  retryCount: number;
  nextRetryAt: string;
  lastError?: string;
};

export type OutboxPayload = Record<string, unknown> & {
  [OUTBOX_META_KEY]?: OutboxRetryMeta;
};

const MAX_RETRIES = 5;
const BASE_DELAY_MS = 60_000;
const MAX_DELAY_MS = 24 * 60 * 60 * 1000;

function cloneJsonPayload(payload: unknown): Record<string, unknown> {
  if (payload === null || payload === undefined) return {};
  try {
    return structuredClone(payload) as Record<string, unknown>;
  } catch {
    return JSON.parse(JSON.stringify(payload)) as Record<string, unknown>;
  }
}

export function getOutboxRetryMeta(
  payload: unknown
): OutboxRetryMeta | null {
  if (!payload || typeof payload !== "object") return null;
  const meta = (payload as OutboxPayload)[OUTBOX_META_KEY];
  if (!meta || typeof meta !== "object") return null;
  if (typeof meta.retryCount !== "number" || !meta.nextRetryAt) return null;
  return meta;
}

export function isOutboxReadyForProcessing(
  payload: unknown,
  now = new Date()
): boolean {
  const meta = getOutboxRetryMeta(payload);
  if (!meta) return true;
  const at = new Date(meta.nextRetryAt);
  return !Number.isNaN(at.getTime()) && at.getTime() <= now.getTime();
}

export function computeNextOutboxRetry(
  currentRetryCount: number
): { giveUp: true } | { giveUp: false; meta: OutboxRetryMeta } {
  const nextCount = currentRetryCount + 1;
  if (nextCount > MAX_RETRIES) {
    return { giveUp: true };
  }
  const delayMs = Math.min(
    MAX_DELAY_MS,
    BASE_DELAY_MS * 2 ** (nextCount - 1)
  );
  const nextRetryAt = new Date(Date.now() + delayMs).toISOString();
  return {
    giveUp: false,
    meta: { retryCount: nextCount, nextRetryAt },
  };
}

/**
 * 深拷貝整份 payload 後僅覆寫 _outboxMeta，避免 Prisma JSON 更新時遺失巢狀業務欄位。
 */
export function mergeOutboxPayloadWithRetry(
  payload: unknown,
  meta: OutboxRetryMeta,
  lastError?: string
): OutboxPayload {
  const base = cloneJsonPayload(payload);
  base[OUTBOX_META_KEY] = {
    ...meta,
    ...(lastError ? { lastError } : {}),
  };
  return base as OutboxPayload;
}

export function stripOutboxMeta(payload: unknown): Record<string, unknown> {
  const base = cloneJsonPayload(payload);
  delete base[OUTBOX_META_KEY];
  return base;
}
