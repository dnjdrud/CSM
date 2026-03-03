/**
 * Sentry helper wrappers. Re-export or wrap Sentry for consistent usage.
 * Use Sentry.captureException / captureMessage in app code as needed.
 */
export { captureException, captureMessage } from "@sentry/nextjs";
