/**
 * Admin check by email. Uses ADMIN_EMAILS (comma-separated) from env.
 * Re-exports logic from lib/admin/bootstrap for use in auth-scoped code.
 */
import { isAdminEmail } from "@/lib/admin/bootstrap";

/** True if the given email is in ADMIN_EMAILS allowlist (case-insensitive). */
export function isAdmin(email: string | null | undefined): boolean {
  return isAdminEmail(email);
}
