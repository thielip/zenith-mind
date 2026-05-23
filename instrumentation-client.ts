// Sentry client（Next.js instrumentation hook；由 Wizard 產生，DSN 改由環境變數讀取）
import * as Sentry from "@sentry/nextjs";
import { getSentryDsn, isSentryEnabled } from "@/lib/sentry/dsn";

if (isSentryEnabled()) {
  const isProd = process.env.NODE_ENV === "production";
  Sentry.init({
    dsn: getSentryDsn(),
    integrations: isProd ? [] : [Sentry.replayIntegration()],
    tracesSampleRate: isProd ? 0.05 : 1,
    enableLogs: !isProd,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: isProd ? 0.1 : 1,
    sendDefaultPii: false,
    environment: process.env.NODE_ENV,
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
