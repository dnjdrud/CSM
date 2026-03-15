import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: "Missing signature or webhook secret" }, { status: 400 });
  }

  const stripe = getStripe();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[stripe/webhook] Signature verification failed:", msg);
    return NextResponse.json({ error: `Webhook Error: ${msg}` }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const { userId, purchaseId, candles: candlesStr } = session.metadata ?? {};

      if (!userId || !purchaseId || !candlesStr) {
        console.warn("[stripe/webhook] Missing metadata on checkout.session.completed", session.id);
        return NextResponse.json({ received: true });
      }

      const candles = parseInt(candlesStr, 10);
      if (isNaN(candles) || candles <= 0) {
        console.error("[stripe/webhook] Invalid candles value:", candlesStr);
        return NextResponse.json({ received: true });
      }

      // Mark purchase completed
      await admin
        .from("candle_purchases")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", purchaseId)
        .eq("status", "pending");

      // Get current balance
      const { data: user } = await admin
        .from("users")
        .select("candle_balance")
        .eq("id", userId)
        .single();

      const currentBalance = user?.candle_balance ?? 0;
      const newBalance = currentBalance + candles;

      // Credit candles
      await admin
        .from("users")
        .update({ candle_balance: newBalance })
        .eq("id", userId);

      // Record transaction
      await admin.from("candle_transactions").insert({
        user_id: userId,
        delta: candles,
        balance_after: newBalance,
        kind: "purchase",
        ref_id: purchaseId,
        note: `캔들 ${candles}개 구매`,
      });
    }
  } catch (err) {
    console.error("[stripe/webhook] Handler error:", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
