import { ProfileShell } from "./_components/ProfileShell";
import { ProfilePostsTab } from "./_components/ProfilePostsTab";
import { ProfileShortsTab } from "./_components/ProfileShortsTab";
import { ProfileCrowTab } from "./_components/ProfileCrowTab";
import { ProfileSpiritualTab } from "./_components/ProfileSpiritualTab";
import {
  getProfileWithError,
  listPostsByAuthorId,
  listFollowingIds,
  getFollowCounts,
} from "@/lib/data/repository";
import { isBlocked, isMuted } from "@/lib/data/repository";
import { getAuthUserId } from "@/lib/auth/session";
import { listSpiritualNotes } from "@/lib/data/spiritualRepository";
import {
  listMySubscriptions,
  getViewerCrowContext,
} from "@/lib/data/subscriptionRepository";
import { getVideoSignedReadUrlAction } from "@/app/(app)/write/getUploadUrlAction";

export const dynamic = "force-dynamic";

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
  // Only fetch posts when the posts or shorts tab is active
  const shouldFetchPosts = activeTab === "posts" || activeTab === "shorts";

  const [
    { user, errorMessage },
    posts,
    followCounts,
    viewerFollowingIds,
    prayerNotes,
    lifeNotes,
    mySubscriptions,
    crowContext,
  ] = await Promise.all([
    getProfileWithError(id),
    // Skip post fetch entirely on crow/spiritual tabs — saves the most expensive query
    shouldFetchPosts ? listPostsByAuthorId(id) : Promise.resolve([]),
    // COUNT queries only — no more fetching full ID arrays just for .length
    getFollowCounts(id),
    currentUserId ? listFollowingIds(currentUserId) : Promise.resolve([]),
    shouldFetchSpiritual
      ? listSpiritualNotes(currentUserId!, "prayer")
      : Promise.resolve([]),
    shouldFetchSpiritual
      ? listSpiritualNotes(currentUserId!, "life")
      : Promise.resolve([]),
    shouldFetchCrowList
      ? listMySubscriptions(currentUserId!)
      : Promise.resolve([]),
    // All crow/subscription data in one combined call
    !isOwnProfile
      ? getViewerCrowContext(currentUserId, id)
      : Promise.resolve({
          subscriberCount: 0,
          viewerIsSubscribed: false,
          viewerIsActiveSubscriber: false,
          candlesPerMonth: null,
          viewerCandleBalance: 0,
        }),
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
  const shortsPosts =
    activeTab === "shorts"
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
      followerCount={followCounts.followers}
      followingCount={followCounts.following}
      subscriberCount={crowContext.subscriberCount}
      viewerIsActiveSubscriber={crowContext.viewerIsActiveSubscriber}
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
          subscriberCount={crowContext.subscriberCount}
          isSubscribed={crowContext.viewerIsSubscribed}
          isActiveSubscriber={crowContext.viewerIsActiveSubscriber}
          isLoggedIn={!!currentUserId}
          candlesPerMonth={crowContext.candlesPerMonth}
          userCandleBalance={crowContext.viewerCandleBalance}
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
