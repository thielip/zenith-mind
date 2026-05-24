// Sentry 瀏覽器端（Next.js instrumentation-client 慣例；勿再使用 sentry.client.config.ts）
import * as Sentry from "@sentry/nextjs";
import { getSentryDsn, isSentryEnabled } from "@/lib/sentry/dsn";

/** Cloudflare 公開站不載入瀏覽器 SDK */
const skipBrowserSdk =
  process.env["CF_WORKER_RUNTIME"] === "1" ||
  process.env["CF_PUBLIC_ONLY"] === "1";

if (!skipBrowserSdk && isSentryEnabled()) {
  const isProd = process.env.NODE_ENV === "production";
  Sentry.init({
    dsn: getSentryDsn(),
    integrations: isProd ? [] : [Sentry.replayIntegration()],
    tracesSampleRate: isProd ? 0.1 : 1,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: isProd ? 0.1 : 0,
    enableLogs: !isProd,
    sendDefaultPii: false,
    environment: process.env.NODE_ENV,
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
