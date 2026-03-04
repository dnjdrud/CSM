/**
 * Feature flags. Admin-approval signup only (no invite codes).
 */

/** Feature flags for app features (e.g. realtime). */
export const FEATURES = {
  REALTIME_NOTIFICATIONS: process.env.NEXT_PUBLIC_REALTIME_NOTIFICATIONS === "true",
} as const;
