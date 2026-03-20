import { ProfileShell } from "./_components/ProfileShell";
import { ProfilePostsTab } from "./_components/ProfilePostsTab";
import { ProfileShortsTab } from "./_components/ProfileShortsTab";
import { ProfileCrowTab } from "./_components/ProfileCrowTab";
import { ProfileSpiritualTab } from "./_components/ProfileSpiritualTab";
import {
  getProfileWithError,
  listPostsByAuthorId,
  listFollowerIds,
  listFollowingIds,
} from "@/lib/data/repository";
import { isBlocked, isMuted } from "@/lib/data/repository";
import { getAuthUserId } from "@/lib/auth/session";
import { listSpiritualNotes } from "@/lib/data/spiritualRepository";
import {
  listMySubscriptions,
  getSubscriberCount,
  isSubscribed,
  isActiveSubscriber,
  getCreatorSubscriptionInfo,
} from "@/lib/data/subscriptionRepository";
import type { PostCategory } from "@/lib/domain/types";
import { getVideoSignedReadUrlAction } from "@/app/(app)/write/getUploadUrlAction";

export const dynamic = "force-dynamic";

const CONTENT_CATEGORIES: PostCategory[] = ["CONTENT", "PHOTO"];

export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string; section?: string }>;
}) {
  const [{ id }, { tab, section: sectionParam }] = await Promise.all([
    params,
    searchParams,
  ]);

  const activeTab =
    tab === "shorts" || tab === "crow" || tab === "spiritual"
      ? tab
      : "posts";
  const spiritualSection: "prayer" | "life" =
    sectionParam === "life" ? "life" : "prayer";

  const currentUserId = await getAuthUserId();
  const isOwnProfile = currentUserId === id;

  const shouldFetchSpiritual =
    activeTab === "spiritual" && isOwnProfile && !!currentUserId;
  const shouldFetchCrowList = activeTab === "crow" && isOwnProfile && !!currentUserId;

  // Fetch viewer's candle balance if logged in and viewing another profile
  const shouldFetchCandleBalance = !isOwnProfile && !!currentUserId;

  const [
    { user, errorMessage },
    posts,
    followerIds,
    followingIds,
    viewerFollowingIds,
    prayerNotes,
    lifeNotes,
    mySubscriptions,
    crowSubscriberCount,
    viewerIsSubscribed,
    viewerIsActiveSub,
    creatorSubInfo,
    viewerCandleBalance,
  ] = await Promise.all([
    getProfileWithError(id),
    listPostsByAuthorId(id),
    listFollowerIds(id),
    listFollowingIds(id),
    currentUserId ? listFollowingIds(currentUserId) : Promise.resolve([]),
    // spiritual
    shouldFetchSpiritual
      ? listSpiritualNotes(currentUserId!, "prayer")
      : Promise.resolve([]),
    shouldFetchSpiritual
      ? listSpiritualNotes(currentUserId!, "life")
      : Promise.resolve([]),
    // crow list: own profile crow tab only
    shouldFetchCrowList
      ? listMySubscriptions(currentUserId!)
      : Promise.resolve([]),
    // subscriber count: always for non-own profiles (header + crow tab)
    !isOwnProfile
      ? getSubscriberCount(id)
      : Promise.resolve(0),
    // is current user subscribed: always for non-own + logged-in
    !isOwnProfile && !!currentUserId
      ? isSubscribed(currentUserId, id)
      : Promise.resolve(false),
    // is current user an active (paid or free) subscriber
    !isOwnProfile && !!currentUserId
      ? isActiveSubscriber(currentUserId, id)
      : Promise.resolve(false),
    // creator's candle subscription info
    !isOwnProfile
      ? getCreatorSubscriptionInfo(id)
      : Promise.resolve(null),
    // viewer's candle balance for subscription button
    shouldFetchCandleBalance
      ? (async () => {
          const { getSupabaseAdmin } = await import("@/lib/supabase/admin");
          const admin = getSupabaseAdmin();
          if (!admin) return 0;
          const { data } = await admin
            .from("users")
            .select("candle_balance")
            .eq("id", currentUserId!)
            .single();
          return data?.candle_balance ?? 0;
        })()
      : Promise.resolve(0),
  ]);

  if (!user) {
    return (
      <main className="mx-auto w-full max-w-2xl px-4 py-12">
        <div className="rounded-2xl border border-theme-danger/20 bg-theme-danger-bg p-6 text-theme-danger">
          <h1 className="text-xl font-semibold">프로필을 불러올 수 없습니다</h1>
          <p className="mt-2 text-sm">
            {errorMessage ?? "존재하지 않는 사용자이거나 오류가 발생했습니다."}
          </p>
        </div>
      </main>
    );
  }

  const blocked = currentUserId ? isBlocked(currentUserId, id) : false;
  const muted = currentUserId ? isMuted(currentUserId, id) : false;
  const following = currentUserId ? viewerFollowingIds.includes(user.id) : false;

  const normalPosts = posts.filter((p) => p.category !== "SHORTS");

  const rawShortsPosts = posts.filter((p) => p.category === "SHORTS");
  const shortsPosts = activeTab === "shorts"
    ? await Promise.all(
        rawShortsPosts.map(async (p) => {
          const signedUrls = await Promise.all(
            (p.mediaUrls ?? []).map((url) => getVideoSignedReadUrlAction(url)),
          );
          return { ...p, mediaUrls: signedUrls.map((s, i) => s ?? p.mediaUrls![i]) };
        }),
      )
    : rawShortsPosts;

  return (
    <ProfileShell
      user={user}
      currentUserId={currentUserId}
      following={following}
      isMuted={muted}
      isBlocked={blocked}
      postsCount={normalPosts.length}
      followerCount={followerIds.length}
      followingCount={followingIds.length}
      subscriberCount={crowSubscriberCount}
      viewerIsActiveSubscriber={viewerIsActiveSub}
    >
      {activeTab === "posts" && (
        <ProfilePostsTab
          posts={normalPosts}
          currentUserId={currentUserId}
          blocked={blocked}
          isOwnProfile={currentUserId === user.id}
        />
      )}
      {activeTab === "shorts" && (
        <ProfileShortsTab
          posts={shortsPosts}
          currentUserId={currentUserId}
          blocked={blocked}
          isOwnProfile={currentUserId === user.id}
        />
      )}
      {activeTab === "crow" && isOwnProfile && (
        <ProfileCrowTab
          profileId={user.id}
          isOwnProfile={true}
          subscriptions={mySubscriptions}
        />
      )}
      {activeTab === "crow" && !isOwnProfile && (
        <ProfileCrowTab
          profileId={user.id}
          isOwnProfile={false}
          creatorId={user.id}
          creatorName={user.name}
          subscriberCount={crowSubscriberCount}
          isSubscribed={viewerIsSubscribed}
          isActiveSubscriber={viewerIsActiveSub}
          isLoggedIn={!!currentUserId}
          candlesPerMonth={creatorSubInfo?.candlesPerMonth ?? null}
          userCandleBalance={viewerCandleBalance}
        />
      )}
      {activeTab === "spiritual" && (
        <ProfileSpiritualTab
          profileId={user.id}
          isOwnProfile={currentUserId === user.id}
          prayerNotes={prayerNotes}
          lifeNotes={lifeNotes}
          section={spiritualSection}
        />
      )}
    </ProfileShell>
  );
}
