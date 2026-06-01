export type WithRetryOptions = {
  /** 含第一次嘗試在內的最大次數 */
  maxAttempts?: number;
  /** 首次退避毫秒（指數倍增） */
  baseDelayMs?: number;
  maxDelayMs?: number;
  /** 請求中止時立即停止重試與 sleep（例如 Next.js request.signal） */
  signal?: AbortSignal;
  /** 額外可重試的 HTTP 狀態碼 */
  retryStatusCodes?: number[];
  /** 自訂是否可重試（回傳 true 則重試） */
  isRetryable?: (error: unknown) => boolean;
  onRetry?: (info: { attempt: number; delayMs: number; error: unknown }) => void;
};

const DEFAULT_RETRY_STATUS = [429, 500, 502, 503, 504];

export class RetryAbortedError extends Error {
  constructor(message = "Retry aborted") {
    super(message);
    this.name = "RetryAbortedError";
  }
}

function throwIfAborted(signal?: AbortSignal): void {
  if (!signal?.aborted) return;
  throw signal.reason instanceof Error
    ? signal.reason
    : new RetryAbortedError();
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  throwIfAborted(signal);
  return new Promise((resolve, reject) => {
    if (!signal) {
      setTimeout(resolve, ms);
      return;
    }
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      signal.removeEventListener("abort", onAbort);
      reject(
        signal.reason instanceof Error
          ? signal.reason
          : new RetryAbortedError()
      );
    };
    signal.addEventListener("abort", onAbort);
  });
}

function getHttpStatus(error: unknown): number | undefined {
  if (!error || typeof error !== "object") return undefined;
  const o = error as Record<string, unknown>;
  if (typeof o.status === "number") return o.status;
  if (typeof o.code === "number") return o.code;
  const response = o.response;
  if (response && typeof response === "object") {
    const status = (response as { status?: number }).status;
    if (typeof status === "number") return status;
  }
  return undefined;
}

function isRateLimitError(error: unknown): boolean {
  const status = getHttpStatus(error);
  if (status === 429) return true;
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "";
  return /quota|rate limit|too many requests|resource exhausted/i.test(message);
}

function defaultIsRetryable(error: unknown, codes: number[]): boolean {
  if (isRateLimitError(error)) return true;
  const status = getHttpStatus(error);
  if (status !== undefined && codes.includes(status)) return true;
  const message = error instanceof Error ? error.message : String(error);
  return /ECONNRESET|ETIMEDOUT|ENOTFOUND|socket hang up|EAI_AGAIN/i.test(
    message
  );
}

function backoffDelayMs(
  attempt: number,
  baseDelayMs: number,
  maxDelayMs: number,
  error: unknown
): number {
  const exp = Math.min(maxDelayMs, baseDelayMs * 2 ** (attempt - 1));
  const jitter = Math.floor(Math.random() * Math.min(1000, exp * 0.2));
  if (isRateLimitError(error)) {
    return Math.min(maxDelayMs, exp * 2 + jitter);
  }
  return exp + jitter;
}

/** 共用 Google / 外部 API 重試（含 429 指數退避；支援 AbortSignal） */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: WithRetryOptions = {}
): Promise<T> {
  const maxAttempts = options.maxAttempts ?? 4;
  const baseDelayMs = options.baseDelayMs ?? 500;
  const maxDelayMs = options.maxDelayMs ?? 30_000;
  const signal = options.signal;
  const retryStatusCodes = [
    ...DEFAULT_RETRY_STATUS,
    ...(options.retryStatusCodes ?? []),
  ];
  const isRetryable =
    options.isRetryable ??
    ((error: unknown) => defaultIsRetryable(error, retryStatusCodes));

  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    throwIfAborted(signal);
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      throwIfAborted(signal);
      if (attempt >= maxAttempts || !isRetryable(error)) {
        throw error;
      }
      const delayMs = backoffDelayMs(
        attempt,
        baseDelayMs,
        maxDelayMs,
        error
      );
      options.onRetry?.({ attempt, delayMs, error });
      await sleep(delayMs, signal);
    }
  }
  throw lastError;
}
