"use client";

import { useState, useEffect } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

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
      const { data: { user: u } } = await supabase.auth.getUser();
      setUser(u ?? null);
      if (process.env.NODE_ENV !== "production" && u) {
        console.log("[useClientSession] user.id:", u.id);
      }
    };

    load();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, userId: user?.id ?? null };
}
