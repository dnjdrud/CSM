/**
 * Approval-based signup: signup requests, approval tokens, completion (create Auth user + public.users).
 * All mutations use service role where needed (no Auth user before completion).
 */
import type { SignupRequest, SignupRequestStatus, UserRole } from "@/lib/domain/types";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { randomBytes } from "crypto";

/** Supabase client (server admin or server session). Used so admin session can approve via RLS. */
type SupabaseClientLike = NonNullable<ReturnType<typeof getSupabaseAdmin>>;

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
  denomination?: string | null;
  faith_years?: number | null;
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
    denomination: r.denomination ?? null,
    faithYears: r.faith_years ?? null,
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
  denomination?: string | null;
  faithYears?: number | null;
}): Promise<{ id: string } | { error: "ALREADY_MEMBER" }> {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Server not configured for signup");

  const email = input.email.trim().toLowerCase();
  const role = SIGNUP_ROLES.includes(input.role) ? input.role : "LAY";
  const name = input.name?.trim() || null;
  const church = input.church?.trim() || null;
  const bio = input.bio?.trim() || null;
  const affiliation = input.affiliation?.trim() || null;
  const denomination = input.denomination?.trim() || null;
  const faith_years = input.faithYears ?? null;

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
          name, role, church, bio, affiliation, denomination, faith_years,
          status: "PENDING", reviewed_at: null, reviewed_by: null, review_note: null,
        })
        .eq("id", existing.id);
      if (error) throw new Error(error.message);
      return { id: existing.id };
    }
    if (existing.status === "REJECTED") {
      const { data: updated, error } = await admin
        .from("signup_requests")
        .update({
          name, role, church, bio, affiliation, denomination, faith_years,
          status: "PENDING", reviewed_at: null, reviewed_by: null, review_note: null,
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
      email, name, role, church, bio, affiliation, denomination, faith_years,
      status: "PENDING",
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  if (!inserted) throw new Error("Failed to create signup request");
  return { id: inserted.id };
}

/** List signup requests. Use server client (admin session) when provided so RLS allows ADMIN to select. */
export async function listSignupRequests(
  status?: SignupRequestStatus,
  supabase?: SupabaseClientLike
): Promise<SignupRequest[]> {
  const client = supabase ?? getSupabaseAdmin();
  if (!client) return [];

  let query = client
    .from("signup_requests")
    .select("id, email, name, role, church, bio, affiliation, denomination, faith_years, status, created_at, reviewed_at, reviewed_by, review_note")
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);
  const { data: rows } = await query;
  return (rows ?? []).map(rowToRequest);
}

/** Approve request: set status, create token, return token + email. Use server client when provided so RLS allows ADMIN. */
export async function approveSignupRequest(
  adminId: string,
  requestId: string,
  supabase?: SupabaseClientLike
): Promise<{ token: string; email: string } | null> {
  const client = supabase ?? getSupabaseAdmin();
  if (!client) return null;

  const { data: req } = await client
    .from("signup_requests")
    .select("id, email")
    .eq("id", requestId)
    .eq("status", "PENDING")
    .single();

  if (!req) return null;

  const now = new Date();
  const expiresAt = new Date(now.getTime() + TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
  const token = generateToken();

  const { error: updateErr } = await client
    .from("signup_requests")
    .update({
      status: "APPROVED",
      reviewed_at: now.toISOString(),
      reviewed_by: adminId,
      review_note: null,
    })
    .eq("id", requestId);

  if (updateErr) throw new Error(updateErr.message);

  const { error: tokenErr } = await client.from("approval_tokens").insert({
    request_id: requestId,
    token,
    expires_at: expiresAt.toISOString(),
  });

  if (tokenErr) throw new Error(tokenErr.message);

  return { token, email: req.email };
}

/** Reject request. Use server client when provided for RLS. */
export async function rejectSignupRequest(
  adminId: string,
  requestId: string,
  note?: string | null,
  supabase?: SupabaseClientLike
): Promise<boolean> {
  const client = supabase ?? getSupabaseAdmin();
  if (!client) return false;

  const { error } = await client
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

/** Result for completion link: valid (show form), invalid/expired (redirect to request-access), or already_completed (redirect to login). */
export type CompletionLinkStatus =
  | { status: "valid"; request: SignupRequest }
  | { status: "invalid_or_expired" }
  | { status: "already_completed" };

/** Check token and request status for /auth/complete. Use this to decide redirect vs show form. */
export async function getCompletionLinkStatus(
  token: string | null | undefined
): Promise<CompletionLinkStatus> {
  const admin = getSupabaseAdmin();
  if (!admin) return { status: "invalid_or_expired" };

  const trimmed = (token ?? "").trim();
  if (!trimmed) return { status: "invalid_or_expired" };

  const { data: tokenRow } = await admin
    .from("approval_tokens")
    .select("id, request_id, expires_at, used_at")
    .eq("token", trimmed)
    .maybeSingle();

  if (!tokenRow) return { status: "invalid_or_expired" };
  if (new Date(tokenRow.expires_at) <= new Date()) return { status: "invalid_or_expired" };

  if (tokenRow.used_at) {
    const { data: reqRow } = await admin
      .from("signup_requests")
      .select("status")
      .eq("id", tokenRow.request_id)
      .single();
    if (reqRow?.status === "COMPLETED") return { status: "already_completed" };
    return { status: "invalid_or_expired" };
  }

  const { data: reqRow } = await admin
    .from("signup_requests")
    .select("id, email, name, role, church, bio, affiliation, denomination, faith_years, status, created_at, reviewed_at, reviewed_by, review_note")
    .eq("id", tokenRow.request_id)
    .eq("status", "APPROVED")
    .single();

  if (!reqRow) return { status: "invalid_or_expired" };

  return { status: "valid", request: rowToRequest(reqRow) };
}

/** Verify token: exists, not used, not expired; request status APPROVED. Returns request data for completion form. */
export async function verifyApprovalToken(
  token: string
): Promise<{ request: SignupRequest } | null> {
  const result = await getCompletionLinkStatus(token);
  if (result.status === "valid") return { request: result.request };
  return null;
}

/**
 * Approve signup: immediately creates Supabase auth user + public.users row, marks COMPLETED.
 * Replaces the old PENDING → APPROVED → COMPLETED two-step flow.
 * Uses service role for auth user creation; supabase client for RLS-gated request update.
 */
export async function approveAndCreateUser(
  adminId: string,
  requestId: string,
  supabase?: SupabaseClientLike
): Promise<{ ok: true; email: string } | { error: string }> {
  const admin = getSupabaseAdmin();
  if (!admin) return { error: "Server not configured" };

  const client = supabase ?? admin;

  const { data: req } = await client
    .from("signup_requests")
    .select("id, email, name, role, church, bio, affiliation, denomination, faith_years")
    .eq("id", requestId)
    .eq("status", "PENDING")
    .single();

  if (!req) return { error: "Request not found or not pending." };

  const email = req.email.trim().toLowerCase();
  const password = randomBytes(32).toString("base64url");
  const role = SIGNUP_ROLES.includes(req.role as UserRole) ? (req.role as UserRole) : "LAY";
  const name = (req.name as string | null)?.trim() || "Member";

  const { data: authUser, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  let userId: string;
  if (createError) {
    if (!createError.message.includes("already been registered"))
      return { error: createError.message };
    // Auth user already exists — look up their ID and continue
    const { data: existingUsers } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const existing = existingUsers?.users?.find((u) => u.email?.toLowerCase() === email);
    if (!existing) return { error: "This email is already registered but could not be found." };
    userId = existing.id;
  } else {
    if (!authUser?.user?.id) return { error: "Failed to create account." };
    userId = authUser.user.id;
  }

  const { error: userUpsertErr } = await admin.from("users").upsert({
    id: userId,
    name,
    role,
    church: (req.church as string | null)?.trim() || null,
    bio: (req.bio as string | null)?.trim() || null,
    affiliation: (req.affiliation as string | null)?.trim() || null,
    denomination: (req.denomination as string | null)?.trim() || null,
    faith_years: req.faith_years ?? null,
    username: null,
  }, { onConflict: "id", ignoreDuplicates: false });

  if (userUpsertErr) {
    if (authUser?.user?.id) await admin.auth.admin.deleteUser(authUser.user.id);
    return { error: userUpsertErr.message };
  }

  const now = new Date().toISOString();
  await client.from("signup_requests").update({
    status: "COMPLETED",
    reviewed_at: now,
    reviewed_by: adminId,
    review_note: null,
  }).eq("id", requestId);

  const { logSignupComplete } = await import("@/lib/admin/audit");
  await logSignupComplete(userId, requestId, email);

  return { ok: true, email };
}

/** Create public.users row with role ADMIN for bootstrap admin. Uses service role. */
export async function createAdminProfileForOnboarding(
  authUserId: string,
  data: { name: string; bio?: string; affiliation?: string }
): Promise<{ ok: true } | { error: string }> {
  const admin = getSupabaseAdmin();
  if (!admin) return { error: "Server not configured" };

  const name = data.name?.trim() || "Admin";
  const row: Record<string, unknown> = {
    id: authUserId,
    name,
    role: "ADMIN",
    bio: null,
    affiliation: null,
    username: null,
    church: null,
  };

  let result = await admin.from("users").upsert(row, {
    onConflict: "id",
    ignoreDuplicates: false,
  });
  if (result.error) {
    const msg = result.error.message || "";
    if (msg.includes("invite_code_id") || msg.includes("column")) {
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

/**
 * Atomically reserve token: set used_at only if used_at is null and expires_at > now.
 * Returns request data for that token or null if already used/expired/invalid.
 * Uses service role only.
 */
async function reserveApprovalToken(
  admin: NonNullable<ReturnType<typeof getSupabaseAdmin>>,
  token: string
): Promise<{ request: SignupRequest } | null> {
  const trimmed = token.trim();
  if (!trimmed) return null;

  const now = new Date().toISOString();

  const { data: tokenRow } = await admin
    .from("approval_tokens")
    .select("id, request_id, expires_at")
    .eq("token", trimmed)
    .is("used_at", null)
    .gt("expires_at", now)
    .maybeSingle();

  if (!tokenRow) return null;

  const { data: updated } = await admin
    .from("approval_tokens")
    .update({ used_at: now })
    .eq("id", tokenRow.id)
    .is("used_at", null)
    .select("request_id")
    .maybeSingle();

  if (!updated) return null;

  const { data: reqRow } = await admin
    .from("signup_requests")
    .select("id, email, name, role, church, bio, affiliation, denomination, faith_years, status, created_at, reviewed_at, reviewed_by, review_note")
    .eq("id", updated.request_id)
    .eq("status", "APPROVED")
    .single();

  if (!reqRow) return null;
  return { request: rowToRequest(reqRow) };
}

/** Clear used_at on a token (best-effort rollback if auth creation fails). */
async function clearTokenUsedAt(
  admin: NonNullable<ReturnType<typeof getSupabaseAdmin>>,
  token: string
): Promise<void> {
  await admin.from("approval_tokens").update({ used_at: null }).eq("token", token.trim());
}

/**
 * Consume token, create Auth user, upsert public.users, mark request COMPLETED.
 * Uses service role only. Returns email + auto-generated password (for session creation only).
 * Password is randomly generated — users always sign in via magic link.
 */
export async function consumeApprovalTokenAndCreateUser(params: {
  token: string;
  password?: string; // deprecated: ignored, random password is generated internally
  username?: string | null;
  name: string;
  role: UserRole;
  church?: string | null;
  bio?: string | null;
  affiliation?: string | null;
  denomination?: string | null;
  faithYears?: number | null;
}): Promise<{ ok: true; email: string; _pw: string } | { error: string }> {
  const admin = getSupabaseAdmin();
  if (!admin) return { error: "Server not configured" };

  const reserved = await reserveApprovalToken(admin, params.token);
  if (!reserved) return { error: "This link is invalid or expired." };

  const { request } = reserved;
  const email = request.email.trim().toLowerCase();
  // Always generate a random password — users log in via magic link only
  const password = randomBytes(32).toString("base64url");

  const role = SIGNUP_ROLES.includes(params.role) ? params.role : request.role;
  const name = params.name?.trim() || request.name?.trim() || "Member";
  const church = (params.church?.trim() || request.church) ?? null;
  const bio = (params.bio?.trim() || request.bio) ?? null;
  const affiliation = (params.affiliation?.trim() || request.affiliation) ?? null;
  const denomination = (params.denomination?.trim() || request.denomination) ?? null;
  const faith_years = params.faithYears ?? request.faithYears ?? null;
  const username = params.username?.trim() || null;

  const { data: authUser, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createError) {
    await clearTokenUsedAt(admin, params.token);
    if (createError.message.includes("already been registered"))
      return { error: "This email is already registered. Please sign in." };
    return { error: createError.message };
  }
  if (!authUser?.user?.id) {
    await clearTokenUsedAt(admin, params.token);
    return { error: "Failed to create account." };
  }

  const userRow = {
    id: authUser.user.id,
    name,
    role,
    church,
    bio,
    affiliation,
    denomination,
    faith_years,
    username: username || null,
  };

  const { error: userUpsertErr } = await admin.from("users").upsert(userRow, {
    onConflict: "id",
    ignoreDuplicates: false,
  });

  if (userUpsertErr) {
    await admin.auth.admin.deleteUser(authUser.user.id);
    await clearTokenUsedAt(admin, params.token);
    return { error: userUpsertErr.message };
  }

  const now = new Date().toISOString();
  await admin.from("signup_requests").update({
    status: "COMPLETED",
    reviewed_at: now,
  }).eq("id", request.id);

  const { logSignupComplete } = await import("@/lib/admin/audit");
  await logSignupComplete(authUser.user.id, request.id, email);

  return { ok: true, email, _pw: password };
}
