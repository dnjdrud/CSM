/**
 * GET /api/onboarding/bypass?next=/feed
 * For allowlisted emails: ensure public.users profile exists, then 302 to next (default /feed).
 * Prevents bypass users from ever seeing the onboarding page.
 */
import { NextResponse } from "next/server";
import { getAuthUserId, getAuthUserEmail } from "@/lib/auth/session";
import { ensureProfileForBypassEmail } from "@/lib/data/userProvisioning";
import { isOnboardingBypassEmail } from "@/lib/auth/bypass";

export async function GET(request: Request) {
  try {
    const authUserId = await getAuthUserId();
    const email = await getAuthUserEmail();
    if (!authUserId || !email || !isOnboardingBypassEmail(email)) {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }
    await ensureProfileForBypassEmail({ userId: authUserId, email });
    const { searchParams } = new URL(request.url);
    const nextPath = searchParams.get("next")?.trim() || "/feed";
    const target = nextPath.startsWith("http") ? nextPath : new URL(nextPath, request.url).pathname;
    return NextResponse.redirect(new URL(target, request.url), 302);
  } catch {
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }
}
