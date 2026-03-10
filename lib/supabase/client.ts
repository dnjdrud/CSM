/**
 * Supabase browser client. Use in Client Components only.
 */
import { createBrowserClient } from "@supabase/ssr";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function getEnv() {
  if (!url || !anonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  return { url, anonKey };
}

/** Singleton browser client. */
let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function supabaseBrowser() {
  if (typeof window === "undefined") {
    throw new Error("supabaseBrowser() must be called in the browser");
  }
  if (!browserClient) {
    const { url: u, anonKey: k } = getEnv();
    // when running in a Next.js web app we _do not_ want the browser client to
    // manage its own copy of the session or automatically refresh tokens.  The
    // server (middleware/RSC) already sets and refreshes a secure cookie and
    // the browser component only needs to read that state for UI updates.  The
    // default behavior of `createBrowserClient` is to persist the session in
    // localStorage and to auto‑refresh/auto‑sign‑out on errors; those actions
    // are what cause the web UI to bounce users out when a short network glitch
    // or a stale refresh token error occurs.  Mobile clients use the RN SDK
    // which never clears cookies and handles refresh more gracefully, so we
    // match that behaviour by turning off persistence and auto‑refresh here.
    browserClient = createBrowserClient(u, k, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  }
  return browserClient;
}
