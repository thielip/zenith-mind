/** 輕量 redirect 日誌（僅 console，方便本機除錯） */

const PREFIX = "[redirect]";

export function logRedirectHit(from: string, to: string, status: number): void {
  if (process.env["NODE_ENV"] === "development") {
    console.warn(`${PREFIX} hit`, { from, to, status });
  }
}

export function logRedirectMiss(pathname: string): void {
  if (process.env["NODE_ENV"] === "development") {
    console.warn(`${PREFIX} miss`, { pathname });
  }
}

export function logRedirectWarn(
  message: string,
  detail?: Record<string, unknown>
): void {
  console.warn(`${PREFIX} ${message}`, detail ?? "");
}

export function logRedirectError(
  message: string,
  error: unknown,
  detail?: Record<string, unknown>
): void {
  console.error(`${PREFIX} ${message}`, { ...detail, error });
}
