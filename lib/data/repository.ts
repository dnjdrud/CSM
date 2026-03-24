/**
 * Data access layer — thin compatibility shim.
 *
 * All domain logic now lives in the dedicated repository modules.
 * This file exists so that existing callers (97 files) can continue to
 * import from "@/lib/data/repository" without changes.
 *
 * What lives here:
 *   - export * from supabaseRepository  (covers ~95% of all exports)
 *   - two name-alias re-exports kept for backward compat
 *   - getCurrentUser / ensureCurrentUserProfile / createUserProfileInSupabase
 *     (session-aware helpers with no natural domain-repo home yet)
 *   - isBlocked / toggleBlock / isMuted / toggleMute
 *     (in-memory browser-only state; no DB table, must stay here)
 */

// ── Domain re-exports ─────────────────────────────────────────────────────────
export * from "./supabaseRepository";

// ── Utility re-exports not covered by supabaseRepository ─────────────────────
export { normalizeTag } from "./_internal/postHelpers";

// ── Name aliases for backward compatibility ───────────────────────────────────
// repository called it getMinistries; supportRepository calls it listMinistries
export { listMinistries as getMinistries } from "./supportRepository";
// repository called it getProfileWithError; userRepository calls it getUserByIdWithError
export { getUserByIdWithError as getProfileWithError } from "./userRepository";

// ── Session-aware current-user helpers ────────────────────────────────────────
import type { User, UserRole } from "@/lib/domain/types";
import { createLocalAdapter } from "@/lib/storage/localAdapter";

/**
 * Current user: session → users row. Returns null when not logged in or no profile.
 *
 * Uses admin client to bypass RLS so it resolves on first load even before
 * the RLS session is fully propagated.
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const { supabaseServer } = await import("@/lib/supabase/server");
    const supabase = await supabaseServer();
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user ?? null;
    if (!user?.id) return null;
    const { getSupabaseAdmin } = await import("@/lib/supabase/admin");
    const admin = getSupabaseAdmin();
    const queryClient = admin ?? supabase;
    const { data: row } = await queryClient
      .from("users")
      .select("id, name, role, bio, affiliation, created_at, deactivated_at")
      .eq("id", user.id)
      .single();
    if (!row) return null;
    return {
      id: row.id,
      name: row.name ?? "",
      role: (row.role as UserRole) ?? "LAY",
      bio: row.bio ?? undefined,
      affiliation: row.affiliation ?? undefined,
      createdAt: row.created_at ?? new Date().toISOString(),
      deactivatedAt: row.deactivated_at ?? undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Only call at auth time (verify-magic, onboarding). Ensures the public.users
 * row exists. General pages should use getCurrentUser() instead.
 */
export async function ensureCurrentUserProfile(): Promise<void> {
  try {
    const { supabaseServer } = await import("@/lib/supabase/server");
    const supabase = await supabaseServer();
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user ?? null;
    if (!user?.id) return;
    const { ensureProfile } = await import("@/lib/auth/ensureProfile");
    await ensureProfile({ userId: user.id, email: user.email ?? null });
  } catch {
    // non-critical: best-effort
  }
}

/** Create public.users row after magic-link auth (onboarding / bypass flow). */
export async function createUserProfileInSupabase(
  authUserId: string,
  data: { name: string; role: UserRole; bio?: string; affiliation?: string }
): Promise<User> {
  const { supabaseServer } = await import("@/lib/supabase/server");
  const supabase = await supabaseServer();
  const now = new Date().toISOString();
  const { error } = await supabase.from("users").insert({
    id: authUserId,
    name: data.name,
    role: data.role,
    bio: data.bio ?? null,
    affiliation: data.affiliation ?? null,
    created_at: now,
  });
  if (error) throw new Error(error.message);
  return {
    id: authUserId,
    name: data.name,
    role: data.role,
    bio: data.bio,
    affiliation: data.affiliation,
    createdAt: now,
  };
}

// ── In-memory block / mute state ──────────────────────────────────────────────
// No DB table — these are browser-persisted client-side toggles.

type BlockEntry = { blockerId: string; blockedId: string };
type MuteEntry  = { muterId: string; mutedId: string };

const blocksAdapter = createLocalAdapter<BlockEntry[]>("blocks");
const mutesAdapter  = createLocalAdapter<MuteEntry[]>("mutes");

let blocks: BlockEntry[] = [];
let mutes:  MuteEntry[]  = [];

(function init() {
  if (typeof window === "undefined") return;
  const b = blocksAdapter.load();
  if (b != null && Array.isArray(b)) blocks = b;
  const m = mutesAdapter.load();
  if (m != null && Array.isArray(m)) mutes = m;
})();

export function isBlocked(viewerId: string, targetUserId: string): boolean {
  return blocks.some((b) => b.blockerId === viewerId && b.blockedId === targetUserId);
}

export function toggleBlock(viewerId: string, targetUserId: string): void {
  const i = blocks.findIndex((b) => b.blockerId === viewerId && b.blockedId === targetUserId);
  if (i >= 0) blocks.splice(i, 1);
  else blocks.push({ blockerId: viewerId, blockedId: targetUserId });
  if (typeof window !== "undefined") blocksAdapter.save(blocks);
}

export function isMuted(viewerId: string, targetUserId: string): boolean {
  return mutes.some((m) => m.muterId === viewerId && m.mutedId === targetUserId);
}

export function toggleMute(viewerId: string, targetUserId: string): void {
  const i = mutes.findIndex((m) => m.muterId === viewerId && m.mutedId === targetUserId);
  if (i >= 0) mutes.splice(i, 1);
  else mutes.push({ muterId: viewerId, mutedId: targetUserId });
  if (typeof window !== "undefined") mutesAdapter.save(mutes);
}
