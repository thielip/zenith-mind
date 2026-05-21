import * as Sentry from "@sentry/nextjs";
import { isSentryEnabled, warnIfSentryDisabled } from "@/lib/sentry/dsn";

export async function register() {
  if (!isSentryEnabled()) {
    warnIfSentryDisabled("instrumentation.register");
    return;
  }

  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;
