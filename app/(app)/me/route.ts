import { NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth/session";

export async function GET(request: Request) {
  const userId = await getAuthUserId();
  const base = new URL(request.url).origin;
  return NextResponse.redirect(
    new URL(userId ? `/profile/${userId}` : "/login", base)
  );
}
