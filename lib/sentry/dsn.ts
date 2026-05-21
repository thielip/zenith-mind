/** Sentry DSN：優先 server SENTRY_DSN，其次公開 NEXT_PUBLIC_SENTRY_DSN */
export function getSentryDsn(): string | undefined {
  const server = process.env["SENTRY_DSN"]?.trim();
  if (server) return server;
  return process.env["NEXT_PUBLIC_SENTRY_DSN"]?.trim() || undefined;
}

export function isSentryEnabled(): boolean {
  return Boolean(getSentryDsn());
}

let sentryWarned = false;

/** 開發／建置時提示 DSN 未設定（避免靜默失效） */
export function warnIfSentryDisabled(context: string): void {
  if (sentryWarned || isSentryEnabled()) return;
  sentryWarned = true;
  console.warn(
    `[sentry] ${context}: SENTRY_DSN / NEXT_PUBLIC_SENTRY_DSN 未設定，錯誤監控已停用`
  );
}
