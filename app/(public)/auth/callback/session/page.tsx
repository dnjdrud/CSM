"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase/client";
import { getTokensFromHash, parseHashParams } from "@/lib/auth/parseHashParams";

/**
 * Client-only auth callback page.
 * Handles two flows:
 * 1. Query params: ?token_hash=...&type=... → verifyOtp in browser,
 *    then POST /api/auth/set-session to write server-side HttpOnly cookies.
 * 2. Hash fragment: #access_token=...&refresh_token=... → setSession,
 *    then POST /api/auth/set-session to write server-side HttpOnly cookies.
 * Using a server endpoint for final cookie-writing ensures middleware can read the session.
 */
export default function AuthCallbackSessionPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "done" | "error">("loading");
  const [message, setMessage] = useState<string>("");
  const [nextPath, setNextPath] = useState("/feed");
  const redirectDone = useRef(false);

  useEffect(() => {
    let cancelled = false;

    /** Full-page form POST so server responds with 302 + Set-Cookie; browser then follows redirect with cookies. */
    function submitSessionForm(access_token: string, refresh_token: string, nextPath: string) {
      const form = document.createElement("form");
      form.method = "POST";
      form.action = "/api/auth/set-session-redirect?next=" + encodeURIComponent(nextPath);
      form.style.display = "none";
      const a = document.createElement("input");
      a.name = "access_token";
      a.value = access_token;
      a.type = "hidden";
      form.appendChild(a);
      const r = document.createElement("input");
      r.name = "refresh_token";
      r.value = refresh_token;
      r.type = "hidden";
      form.appendChild(r);
      document.body.appendChild(form);
      form.submit();
    }

    async function run() {
      if (typeof window === "undefined") return;
      const hash = window.location.hash || "";
      const search = window.location.search || "";
      const params = new URLSearchParams(search);
      const next = params.get("next") ?? "/feed";
      const safeNext = next.startsWith("/") ? next : "/feed";
      setNextPath(safeNext);

      const supabase = supabaseBrowser();

      // Flow 1: token_hash + type in query params (magic link from email)
      const tokenHash = params.get("token_hash");
      const type = params.get("type");
      if (tokenHash && type) {
        try {
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type as "magiclink" | "email",
          });
          if (cancelled) return;
          if (error || !data.user || !data.session) {
            setStatus("error");
            setMessage(error?.message ?? "Sign-in failed. The link may have expired.");
            setTimeout(() => router.replace("/login?message=link_expired"), 2000);
            return;
          }
          if (redirectDone.current) return;
          redirectDone.current = true;
          setStatus("done");
          setMessage("Redirecting…");
          submitSessionForm(data.session.access_token, data.session.refresh_token, safeNext);
          return;
        } catch (e) {
          if (!cancelled) {
            setStatus("error");
            setMessage(e instanceof Error ? e.message : "Sign-in failed");
          }
          setTimeout(() => router.replace("/login"), 1500);
          return;
        }
      }

      // Flow 2: hash fragment — #access_token=...&refresh_token=...
      const { access_token, refresh_token, error: hashError, error_description } = getTokensFromHash(hash);
      const allHash = parseHashParams(hash);
      const errorCode = allHash.error_code ?? null;

      if (hashError) {
        if (!cancelled) {
          setStatus("error");
          setMessage(hashError + (error_description ? ": " + error_description : ""));
        }
        const redirectTo = new URL("/login", window.location.origin);
        redirectTo.searchParams.set("error", hashError);
        if (error_description) redirectTo.searchParams.set("error_description", error_description);
        if (errorCode) redirectTo.searchParams.set("error_code", errorCode);
        router.replace(redirectTo.pathname + redirectTo.search);
        return;
      }

      if (access_token && refresh_token) {
        if (redirectDone.current) return;
        redirectDone.current = true;
        setStatus("done");
        setMessage("Redirecting…");
        submitSessionForm(access_token, refresh_token, safeNext);
        return;
      }

      // No usable params
      if (!cancelled) setStatus("done");
      router.replace("/login");
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
