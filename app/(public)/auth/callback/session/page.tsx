"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { getTokensFromHash, parseHashParams } from "@/lib/auth/parseHashParams";

/**
 * Client-only auth callback page for hash fragment flow.
 * Tokens in URL hash are not sent to the server; this page reads hash, setSession, then redirects.
 * Use redirect URL https://yoursite.com/auth/callback/session for Supabase magic link / implicit flow.
 * Supports ?next=/path for post-login redirect (default /feed).
 */
export default function AuthCallbackSessionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") ?? "/feed";
  const safeNext = nextPath.startsWith("/") ? nextPath : "/feed";
  const [status, setStatus] = useState<"loading" | "done" | "error">("loading");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const hash = typeof window !== "undefined" ? window.location.hash : "";
      const { access_token, refresh_token, error: hashError, error_description } = getTokensFromHash(hash);
      const allHash = parseHashParams(hash);
      const errorCode = allHash.error_code ?? null;

      if (hashError) {
        if (!cancelled) {
          setStatus("error");
          setMessage(hashError + (error_description ? ": " + error_description : ""));
        }
        const redirectTo = new URL("/onboarding", window.location.origin);
        redirectTo.searchParams.set("error", hashError);
        if (error_description) redirectTo.searchParams.set("error_description", error_description);
        if (errorCode) redirectTo.searchParams.set("error_code", errorCode);
        router.replace(redirectTo.pathname + redirectTo.search);
        return;
      }

      if (access_token && refresh_token) {
        try {
          const supabase = supabaseBrowser();
          const { error } = await supabase.auth.setSession({ access_token, refresh_token });
          if (cancelled) return;
          if (error) {
            setStatus("error");
            setMessage(error.message);
            const redirectTo = new URL("/onboarding", window.location.origin);
            redirectTo.searchParams.set("error", "auth_callback_failed");
            router.replace(redirectTo.pathname + redirectTo.search);
            return;
          }
          setStatus("done");
          // Full page navigation so the next request includes the new session cookies.
          window.location.replace(safeNext);
          return;
        } catch (e) {
          if (!cancelled) {
            setStatus("error");
            setMessage(e instanceof Error ? e.message : "Sign-in failed");
          }
          const redirectTo = new URL("/onboarding", window.location.origin);
          redirectTo.searchParams.set("error", "auth_callback_failed");
          router.replace(redirectTo.pathname + redirectTo.search);
          return;
        }
      }

      if (!cancelled) setStatus("done");
      router.replace("/onboarding");
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (status === "error") {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4">
        <p className="text-[15px] text-gray-600" aria-live="polite">{message}</p>
        <p className="mt-2 text-sm text-red-600">You can try again from the sign-in page.</p>
      </div>
    );
  }
  return null;
}
