"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase/client";
import { getTokensFromHash, parseHashParams } from "@/lib/auth/parseHashParams";

/**
 * Client-only auth callback page for hash fragment flow.
 * Tokens in URL hash are not sent to the server; this page reads hash, setSession, then redirects.
 * Does not use useSearchParams to avoid suspend and mount delay; reads next from window.location.search in effect.
 */
export default function AuthCallbackSessionPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "done" | "error">("loading");
  const [message, setMessage] = useState<string>("");
  const [nextPath, setNextPath] = useState("/feed");
  const redirectDone = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (typeof window === "undefined") return;
      const hash = window.location.hash || "";
      const search = window.location.search || "";
      const params = new URLSearchParams(search);
      const next = params.get("next") ?? "/feed";
      const safeNext = next.startsWith("/") ? next : "/feed";
      setNextPath(safeNext);

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
          if (redirectDone.current) return;
          redirectDone.current = true;
          setStatus("done");
          setMessage("Redirecting…");
          await new Promise((r) => setTimeout(r, 200));
          if (!cancelled && typeof window !== "undefined") window.location.href = safeNext;
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

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4" aria-live="polite">
      <p className="text-[15px] text-theme-text">{message || "Signing you in…"}</p>
      <p className="mt-4 text-sm text-theme-muted">
        If you are not redirected,{" "}
        <Link href={nextPath} className="text-theme-primary underline hover:no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary focus-visible:ring-offset-2 rounded">
          click here to continue
        </Link>
        .
      </p>
    </div>
  );
}
