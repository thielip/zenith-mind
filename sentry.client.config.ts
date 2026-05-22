import * as Sentry from "@sentry/nextjs";
import { getSentryDsn, isSentryEnabled } from "@/lib/sentry/dsn";

/** Cloudflare 公開站不載入瀏覽器 SDK（伺服器端仍可由 edge/server config 回報） */
const skipBrowserSdk =
  process.env["CF_WORKER_RUNTIME"] === "1" ||
  process.env["CF_PUBLIC_ONLY"] === "1";

if (!skipBrowserSdk && isSentryEnabled()) {
  Sentry.init({
    dsn: getSentryDsn(),
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 0,
    environment: process.env.NODE_ENV,
  });
}
