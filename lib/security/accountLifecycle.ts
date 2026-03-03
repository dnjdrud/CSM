/**
 * Account lifecycle: soft deactivation and restore within 7 days.
 */

export const RESTORE_DAYS = 7;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * True if deactivated_at is set and within the restore window (7 days).
 */
export function canRestore(deactivatedAt: string | null | undefined): boolean {
  if (!deactivatedAt) return false;
  const at = new Date(deactivatedAt).getTime();
  const cutoff = Date.now() - RESTORE_DAYS * MS_PER_DAY;
  return at > cutoff;
}
