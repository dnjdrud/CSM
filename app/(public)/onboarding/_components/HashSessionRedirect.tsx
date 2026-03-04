"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { getTokensFromHash } from "@/lib/auth/parseHashParams";

/**
 * If the URL has Supabase tokens in the hash (#access_token=...), redirect to
 * /auth/callback/session so the session is set and the user is logged in.
 * Used on onboarding when user lands with hash (e.g. after magic link redirected to /onboarding).
 */
export function HashSessionRedirect() {
  const searchParams = useSearchParams();
  const from = searchParams.get("from");
  const nextPath = from && from.startsWith("/") ? from : "/feed";

  useEffect(() => {
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    const { access_token, refresh_token } = getTokensFromHash(hash);
    if (access_token && refresh_token) {
      const path =
        "/auth/callback/session?next=" + encodeURIComponent(nextPath) + hash;
      window.location.replace(path);
    }
  }, [nextPath]);

  return null;
}
