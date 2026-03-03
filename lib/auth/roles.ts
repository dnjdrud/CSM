/**
 * Role-based helpers for auth and access control.
 */
import type { User } from "@/lib/domain/types";

export function isAdmin(user: User | null): boolean {
  return user?.role === "ADMIN";
}

export function isMissionary(user: User | null): boolean {
  return user?.role === "MISSIONARY";
}

/** Whether the user can access admin-only routes/actions. */
export function canAccessAdmin(user: User | null): boolean {
  return isAdmin(user);
}
