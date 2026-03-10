"use client";

import { useState, useEffect } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { getUserIdFromCookies } from "@/lib/auth/cookieSession";

// convert document.cookie string into [{name,value}] array that cookieSession
// utilities expect.  we only need this in the browser so it's safe to read DOM.
function parseDocumentCookies(): Array<{ name: string; value: string }> {
  const pairs: Array<{ name: string; value: string }> = [];
  if (typeof document === "undefined") return pairs;
  document.cookie.split(";").forEach((cookie) => {
    const [rawName, ...rest] = cookie.split("=");
    if (!rawName) return;
    const name = rawName.trim();
    const value = rest.join("=").trim();
    pairs.push({ name, value });
  });
  return pairs;
}

/**
 * Lightweight client session hook that never touches the Supabase auth API.
 *
 * We track only the user ID by parsing the JWT from the auth cookie.  This
 * avoids any network requests (which can trigger the SDK to clear cookies)
 * and mirrors the behaviour of the mobile client, which never manages its
 * own session at all.  The hook still listens for onAuthStateChange events
 * so UI can react when other parts of the app intentionally sign out.
 */
export function useClientSession(): { user: User | null; userId: string | null } {
  const [user, setUser] = useState<User | null>(null);

  const refreshFromCookie = () => {
    const cookies = parseDocumentCookies();
    const id = getUserIdFromCookies(cookies, process.env.NEXT_PUBLIC_SUPABASE_URL ?? "");
    if (id) {
      setUser({ id } as User);
    } else {
      setUser(null);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    refreshFromCookie();

    const supabase = supabaseBrowser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: string) => {
      // ignore internal sign‑out events; we only care about the presence of a
      // valid cookie, which we reparse on every event.
      refreshFromCookie();
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, userId: user?.id ?? null };
}
