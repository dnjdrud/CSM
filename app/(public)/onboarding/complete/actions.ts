"use server";

import { redirect } from "next/navigation";
import { consumeApprovalTokenAndCreateUser } from "@/lib/data/signupRepository";
import type { UserRole } from "@/lib/domain/types";

const ALLOWED_ROLES: UserRole[] = ["LAY", "MINISTRY_WORKER", "PASTOR", "MISSIONARY", "SEMINARIAN"];

export type CompleteSignupResult = { ok: true } | { error: string };

export async function completeSignupAction(params: {
  token: string;
  username?: string | null;
  name: string;
  role: UserRole;
  church?: string | null;
  bio?: string | null;
  affiliation?: string | null;
  denomination?: string | null;
  faithYears?: number | null;
}): Promise<CompleteSignupResult> {
  const name = params.name?.trim();
  if (!name) return { error: "Name is required." };
  const role = ALLOWED_ROLES.includes(params.role) ? params.role : "LAY";

  const result = await consumeApprovalTokenAndCreateUser({
    token: params.token.trim(),
    username: params.username?.trim() || null,
    name,
    role,
    church: params.church?.trim() || null,
    bio: params.bio?.trim() || null,
    affiliation: params.affiliation?.trim() || null,
    denomination: params.denomination?.trim() || null,
    faithYears: params.faithYears ?? null,
  });

  if ("ok" in result && result.ok) {
    redirect("/onboarding/welcome");
  }
  return { error: "error" in result ? result.error : "Something went wrong." };
}
