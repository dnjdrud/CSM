"use client";

import { useEffect } from "react";
import { getTokensFromHash } from "@/lib/auth/parseHashParams";

/**
 * If the URL has Supabase tokens in the hash (#access_token=...), redirect to
 * /auth/callback/session so the session is set and the user is logged in.
 * Used on onboarding when user lands with hash (e.g. after magic link redirected to /onboarding).
 * After session is set, we send the user back to /onboarding first; middleware + page
 * will either show the onboarding flow (no profile) or redirect them on to /feed.
 */
export function HashSessionRedirect() {
  useEffect(() => {
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    const { access_token, refresh_token } = getTokensFromHash(hash);
    if (access_token && refresh_token) {
      const path =
        "/auth/callback/session?next=" + encodeURIComponent("/onboarding") + hash;
      window.location.replace(path);
    }
  }, []);

  return null;
}
