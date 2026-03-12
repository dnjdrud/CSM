/**
 * subscriptionRepository — Crow(까마귀) 구독 관계 CRUD.
 *
 * RLS 설계:
 *  - subscriber_id = auth.uid() → 구독 목록 조회/수정/삭제
 *  - creator_id    = auth.uid() → 구독자 목록 조회
 *  - 구독자 수(카운트)는 admin client 사용 (RLS 우회 필요)
 *
 * 향후 확장 포인트:
 *  - status: 'active' → 'paused' | 'cancelled' (결제 lifecycle)
 *  - plan: 'free' | 'supporter' | 'premium' (멤버십 등급)
 *  - expires_at: 유료 구독 만료일
 *  - stripe_subscription_id: Stripe 연동
 */

import { supabaseServer } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { User } from "@/lib/domain/types";

export type SubscriptionStatus = "active" | "paused" | "cancelled";

export type Subscription = {
  id: string;
  subscriberId: string;
  creatorId: string;
  status: SubscriptionStatus;
  createdAt: string;
  /** Joined creator profile — populated by listMySubscriptions */
  creator?: Pick<User, "id" | "name" | "role" | "affiliation" | "avatarUrl" | "username" | "bio">;
};

type SubscriptionRow = {
  id: string;
  subscriber_id: string;
  creator_id: string;
  status: string;
  created_at: string;
};

function rowToSubscription(r: SubscriptionRow): Subscription {
  return {
    id: r.id,
    subscriberId: r.subscriber_id,
    creatorId: r.creator_id,
    status: r.status as SubscriptionStatus,
    createdAt: r.created_at,
  };
}

/**
 * 내가 구독한 크리에이터 목록 (크리에이터 프로필 포함).
 * subscriber_id = currentUserId 기준.
 */
export async function listMySubscriptions(
  subscriberId: string
): Promise<Subscription[]> {
  const supabase = await supabaseServer();

  const { data, error } = await supabase
    .from("subscriptions")
    .select(
      `id, subscriber_id, creator_id, status, created_at,
       creator:users!creator_id(id, name, role, affiliation, bio, username, avatar_url)`
    )
    .eq("subscriber_id", subscriberId)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[subscriptionRepository] listMySubscriptions:", error.message);
    return [];
  }

  return (data ?? []).map((r) => {
    const sub = rowToSubscription(r as unknown as SubscriptionRow);
    const c = (r as Record<string, unknown>).creator as Record<string, unknown> | null;
    if (c) {
      sub.creator = {
        id: c.id as string,
        name: (c.name as string) ?? "",
        role: (c.role as User["role"]) ?? "LAY",
        affiliation: (c.affiliation as string | undefined) ?? undefined,
        bio: (c.bio as string | undefined) ?? undefined,
        username: (c.username as string | undefined) ?? undefined,
        avatarUrl: (c.avatar_url as string | undefined) ?? undefined,
      };
    }
    return sub;
  });
}

/**
 * 크리에이터의 활성 구독자 수.
 * Admin client 사용 — RLS subscriber/creator 양쪽 정책이 있어
 * 방문자(비구독자)가 카운트 조회할 때 admin이 필요함.
 */
export async function getSubscriberCount(creatorId: string): Promise<number> {
  const admin = getSupabaseAdmin();
  if (!admin) {
    // Fallback: user client (RLS scope — only works if viewer is subscriber or creator)
    const supabase = await supabaseServer();
    const { count } = await supabase
      .from("subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("creator_id", creatorId)
      .eq("status", "active");
    return count ?? 0;
  }

  const { count } = await admin
    .from("subscriptions")
    .select("id", { count: "exact", head: true })
    .eq("creator_id", creatorId)
    .eq("status", "active");
  return count ?? 0;
}

/**
 * 현재 유저가 특정 크리에이터를 구독 중인지 확인.
 */
export async function isSubscribed(
  subscriberId: string,
  creatorId: string
): Promise<boolean> {
  const supabase = await supabaseServer();
  const { data } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("subscriber_id", subscriberId)
    .eq("creator_id", creatorId)
    .eq("status", "active")
    .maybeSingle();
  return !!data;
}

/**
 * 구독 토글 — 구독 중이면 취소, 아니면 구독.
 * Returns: 'subscribed' | 'unsubscribed'
 */
export async function toggleSubscription(
  subscriberId: string,
  creatorId: string
): Promise<"subscribed" | "unsubscribed"> {
  const supabase = await supabaseServer();

  // 기존 레코드 확인 (active이든 아니든)
  const { data: existing } = await supabase
    .from("subscriptions")
    .select("id, status")
    .eq("subscriber_id", subscriberId)
    .eq("creator_id", creatorId)
    .maybeSingle();

  if (existing) {
    if (existing.status === "active") {
      // 구독 취소
      await supabase
        .from("subscriptions")
        .update({ status: "cancelled" })
        .eq("id", existing.id);
      return "unsubscribed";
    } else {
      // 재구독
      await supabase
        .from("subscriptions")
        .update({ status: "active" })
        .eq("id", existing.id);
      return "subscribed";
    }
  }

  // 새 구독
  await supabase.from("subscriptions").insert({
    subscriber_id: subscriberId,
    creator_id: creatorId,
    status: "active",
  });
  return "subscribed";
}
