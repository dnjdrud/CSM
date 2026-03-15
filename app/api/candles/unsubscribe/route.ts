import { NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth/session";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const subscriberId = await getAuthUserId();
  if (!subscriberId) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const body = (await request.json()) as { creatorId?: string };
  const { creatorId } = body;
  if (!creatorId) {
    return NextResponse.json({ error: "creatorId is required" }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  const { error } = await admin
    .from("subscriptions")
    .update({ status: "cancelled" })
    .eq("subscriber_id", subscriberId)
    .eq("creator_id", creatorId)
    .eq("status", "active");

  if (error) {
    return NextResponse.json({ error: "구독 취소에 실패했습니다." }, { status: 500 });
  }

  // Note: 캔들 환불 없음 (이미 사용된 캔들)
  return NextResponse.json({ ok: true });
}
