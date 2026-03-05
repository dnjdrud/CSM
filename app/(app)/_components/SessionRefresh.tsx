"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/**
 * On mount, calls /api/auth/session-check (sends cookies). If 200, triggers router.refresh()
 * so server components re-render with the same session. Fixes "logged out on next page" when
 * the initial request didn't send cookies but the browser has them.
 */
export function SessionRefresh() {
  const router = useRouter();
  const didRun = useRef(false);

  useEffect(() => {
    if (didRun.current) return;
    didRun.current = true;

    fetch("/api/auth/session-check", { credentials: "same-origin" })
      .then((res) => {
        if (res.ok) {
          router.refresh();
        }
      })
      .catch(() => {});
  }, [router]);

  return null;
}
