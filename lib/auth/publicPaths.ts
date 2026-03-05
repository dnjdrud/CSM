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
  "/request-access",
  "/auth/complete",
  "/login",
  "/auth/callback",
  "/api/onboarding/complete",
] as const;
