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
    // browser client should be as dumb as possible.  Cookie management is
    // handled entirely on the server/middleware side; we don't want the SDK to
    // write to localStorage, refresh tokens, or clear cookies under any
    // circumstance.  To that end we:
    //   * disable all persistence and auto‑refresh behavior
    //   * supply a no‑op storage object so nothing is ever stored locally
    //   * stub out `signOut()`/`removeSession()` to prevent accidental cookie
    //     deletion when the library encounters a 401
    browserClient = createBrowserClient(u, k, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
        // storage adapter is intentionally a no‑op.  supabase-js exports a
        // SupportedStorage type but importing it here creates a circular
        // dependency; casting to `any` is simpler and safe since we control the
        // implementation.
        storage: ( {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        } as any ),
      },
    });

    // patch the auth object so the SDK behaves strictly passive
    const supabaseAuth = browserClient.auth as any;
    const noop = async () => ({ data: null, error: null });

    // prevent any client-side call from clearing the cookie or refreshing
    supabaseAuth.signOut = noop;
    supabaseAuth.refreshSession = async () => {
      try {
        return await supabaseAuth.refreshSession();
      } catch (e) {
        return { data: { session: null, user: null }, error: null };
      }
    };
    // internal helpers sometimes call _callRefreshToken directly when a 401 is
    // received; stub it so the library never attempts to hit the network.
    if (typeof supabaseAuth._callRefreshToken === "function") {
      supabaseAuth._callRefreshToken = async (): Promise<{ data: any; error: any }> => {
        return { data: null, error: null };
      };
    }
    // some internal code uses _removeSession; stub that too just in case
    if (typeof supabaseAuth._removeSession === "function") {
      supabaseAuth._removeSession = (): void => {
        // do nothing, cookies are server‑owned
      };
    }

    // suppress the noisy "Invalid Refresh Token: Already Used" warning
    const origWarn = console.warn;
    console.warn = (...args: unknown[]) => {
      if (typeof args[0] === "string" &&
          args[0].includes("Invalid Refresh Token: Already Used")) {
        return;
      }
      origWarn.apply(console, args);
    };

    // drop TOKEN_REFRESHED events since they arrive after the server already
    // rotated cookies and would otherwise trigger the client to re‑read them
    const realOn = supabaseAuth.onAuthStateChange.bind(supabaseAuth);
    supabaseAuth.onAuthStateChange = (handler: any) => {
      return realOn((event: string, session: any) => {
        if (event === "TOKEN_REFRESHED") return;
        handler(event, session);
      });
    };
  }
  return browserClient;
}
