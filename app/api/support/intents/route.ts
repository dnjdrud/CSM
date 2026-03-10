/**
 * POST /api/support/intents
 * Create a support intent and return Toss payment params.
 */
import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth/session";
import { createSupportIntent, getMinistryById } from "@/lib/data/repository";
import type { SupportPurpose } from "@/lib/domain/types";

const VALID_PURPOSES: SupportPurpose[] = ["ONGOING", "PROJECT", "URGENT"];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { ministryId, purpose, amountKrw, message } = body;

    // Validate
    if (!ministryId || typeof ministryId !== "string") {
      return NextResponse.json({ error: "ministryId required" }, { status: 400 });
    }
    if (!VALID_PURPOSES.includes(purpose)) {
      return NextResponse.json({ error: "Invalid purpose" }, { status: 400 });
    }
    const amount = Number(amountKrw);
    if (!amount || amount < 1000) {
      return NextResponse.json({ error: "Minimum amount is ₩1,000" }, { status: 400 });
    }

    // Ministry must exist
    const ministry = await getMinistryById(ministryId);
    if (!ministry) {
      return NextResponse.json({ error: "Ministry not found" }, { status: 404 });
    }

    // Donor ID (nullable — anonymous OK)
    const donorId = await getAuthUserId();

    const intent = await createSupportIntent({
      ministryId,
      donorId,
      purpose,
      amountKrw: amount,
      message: typeof message === "string" ? message : undefined,
    });

    const orderName = `${ministry.name} 후원금`;

    return NextResponse.json({
      intentId: intent.id,
      orderId: intent.id,          // Toss orderId = intentId (UUID, URL-safe)
      orderName,
      amountKrw: intent.amountKrw,
    });
  } catch (e) {
    console.error("[support/intents POST]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
