import "server-only";
import type { ParentRole } from "@/lib/roles";

/**
 * All secrets come from server environment variables only.
 * Nothing here may be imported by a client component (enforced by server-only).
 * Values are read on each call so tests and restarts pick up changes.
 */

const DIGITS = /^\d+$/;
export const MIN_SESSION_SECRET_LENGTH = 32;
export const MIN_ADMIN_PASSWORD_LENGTH = 10; // owner decision: keep the current 11-character password

export function getSessionSecret(): string | null {
  const s = process.env.SESSION_SECRET ?? "";
  return s.length >= MIN_SESSION_SECRET_LENGTH ? s : null;
}

/**
 * Parent passwords are numeric codes:
 *  - father: 8 digits (configured via FATHER_PASSWORD)
 *  - mother: 4 digits (configured via MOTHER_PASSWORD)
 * Returns null when unset or malformed -> "setup required" state.
 */
const EXPECTED_LENGTH: Record<ParentRole, number> = { father: 8, mother: 4 };

export function getParentPassword(role: ParentRole): string | null {
  const raw = (role === "father" ? process.env.FATHER_PASSWORD : process.env.MOTHER_PASSWORD) ?? "";
  const value = raw.trim();
  if (!DIGITS.test(value) || value.length !== EXPECTED_LENGTH[role]) return null;
  return value;
}

export function getAdminPassword(): string | null {
  const value = process.env.ADMIN_PASSWORD ?? "";
  return value.length >= MIN_ADMIN_PASSWORD_LENGTH ? value : null;
}

export function isParentConfigured(role: ParentRole): boolean {
  return getSessionSecret() !== null && getParentPassword(role) !== null;
}

export function isAdminConfigured(): boolean {
  return getSessionSecret() !== null && getAdminPassword() !== null;
}

/** Optional explicit origin (e.g. https://family.example) used for write-request checks. */
export function getConfiguredOrigin(): string | null {
  const v = process.env.APP_ORIGIN?.trim();
  return v ? v.replace(/\/+$/, "") : null;
}

export const isProduction = () => process.env.NODE_ENV === "production";
