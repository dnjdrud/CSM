import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";

/** Dev-only: returns authUserId, profileId, role. Production returns 404. */
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return new NextResponse(null, { status: 404 });
  }
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ authUserId: null, profileId: null, role: null });
  }
  return NextResponse.json({
    authUserId: session.userId,
    profileId: session.userId,
    role: session.role,
  });
}