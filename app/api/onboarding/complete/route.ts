/**
 * POST /api/onboarding/complete
 * For admin bootstrap (skipInviteCode): creates public.users with role ADMIN.
 * Returns JSON so client can navigate to /feed with full page load.
 */
import { NextResponse } from "next/server";
import { getAuthUserId, getAuthUserEmail } from "@/lib/auth/session";
import { canSkipInviteForOnboarding } from "@/lib/admin/bootstrap";
import { createAdminProfileForOnboarding } from "@/lib/data/signupRepository";

export async function POST(request: Request) {
  try {
    const authUserId = await getAuthUserId();
    const authEmail = await getAuthUserEmail();
    if (!authUserId || !authEmail || !canSkipInviteForOnboarding(authEmail)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const name = (formData.get("name") as string)?.trim() || "Admin";
    const bio = (formData.get("bio") as string)?.trim() || undefined;
    const affiliation = (formData.get("affiliation") as string)?.trim() || undefined;

    const result = await createAdminProfileForOnboarding(authUserId, { name, bio, affiliation });
    if ("error" in result) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
