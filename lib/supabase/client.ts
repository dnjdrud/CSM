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
    browserClient = createBrowserClient(u, k);
  }
  return browserClient;
}
