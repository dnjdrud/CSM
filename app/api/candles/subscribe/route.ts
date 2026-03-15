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
  if (subscriberId === creatorId) {
    return NextResponse.json({ error: "자신을 구독할 수 없습니다." }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  // Get creator's subscription price
  const { data: creator, error: creatorErr } = await admin
    .from("users")
    .select("subscription_candles_per_month, name")
    .eq("id", creatorId)
    .single();

  if (creatorErr || !creator) {
    return NextResponse.json({ error: "크리에이터를 찾을 수 없습니다." }, { status: 404 });
  }

  const cost = creator.subscription_candles_per_month;
  if (!cost || cost < 5) {
    return NextResponse.json(
      { error: "이 크리에이터는 유료 구독을 지원하지 않습니다." },
      { status: 400 }
    );
  }

  // Get subscriber's candle balance
  const { data: subscriber, error: subErr } = await admin
    .from("users")
    .select("candle_balance")
    .eq("id", subscriberId)
    .single();

  if (subErr || !subscriber) {
    return NextResponse.json({ error: "사용자 정보를 찾을 수 없습니다." }, { status: 404 });
  }

  if (subscriber.candle_balance < cost) {
    return NextResponse.json(
      {
        error: "캔들이 부족합니다.",
        required: cost,
        balance: subscriber.candle_balance,
      },
      { status: 402 }
    );
  }

  const newBalance = subscriber.candle_balance - cost;
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  // Deduct candles
  const { error: balanceErr } = await admin
    .from("users")
    .update({ candle_balance: newBalance })
    .eq("id", subscriberId)
    .eq("candle_balance", subscriber.candle_balance); // optimistic concurrency

  if (balanceErr) {
    return NextResponse.json({ error: "잔액 처리 중 오류가 발생했습니다." }, { status: 500 });
  }

  // Upsert subscription
  const { data: existing } = await admin
    .from("subscriptions")
    .select("id")
    .eq("subscriber_id", subscriberId)
    .eq("creator_id", creatorId)
    .maybeSingle();

  let subscriptionId: string;

  if (existing) {
    await admin
      .from("subscriptions")
      .update({
        status: "active",
        expires_at: expiresAt,
        candles_paid: cost,
        renewed_at: new Date().toISOString(),
        plan: "supporter",
      })
      .eq("id", existing.id);
    subscriptionId = existing.id;
  } else {
    const { data: inserted } = await admin
      .from("subscriptions")
      .insert({
        subscriber_id: subscriberId,
        creator_id: creatorId,
        status: "active",
        expires_at: expiresAt,
        candles_paid: cost,
        plan: "supporter",
      })
      .select("id")
      .single();
    subscriptionId = inserted?.id ?? "";
  }

  // Record candle transaction
  await admin.from("candle_transactions").insert({
    user_id: subscriberId,
    delta: -cost,
    balance_after: newBalance,
    kind: "subscribe",
    ref_id: subscriptionId || null,
    note: `${creator.name} 구독 (30일)`,
  });

  return NextResponse.json({ ok: true, newBalance, expiresAt });
}
