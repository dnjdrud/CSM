/**
 * Paths that do not require authentication.
 * Used by middleware to allow unauthenticated access.
 */
export const PUBLIC_PATHS = [
  "/",
  "/principles",
  "/privacy",
  "/terms",
  "/contact",
  "/onboarding",
  "/onboarding/complete",
  "/login",
  "/auth/callback",
  "/api/onboarding/complete",
  "/api/onboarding/bypass",
] as const;
