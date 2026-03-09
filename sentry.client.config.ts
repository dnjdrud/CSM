/**
 * Sentry client-side (browser) initialization.
 * DSN and environment from env: SENTRY_DSN, SENTRY_ENVIRONMENT.
 */
import * as Sentry from "@sentry/nextjs";

// Client bundle: must use NEXT_PUBLIC_ for DSN to be available in browser
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
const environment = process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV;

Sentry.init({
  dsn,
  environment: environment ?? "production",
  enabled: Boolean(dsn),
  tracesSampleRate: 0.1,
  ignoreErrors: [
    "Invalid Refresh Token: Already Used",
    /refresh_token_already_used/,
  ],
});
