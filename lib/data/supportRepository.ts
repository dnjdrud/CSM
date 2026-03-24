import type { Ministry, SupportIntent, SupportPurpose } from "@/lib/domain/types";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { supabaseServer } from "@/lib/supabase/server";

// ── Row mappers ───────────────────────────────────────────────────────────────

function rowToMinistry(r: {
  id: string;
  name: string;
  description: string;
  location: string | null;
  support_account: string | null;
}): Ministry {
  return {
    id: r.id,
    name: r.name,
    description: r.description,
    location: r.location ?? undefined,
    supportAccount: r.support_account ?? undefined,
  };
}

function rowToIntent(r: {
  id: string;
  ministry_id: string;
  donor_id: string | null;
  purpose: string;
  amount_krw: number;
  status: string;
  message: string | null;
  created_at: string;
  updated_at: string;
}): SupportIntent {
  return {
    id: r.id,
    ministryId: r.ministry_id,
    donorId: r.donor_id,
    purpose: r.purpose as SupportPurpose,
    amountKrw: r.amount_krw,
    status: r.status as SupportIntent["status"],
    message: r.message,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

// ── Ministry queries ──────────────────────────────────────────────────────────

export async function listMinistries(): Promise<Ministry[]> {
  try {
    const supabase = await supabaseServer();
    const { data, error } = await supabase
      .from("ministries")
      .select("id, name, description, location, support_account")
      .eq("active", true)
      .order("created_at", { ascending: true });
    if (error) { console.error("[listMinistries]", error.message); return []; }
    return (data ?? []).map(rowToMinistry);
  } catch (e) {
    console.error("[listMinistries] caught:", e);
    return [];
  }
}

export async function getMinistryById(id: string): Promise<Ministry | null> {
  try {
    const supabase = await supabaseServer();
    const { data, error } = await supabase
      .from("ministries")
      .select("id, name, description, location, support_account")
      .eq("id", id)
      .eq("active", true)
      .single();
    if (error || !data) return null;
    return rowToMinistry(data as any);
  } catch { return null; }
}

// ── Support intent mutations ──────────────────────────────────────────────────

export async function createSupportIntent(input: {
  ministryId: string;
  donorId: string | null;
  purpose: SupportPurpose;
  amountKrw: number;
  message?: string;
}): Promise<SupportIntent> {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Admin client unavailable");
  const { data, error } = await admin
    .from("support_intents")
    .insert({
      ministry_id: input.ministryId,
      donor_id: input.donorId,
      purpose: input.purpose,
      amount_krw: input.amountKrw,
      message: input.message ?? null,
      status: "PENDING",
    })
    .select("*")
    .single();
  if (error) { console.error("[createSupportIntent]", error.message); throw new Error(error.message); }
  return rowToIntent(data as any);
}

export async function getSupportIntent(id: string): Promise<SupportIntent | null> {
  try {
    const admin = getSupabaseAdmin();
    if (!admin) return null;
    const { data, error } = await admin.from("support_intents").select("*").eq("id", id).single();
    if (error || !data) return null;
    return rowToIntent(data as any);
  } catch { return null; }
}

export async function completeSupportIntent(
  intentId: string,
  tx: {
    providerPaymentId: string;
    providerOrderId: string;
    amountKrw: number;
    status: string;
    rawResponse: Record<string, unknown>;
  }
): Promise<void> {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Admin client unavailable");
  await Promise.all([
    admin.from("support_intents").update({ status: "COMPLETED" }).eq("id", intentId),
    admin.from("support_transactions").insert({
      intent_id: intentId,
      provider: "TOSS",
      provider_payment_id: tx.providerPaymentId,
      provider_order_id: tx.providerOrderId,
      amount_krw: tx.amountKrw,
      status: tx.status,
      raw_response: tx.rawResponse,
    }),
  ]);
}

export async function failSupportIntent(intentId: string): Promise<void> {
  const admin = getSupabaseAdmin();
  if (!admin) return;
  await admin.from("support_intents").update({ status: "FAILED" }).eq("id", intentId);
}
