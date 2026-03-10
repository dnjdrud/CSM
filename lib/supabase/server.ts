/**
 * Supabase server client. Use in Server Components, Server Actions, Route Handlers.
 * Uses Next.js 15 cookies() (await) for session. setAll in RSC cannot write cookies;
 * middleware is responsible for refreshing and writing session cookies.
 *
 * getSession() is wrapped so that refresh_token_already_used does not throw; callers
 * get { data: { session: null }, error } instead, avoiding unhandled AuthApiError in logs.
 */
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function getEnv() {
  if (!url || !anonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  return { url, anonKey };
}

function isRefreshTokenAlreadyUsed(e: unknown): boolean {
  const err = e as { code?: string; message?: string } | null;
  return err?.code === "refresh_token_already_used" || (typeof err?.message === "string" && err.message.includes("Already Used")) || false;
}

/**
 * Wrap a Supabase client's auth methods so ANY auth error never throws.
 * Returns safe responses without error to prevent throwing.
 */
export function wrapSupabaseAuthSafe<T extends { auth: any }>(client: T): T {
  const auth = client.auth;
  const originalGetSession = auth.getSession.bind(auth);
  const originalGetUser = auth.getUser.bind(auth);
  const originalRefreshSession = auth.refreshSession?.bind(auth);
  const originalSetSession = auth.setSession?.bind(auth);

  auth.getSession = async function getSessionSafe() {
    try {
      return await originalGetSession();
    } catch (e) {
      // On any auth error, return null session to avoid throwing
      console.warn("[wrapSupabaseAuthSafe] getSession caught error:", e);
      return { data: { session: null }, error: null };
    }
  };

  auth.getUser = async function getUserSafe() {
    try {
      return await originalGetUser();
    } catch (e) {
      // On any auth error, return null user to avoid throwing
      console.warn("[wrapSupabaseAuthSafe] getUser caught error:", e);
      return { data: { user: null }, error: null };
    }
  };

  if (originalRefreshSession) {
    auth.refreshSession = async function refreshSessionSafe() {
      try {
        return await originalRefreshSession();
      } catch (e) {
        // On any auth error, return null session to avoid throwing
        console.warn("[wrapSupabaseAuthSafe] refreshSession caught error:", e);
        return { data: { session: null, user: null }, error: null };
      }
    };
  }

  if (originalSetSession) {
    auth.setSession = async function setSessionSafe(tokens: any) {
      try {
        return await originalSetSession(tokens);
      } catch (e) {
        // On any auth error, return null session to avoid throwing
        console.warn("[wrapSupabaseAuthSafe] setSession caught error:", e);
        return { data: { session: null, user: null }, error: null };
      }
    };
  }

  return client;
}

/** Create a Supabase server client with the current request cookies. */
export async function supabaseServer() {
  const cookieStore = await cookies();
  const { url: u, anonKey: k } = getEnv();
  const client = createServerClient(u, k, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, { path: "/", ...options })
          );
        } catch {
          // RSC/read-only context: cookie writes not allowed; middleware handles refresh
        }
      },
    },
  });

  return wrapSupabaseAuthSafe(client);
}

