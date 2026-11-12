"use client";

import { useEffect } from "react";
import { vaultKey } from "@/lib/vault";

/**
 * Page-lifecycle guard for the personal-password key and any decrypted text.
 *  - Binds the in-tab key to the current login (server-derived scope). A different
 *    parent, a new login or logging out wipes it.
 *  - pagehide (leaving, closing, entering the back/forward cache): wipe the key and blank
 *    the page synchronously, so a restored snapshot never shows decrypted text.
 *  - pageshow from the back/forward cache: reload, which re-checks the login on the
 *    server and starts locked (or goes to the login screen).
 */
export function VaultGuard({ scope }: { scope: string | null }) {
  useEffect(() => {
    vaultKey.bindScope(scope);
  }, [scope]);

  useEffect(() => {
    const onHide = () => {
      vaultKey.wipe();
      document.documentElement.setAttribute("data-wiped", "");
    };
    const onShow = (e: PageTransitionEvent) => {
      if (!e.persisted) return;
      document.documentElement.setAttribute("data-wiped", "");
      vaultKey.wipe();
      window.location.reload();
    };
    window.addEventListener("pagehide", onHide);
    window.addEventListener("pageshow", onShow);
    return () => {
      window.removeEventListener("pagehide", onHide);
      window.removeEventListener("pageshow", onShow);
    };
  }, []);

  return null;
}
