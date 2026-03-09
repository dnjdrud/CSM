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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: string, session: Session | null) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, userId: user?.id ?? null };
}
