"use client";

import { useState, useEffect } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

/**
 * Client-side auth session from createBrowserClient.
 * Use in Client Components so comment/reaction UI sees session even when SSR passed null.
 * Initial: getUser(); updates: onAuthStateChange.
 */
export function useClientSession(): { user: User | null; userId: string | null } {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const supabase = supabaseBrowser();

    const load = async () => {
      // Use getSession() NOT getUser(). getUser() makes a network call and if
      // Supabase returns a 401, the browser client calls signOut() which clears
      // all session cookies — breaking subsequent server-side auth checks.
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
      } catch {
        setUser(null);
      }
    };

    load();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: string, session: Session | null) => {
      // The browser SDK will emit a `SIGNED_OUT` event when it attempts a
      // refresh and the refresh token is invalid.  That action also clears
      // all session cookies, which is problematic because our server logic has
      // more robust handling (see `middleware.ts` and `session.ts`).  On mobile
      // the client never forces a sign‑out when the refresh fails, so the UI
      // stays stable until the next network request.  We mirror that behaviour
      // by ignoring the `SIGNED_OUT` event here; the server will still redirect
      // unauthenticated requests properly, but the user won't see an
      // unnecessary flash of the logged‑out state.
      if (event === "SIGNED_OUT") {
        return;
      }
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, userId: user?.id ?? null };
}
