import Link from "next/link";
import { TimelineContainer } from "@/components/TimelineContainer";
import {
  getUserById,
  listPostsByAuthorId,
  getCurrentUser,
  isFollowing,
  isBlocked,
  isMuted,
  listSharedNotesByUserId,
} from "@/lib/data/repository";
import { notFound } from "next/navigation";
import { getProfileSectionOrder } from "@/lib/profile/roleProfileConfig";
import type { ProfileSectionId } from "@/lib/profile/roleProfileConfig";
import { ProfileHero } from "./_components/ProfileHero";
import { ProfileStatsStrip } from "./_components/ProfileStatsStrip";
import { ProfileSection } from "./_components/ProfileSection";
import { FeaturedNotes } from "./_components/FeaturedNotes";
import { FeaturedTestimonies } from "./_components/FeaturedTestimonies";
import { RecentPosts } from "./_components/RecentPosts";
import { ProfileAboutSection } from "./_components/ProfileAboutSection";
import { ProfileViewAllNotes } from "./_components/ProfileViewAllNotes";
import { ProfileViewAllPosts } from "./_components/ProfileViewAllPosts";
import { DeleteAccountSection } from "./_components/DeleteAccountSection";
import { canRestore } from "@/lib/security/accountLifecycle";

const VIEW_OPTIONS = ["notes", "testimonies", "posts"] as const;
type ViewParam = (typeof VIEW_OPTIONS)[number];

function parseView(view?: string): ViewParam | undefined {
  if (!view) return undefined;
  const v = view.toLowerCase();
  return VIEW_OPTIONS.includes(v as ViewParam) ? (v as ViewParam) : undefined;
}

export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  const { id } = await params;
  const { view: viewParam } = await searchParams;
  const view = parseView(viewParam);

  const [user, currentUser, userPosts, sharedNotes] = await Promise.all([
    getUserById(id),
    getCurrentUser(),
    listPostsByAuthorId(id),
    listSharedNotesByUserId({
      userId: id,
      type: "PRAYER",
      limit: view === "notes" ? 100 : 50,
    }),
  ]);

  if (!user) notFound();

  const profileUser = user;
  const testimonies = userPosts.filter((p) => p.category === "TESTIMONY");
  const postsExcludingTestimonies = userPosts.filter((p) => p.category !== "TESTIMONY");

  const sharedNotesCount = sharedNotes.length;
  const postsCount = userPosts.length;
  const testimoniesCount = testimonies.length;

  const isOwnProfile = currentUser?.id === id;
  const following = currentUser ? await isFollowing(currentUser.id, id) : false;
  const muted = currentUser ? isMuted(currentUser.id, id) : false;
  const blocked = currentUser ? isBlocked(currentUser.id, id) : false;

  const sectionOrder = getProfileSectionOrder(profileUser.role, testimoniesCount > 0);

  if (view) {
    const profileHref = `/profile/${id}`;
    const currentUserId = currentUser?.id ?? null;
    return (
      <TimelineContainer>
        <div className="pt-4 pb-4">
          <Link
            href={profileHref}
            className="text-[14px] text-gray-500 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 rounded"
          >
            ← Back to profile
          </Link>
        </div>
        {view === "notes" && (
          <>
            <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
              All Notes
            </h1>
            <p className="mt-1 text-[15px] text-gray-600 leading-relaxed">
              Shared notes from this profile, newest first.
            </p>
            <div className="mt-6">
              <ProfileViewAllNotes
                notes={sharedNotes}
                profileId={id}
                blocked={blocked}
              />
            </div>
          </>
        )}
        {view === "testimonies" && (
          <>
            <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
              All Testimonies
            </h1>
            <p className="mt-1 text-[15px] text-gray-600 leading-relaxed">
              Testimonies shared by this person.
            </p>
            <div className="mt-6">
              <ProfileViewAllPosts
                posts={testimonies}
                profileId={id}
                currentUserId={currentUserId}
                blocked={blocked}
              />
            </div>
          </>
        )}
        {view === "posts" && (
          <>
            <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
              All Posts
            </h1>
            <p className="mt-1 text-[15px] text-gray-600 leading-relaxed">
              Recent posts, excluding testimonies.
            </p>
            <div className="mt-6">
              <ProfileViewAllPosts
                posts={postsExcludingTestimonies}
                profileId={id}
                currentUserId={currentUserId}
                blocked={blocked}
              />
            </div>
          </>
        )}
      </TimelineContainer>
    );
  }

  function renderSection(sectionId: ProfileSectionId, index: number) {
    const profileId = id;
    const currentUserId = currentUser?.id ?? null;
    const isFirst = index === 0;
    switch (sectionId) {
      case "notes":
        return (
          <ProfileSection
            key="notes"
            id="notes"
            title="Notes"
            isFirst={isFirst}
            seeAllHref={sharedNotesCount > 3 ? `/profile/${profileId}/notes` : undefined}
            seeAllLabel="See all"
          >
            <FeaturedNotes
              notes={sharedNotes}
              profileId={profileId}
              blocked={blocked}
            />
          </ProfileSection>
        );
      case "testimonies":
        return (
          <ProfileSection
            key="testimonies"
            id="testimonies"
            title="Testimonies"
            isFirst={isFirst}
            seeAllHref={testimoniesCount > 3 ? `/profile/${profileId}/testimonies` : undefined}
            seeAllLabel="See all"
          >
            <FeaturedTestimonies
              posts={testimonies}
              profileId={profileId}
              currentUserId={currentUserId}
              blocked={blocked}
            />
          </ProfileSection>
        );
      case "posts":
        return (
          <ProfileSection
            key="posts"
            id="posts"
            title="Recent posts"
            isFirst={isFirst}
            seeAllHref={postsExcludingTestimonies.length > 5 ? `/profile/${profileId}/posts` : undefined}
            seeAllLabel="See all"
          >
            <RecentPosts
              posts={postsExcludingTestimonies}
              profileId={profileId}
              currentUserId={currentUserId}
              blocked={blocked}
            />
          </ProfileSection>
        );
      case "about":
        return (
          <ProfileSection key="about" id="about" title="About" isFirst={isFirst}>
            <ProfileAboutSection user={profileUser} />
          </ProfileSection>
        );
      default:
        return null;
    }
  }

  return (
    <TimelineContainer>
      <div className="pt-4 pb-6">
        <Link
          href="/feed"
          className="text-[14px] text-gray-500 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 rounded"
        >
          ← Back to feed
        </Link>
      </div>

      <ProfileHero
        user={user}
        isOwnProfile={isOwnProfile}
        following={following}
        isMuted={muted}
        isBlocked={blocked}
        currentUserId={currentUser?.id ?? null}
      />

      <ProfileStatsStrip
        sharedNotesCount={sharedNotesCount}
        postsCount={postsCount}
        testimoniesCount={testimoniesCount}
      />

      {sectionOrder.map((sectionId, index) => renderSection(sectionId, index))}

      {!isOwnProfile && user.role !== "MISSIONARY" && (
        <section
          className="mt-10 pt-8 border-t border-gray-200"
          aria-labelledby="support-heading"
        >
          <h2 id="support-heading" className="sr-only">
            Support
          </h2>
          <Link
            href="/support"
            className="inline-block rounded-md border border-gray-200 bg-transparent px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2"
          >
            Support this work
          </Link>
        </section>
      )}

      {isOwnProfile && (
        <DeleteAccountSection
          canRestore={canRestore(user.deactivatedAt)}
          isDeactivated={Boolean(user.deactivatedAt)}
        />
      )}
    </TimelineContainer>
  );
}
