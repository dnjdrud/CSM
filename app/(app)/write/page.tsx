import { Suspense } from "react";
import { getCurrentUser } from "@/lib/data/repository";
import { getRoleUX } from "@/lib/config/roleUX";
import { TimelineContainer } from "@/components/TimelineContainer";
import WritePageClient from "./_components/WritePageClient";
import { getAuthUserId } from "@/lib/auth/session";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function WritePage() {
  const [currentUser, userId] = await Promise.all([
    getCurrentUser(),
    getAuthUserId(),
  ]);
  const roleUX = getRoleUX(currentUser?.role);

  let hasSubscription = false;
  if (userId) {
    const admin = getSupabaseAdmin();
    if (admin) {
      const { data } = await admin
        .from("users")
        .select("subscription_candles_per_month")
        .eq("id", userId)
        .single();
      hasSubscription = !!data?.subscription_candles_per_month;
    }
  }

  return (
    <TimelineContainer>
      <Suspense>
        <WritePageClient
          recommendedCategories={roleUX.recommendedCategories}
          writeHint={roleUX.writeHint}
          stripeAccountEnabled={hasSubscription}
        />
      </Suspense>
    </TimelineContainer>
  );
}
