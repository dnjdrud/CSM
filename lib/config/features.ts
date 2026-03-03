/**
 * Feature flags for signup and invite gate.
 * Switch to gradual open signup later via env (OPEN_SIGNUP_PERCENT).
 */

export const INVITE_ONLY = process.env.INVITE_ONLY === "true";
export const OPEN_SIGNUP_PERCENT = Number(process.env.OPEN_SIGNUP_PERCENT ?? "0");

/** Feature flags for app features (e.g. realtime). */
export const FEATURES = {
  REALTIME_NOTIFICATIONS: process.env.NEXT_PUBLIC_REALTIME_NOTIFICATIONS === "true",
} as const;
