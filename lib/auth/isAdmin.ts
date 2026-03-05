/**
 * Admin check using getAuthUserEmail() and ADMIN_EMAILS (comma-separated).
 * Reused by admin-only pages and server actions.
 */
import { getAuthUserEmail } from "@/lib/auth/session";

function getAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS;
  if (!raw || typeof raw !== "string") return [];
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/** True if the current auth user's email is in ADMIN_EMAILS. Calls getAuthUserEmail(). */
export async function isAdmin(): Promise<boolean> {
  const email = await getAuthUserEmail();
  if (!email) return false;
  const list = getAdminEmails();
  return list.includes(email.trim().toLowerCase());
}
