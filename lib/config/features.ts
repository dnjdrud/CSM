/**
 * Feature flags. Admin-approval signup only (no invite codes).
 */

/** Feature flags for app features (e.g. realtime). */
export const FEATURES = {
  REALTIME_NOTIFICATIONS: process.env.NEXT_PUBLIC_REALTIME_NOTIFICATIONS === "true",
  REALTIME_COMMENTS: process.env.NEXT_PUBLIC_REALTIME_COMMENTS === "true",
  AVATAR_UPLOAD: process.env.NEXT_PUBLIC_AVATAR_UPLOAD === "true",
} as const;
