// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

/** 本機開發不初始化 Sentry，避免 OTEL/HTTP 棄用警告污染 Next 主控台 */
if (process.env.NODE_ENV === "development") {
  // eslint-disable-next-line no-console
  console.info("[sentry] skipped in development");
} else {
Sentry.init({
  dsn: "https://198b9a36ec16d5cddf7c1efe1b0a1797@o4511428292509696.ingest.us.sentry.io/4511428306993152",

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1,

  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Enable sending user PII (Personally Identifiable Information)
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
  sendDefaultPii: true,
});
}
