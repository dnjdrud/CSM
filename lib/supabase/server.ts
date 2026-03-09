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
 * Wrap a Supabase client's auth.getSession and auth.getUser so refresh_token_already_used
 * never throws (returns { data: { session/user: null }, error } instead). Use for any
 * client created with createServerClient outside supabaseServer() (e.g. route handlers).
 */
export function wrapSupabaseAuthSafe<T extends { auth: { getSession: () => Promise<unknown>; getUser: () => Promise<unknown> } }>(client: T): T {
  type SessionResponse = Awaited<ReturnType<typeof client.auth.getSession>>;
  type UserResponse = Awaited<ReturnType<typeof client.auth.getUser>>;
  const originalGetSession = client.auth.getSession.bind(client.auth);
  const originalGetUser = client.auth.getUser.bind(client.auth);
  client.auth.getSession = async function getSessionSafe(): Promise<SessionResponse> {
    try {
      return await originalGetSession();
    } catch (e) {
      if (isRefreshTokenAlreadyUsed(e)) return { data: { session: null }, error: e } as SessionResponse;
      throw e;
    }
  };
  client.auth.getUser = async function getUserSafe(): Promise<UserResponse> {
    try {
      return await originalGetUser();
    } catch (e) {
      if (isRefreshTokenAlreadyUsed(e)) return { data: { user: null }, error: e } as UserResponse;
      throw e;
    }
  };
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

