import { NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth/session";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  const { data, error } = await admin
    .from("users")
    .select("candle_balance")
    .eq("id", userId)
    .single();

  if (error) {
    return NextResponse.json({ error: "잔액 조회에 실패했습니다." }, { status: 500 });
  }

  return NextResponse.json({ balance: data?.candle_balance ?? 0 });
}
