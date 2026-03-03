"use server";

import { redirect } from "next/navigation";
import { consumeApprovalTokenAndCreateUser } from "@/lib/data/signupRepository";
import type { UserRole } from "@/lib/domain/types";

const ALLOWED_ROLES: UserRole[] = ["LAY", "MINISTRY_WORKER", "PASTOR", "MISSIONARY", "SEMINARIAN"];

export type CompleteSignupResult = { ok: true } | { error: string };

export async function completeSignupAction(params: {
  token: string;
  password: string;
  username?: string | null;
  name: string;
  role: UserRole;
  church?: string | null;
  bio?: string | null;
  affiliation?: string | null;
}): Promise<CompleteSignupResult> {
  const name = params.name?.trim();
  if (!name) return { error: "Name is required." };
  const role = ALLOWED_ROLES.includes(params.role) ? params.role : "LAY";

  const result = await consumeApprovalTokenAndCreateUser({
    token: params.token.trim(),
    password: params.password,
    username: params.username?.trim() || null,
    name,
    role,
    church: params.church?.trim() || null,
    bio: params.bio?.trim() || null,
    affiliation: params.affiliation?.trim() || null,
  });

  if ("ok" in result && result.ok) {
    redirect("/login?message=account_created");
  }
  return { error: "error" in result ? result.error : "Something went wrong." };
}
