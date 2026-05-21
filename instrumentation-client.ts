// Sentry client（Next.js instrumentation hook；由 Wizard 產生，DSN 改由環境變數讀取）
import * as Sentry from "@sentry/nextjs";
import { getSentryDsn, isSentryEnabled } from "@/lib/sentry/dsn";

if (isSentryEnabled()) {
  Sentry.init({
    dsn: getSentryDsn(),
    integrations: [Sentry.replayIntegration()],
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1,
    enableLogs: true,
    replaysSessionSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1,
    replaysOnErrorSampleRate: 1,
    sendDefaultPii: false,
    environment: process.env.NODE_ENV,
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
