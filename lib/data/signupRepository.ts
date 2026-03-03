/**
 * Approval-based signup: signup requests, approval tokens, completion (create Auth user + public.users).
 * All mutations use service role where needed (no Auth user before completion).
 */
import type { SignupRequest, SignupRequestStatus, UserRole } from "@/lib/domain/types";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { randomBytes } from "crypto";

const SIGNUP_ROLES: UserRole[] = ["LAY", "MINISTRY_WORKER", "PASTOR", "MISSIONARY", "SEMINARIAN"];
const TOKEN_BYTES = 32;
const TOKEN_EXPIRY_DAYS = 7;

function rowToRequest(r: {
  id: string;
  email: string;
  name: string | null;
  role: string;
  church: string | null;
  bio: string | null;
  affiliation: string | null;
  status: string;
  created_at: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  review_note: string | null;
}): SignupRequest {
  return {
    id: r.id,
    email: r.email,
    name: r.name ?? null,
    role: r.role as UserRole,
    church: r.church ?? null,
    bio: r.bio ?? null,
    affiliation: r.affiliation ?? null,
    status: r.status as SignupRequestStatus,
    createdAt: r.created_at ?? new Date().toISOString(),
    reviewedAt: r.reviewed_at ?? null,
    reviewedBy: r.reviewed_by ?? null,
    reviewNote: r.review_note ?? null,
  };
}

function generateToken(): string {
  return randomBytes(TOKEN_BYTES).toString("base64url");
}

/** Create or update signup request by email. Uses service role. Returns id or error. */
export async function createSignupRequest(input: {
  email: string;
  name?: string | null;
  role: UserRole;
  church?: string | null;
  bio?: string | null;
  affiliation?: string | null;
}): Promise<{ id: string } | { error: "ALREADY_MEMBER" }> {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Server not configured for signup");

  const email = input.email.trim().toLowerCase();
  const role = SIGNUP_ROLES.includes(input.role) ? input.role : "LAY";
  const name = input.name?.trim() || null;
  const church = input.church?.trim() || null;
  const bio = input.bio?.trim() || null;
  const affiliation = input.affiliation?.trim() || null;

  const { data: existing } = await admin
    .from("signup_requests")
    .select("id, status")
    .eq("email", email)
    .maybeSingle();

  if (existing) {
    if (existing.status === "COMPLETED") return { error: "ALREADY_MEMBER" };
    if (existing.status === "PENDING" || existing.status === "APPROVED") {
      const { error } = await admin
        .from("signup_requests")
        .update({
          name,
          role,
          church,
          bio,
          affiliation,
          status: "PENDING",
          reviewed_at: null,
          reviewed_by: null,
          review_note: null,
        })
        .eq("id", existing.id);
      if (error) throw new Error(error.message);
      return { id: existing.id };
    }
    if (existing.status === "REJECTED") {
      const { data: updated, error } = await admin
        .from("signup_requests")
        .update({
          name,
          role,
          church,
          bio,
          affiliation,
          status: "PENDING",
          reviewed_at: null,
          reviewed_by: null,
          review_note: null,
        })
        .eq("id", existing.id)
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      return { id: updated!.id };
    }
  }

  const { data: inserted, error } = await admin
    .from("signup_requests")
    .insert({
      email,
      name,
      role,
      church,
      bio,
      affiliation,
      status: "PENDING",
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  if (!inserted) throw new Error("Failed to create signup request");
  return { id: inserted.id };
}

/** List signup requests (admin only; call from server action with getAdminOrNull). */
export async function listSignupRequests(
  status?: SignupRequestStatus
): Promise<SignupRequest[]> {
  const admin = getSupabaseAdmin();
  if (!admin) return [];

  let query = admin
    .from("signup_requests")
    .select("id, email, name, role, church, bio, affiliation, status, created_at, reviewed_at, reviewed_by, review_note")
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);
  const { data: rows } = await query;
  return (rows ?? []).map(rowToRequest);
}

/** Approve request: set status, create token, return token + email for sending link. */
export async function approveSignupRequest(
  adminId: string,
  requestId: string
): Promise<{ token: string; email: string } | null> {
  const admin = getSupabaseAdmin();
  if (!admin) return null;

  const { data: req } = await admin
    .from("signup_requests")
    .select("id, email")
    .eq("id", requestId)
    .eq("status", "PENDING")
    .single();

  if (!req) return null;

  const now = new Date();
  const expiresAt = new Date(now.getTime() + TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
  const token = generateToken();

  const { error: updateErr } = await admin
    .from("signup_requests")
    .update({
      status: "APPROVED",
      reviewed_at: now.toISOString(),
      reviewed_by: adminId,
      review_note: null,
    })
    .eq("id", requestId);

  if (updateErr) throw new Error(updateErr.message);

  const { error: tokenErr } = await admin.from("approval_tokens").insert({
    request_id: requestId,
    token,
    expires_at: expiresAt.toISOString(),
  });

  if (tokenErr) throw new Error(tokenErr.message);

  return { token, email: req.email };
}

/** Reject request. */
export async function rejectSignupRequest(
  adminId: string,
  requestId: string,
  note?: string | null
): Promise<boolean> {
  const admin = getSupabaseAdmin();
  if (!admin) return false;

  const { error } = await admin
    .from("signup_requests")
    .update({
      status: "REJECTED",
      reviewed_at: new Date().toISOString(),
      reviewed_by: adminId,
      review_note: note?.trim() || null,
    })
    .eq("id", requestId)
    .in("status", ["PENDING", "APPROVED"]);

  return !error;
}

/** Verify token: exists, not used, not expired; request status APPROVED. Returns request data for completion form. */
export async function verifyApprovalToken(
  token: string
): Promise<{ request: SignupRequest } | null> {
  const admin = getSupabaseAdmin();
  if (!admin) return null;

  const trimmed = token.trim();
  if (!trimmed) return null;

  const { data: tokenRow } = await admin
    .from("approval_tokens")
    .select("id, request_id, expires_at, used_at")
    .eq("token", trimmed)
    .maybeSingle();

  if (!tokenRow || tokenRow.used_at) return null;
  if (new Date(tokenRow.expires_at) <= new Date()) return null;

  const { data: reqRow } = await admin
    .from("signup_requests")
    .select("id, email, name, role, church, bio, affiliation, status, created_at, reviewed_at, reviewed_by, review_note")
    .eq("id", tokenRow.request_id)
    .eq("status", "APPROVED")
    .single();

  if (!reqRow) return null;

  return { request: rowToRequest(reqRow) };
}

/** Get APPROVAL invite code id for new user row. */
async function getApprovalInviteCodeId(admin: ReturnType<typeof getSupabaseAdmin>): Promise<string | null> {
  if (!admin) return null;
  const { data } = await admin.from("invite_codes").select("id").eq("code", "APPROVAL").maybeSingle();
  return data?.id ?? null;
}

/** Create public.users row with role ADMIN for bootstrap admin (no invite code). Uses service role. */
export async function createAdminProfileForOnboarding(
  authUserId: string,
  data: { name: string; bio?: string; affiliation?: string }
): Promise<{ ok: true } | { error: string }> {
  const admin = getSupabaseAdmin();
  if (!admin) return { error: "Server not configured" };

  const name = data.name?.trim() || "Admin";

  // Admin: only id, name, role required for login; all other profile fields null
  const row: Record<string, unknown> = {
    id: authUserId,
    name,
    role: "ADMIN",
    bio: null,
    affiliation: null,
    username: null,
    church: null,
  };

  const inviteCodeId = await getApprovalInviteCodeId(admin);
  if (inviteCodeId) row.invite_code_id = inviteCodeId;

    let result = await admin.from("users").upsert(row, {
      onConflict: "id",
      ignoreDuplicates: false,
    });

    if (result.error) {
      const msg = result.error.message || "";
      if (msg.includes("invite_code_id") || msg.includes("column")) {
        delete row.invite_code_id;
        delete row.username;
        delete row.church;
        result = await admin.from("users").upsert(row, {
          onConflict: "id",
          ignoreDuplicates: false,
        });
      }
    }

  if (result.error) return { error: result.error.message };
  return { ok: true };
}

/** Consume token, create Auth user, insert public.users, mark token and request COMPLETED. */
export async function consumeApprovalTokenAndCreateUser(params: {
  token: string;
  password: string;
  username?: string | null;
  name: string;
  role: UserRole;
  church?: string | null;
  bio?: string | null;
  affiliation?: string | null;
}): Promise<{ ok: true } | { error: string }> {
  const admin = getSupabaseAdmin();
  if (!admin) return { error: "Server not configured" };

  const verified = await verifyApprovalToken(params.token);
  if (!verified) return { error: "This link is invalid or expired." };

  const { request } = verified;
  const email = request.email.trim().toLowerCase();
  const password = params.password.trim();
  if (password.length < 8) return { error: "Password must be at least 8 characters." };

  const role = SIGNUP_ROLES.includes(params.role) ? params.role : request.role;
  const name = params.name?.trim() || request.name?.trim() || "Member";
  const church = (params.church?.trim() || request.church) ?? null;
  const bio = (params.bio?.trim() || request.bio) ?? null;
  const affiliation = (params.affiliation?.trim() || request.affiliation) ?? null;
  const username = params.username?.trim() || null;

  const { data: authUser, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createError) {
    if (createError.message.includes("already been registered")) return { error: "This email is already registered. Please sign in." };
    return { error: createError.message };
  }
  if (!authUser?.user?.id) return { error: "Failed to create account." };

  const inviteCodeId = await getApprovalInviteCodeId(admin);
  if (!inviteCodeId) return { error: "Server configuration error. Please contact support." };

  const { error: userInsertErr } = await admin.from("users").insert({
    id: authUser.user.id,
    name,
    role,
    church,
    bio,
    affiliation,
    username: username || null,
    invite_code_id: inviteCodeId,
  });

  if (userInsertErr) {
    await admin.auth.admin.deleteUser(authUser.user.id);
    return { error: userInsertErr.message };
  }

  const now = new Date().toISOString();
  await admin.from("approval_tokens").update({ used_at: now }).eq("token", params.token.trim());
  await admin.from("signup_requests").update({ status: "COMPLETED" }).eq("id", request.id);

  const { logSignupComplete } = await import("@/lib/admin/audit");
  await logSignupComplete(authUser.user.id, request.id, email);

  return { ok: true };
}
