/**
 * POST /auth/complete — Complete signup with token, then sign user in and redirect to /feed.
 * Form body: token, password, name, role, church?, bio?, affiliation?, username?
 * Uses service role for completion; anon client for signInWithPassword and cookie set.
 */
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { consumeApprovalTokenAndCreateUser } from "@/lib/data/signupRepository";
import type { UserRole } from "@/lib/domain/types";

const ALLOWED_ROLES: UserRole[] = ["LAY", "MINISTRY_WORKER", "PASTOR", "MISSIONARY", "SEMINARIAN"];

function parseRole(value: string | null): UserRole {
  if (value && ALLOWED_ROLES.includes(value as UserRole)) return value as UserRole;
  return "LAY";
}

export async function POST(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return NextResponse.redirect(
      new URL("/auth/complete?error=" + encodeURIComponent("Server not configured"), request.url)
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.redirect(
      new URL("/auth/complete?error=" + encodeURIComponent("Invalid request"), request.url)
    );
  }

  const token = (formData.get("token") as string)?.trim();
  const password = (formData.get("password") as string)?.trim();
  const name = (formData.get("name") as string)?.trim();

  if (!token || !password || !name) {
    const back = new URL("/auth/complete", request.url);
    if (token) back.searchParams.set("token", token);
    back.searchParams.set("error", encodeURIComponent("Token, password, and name are required."));
    return NextResponse.redirect(back);
  }
  if (password.length < 8) {
    const back = new URL("/auth/complete", request.url);
    back.searchParams.set("token", token);
    back.searchParams.set("error", encodeURIComponent("Password must be at least 8 characters."));
    return NextResponse.redirect(back);
  }

  const result = await consumeApprovalTokenAndCreateUser({
    token,
    password,
    username: (formData.get("username") as string)?.trim() || null,
    name,
    role: parseRole((formData.get("role") as string) || null),
    church: (formData.get("church") as string)?.trim() || null,
    bio: (formData.get("bio") as string)?.trim() || null,
    affiliation: (formData.get("affiliation") as string)?.trim() || null,
  });

  if ("error" in result) {
    const back = new URL("/auth/complete", request.url);
    back.searchParams.set("token", token);
    back.searchParams.set("error", encodeURIComponent(result.error));
    return NextResponse.redirect(back);
  }

  const cookieStore = await cookies();
  const redirectTo = new URL("/feed", request.url);
  const response = NextResponse.redirect(redirectTo);

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name: n, value, options }) =>
          response.cookies.set(n, value, { path: "/", ...options })
        );
      },
    },
  });

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: result.email,
    password,
  });

  if (signInError) {
    console.error("[auth/complete] signInWithPassword after createUser failed", signInError.message);
    const back = new URL("/login", request.url);
    back.searchParams.set("message", "account_created");
    return NextResponse.redirect(back);
  }

  return response;
}
