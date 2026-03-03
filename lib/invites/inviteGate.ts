/**
 * Invite gate: cookie helpers and shared gate logic.
 * Cookie stores invite code between magic-link request and profile creation.
 */

import { cookies } from "next/headers";

export const COOKIE_NAME = "csm_invite_code";
const MAX_AGE_SECONDS = 30 * 60; // 30 minutes

export async function setInviteCookie(code: string): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, code.trim(), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function getInviteCookie(): Promise<string | undefined> {
  const store = await cookies();
  const c = store.get(COOKIE_NAME);
  const value = c?.value?.trim();
  return value && value.length > 0 ? value : undefined;
}

export async function clearInviteCookie(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}
