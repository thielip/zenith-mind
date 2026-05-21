/** Sentry DSN：優先 server SENTRY_DSN，其次公開 NEXT_PUBLIC_SENTRY_DSN */
export function getSentryDsn(): string | undefined {
  const server = process.env["SENTRY_DSN"]?.trim();
  if (server) return server;
  return process.env["NEXT_PUBLIC_SENTRY_DSN"]?.trim() || undefined;
}

export function isSentryEnabled(): boolean {
  return Boolean(getSentryDsn());
}
