/**
 * Minimal admin signals for "something broke today".
 * Placeholder counts; can be wired to Sentry API or system_logs later.
 */

export interface AdminSignals {
  /** Errors recorded today (e.g. from system_logs or Sentry). Placeholder: 0 until wired. */
  todayErrors: number;
  /** Notify edge function failures (placeholder: 0 until wired to logs/metrics). */
  notifyFailuresToday: number;
}

/**
 * Returns placeholder counts for admin dashboard.
 * Wire to system_logs (level=ERROR, created_at today) or Sentry Issues API when ready.
 */
export async function getAdminSignals(): Promise<AdminSignals> {
  return {
    todayErrors: 0,
    notifyFailuresToday: 0,
  };
}
