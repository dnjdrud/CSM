/**
 * Sentry edge runtime initialization.
 * DSN and environment from env: SENTRY_DSN, SENTRY_ENVIRONMENT.
 */
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN;
const environment = process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV;

Sentry.init({
  dsn,
  environment: environment ?? "production",
  enabled: Boolean(dsn),
  tracesSampleRate: 0.1,
});
