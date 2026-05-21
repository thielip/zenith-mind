import * as Sentry from "@sentry/nextjs";
import { getSentryDsn, isSentryEnabled } from "@/lib/sentry/dsn";

if (isSentryEnabled()) {
  Sentry.init({
    dsn: getSentryDsn(),
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 0,
    environment: process.env.NODE_ENV,
  });
}
