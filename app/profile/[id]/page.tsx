import Link from "next/link";
import { notFound } from "next/navigation";
import { getProfileById, getUserPosts } from "@/lib/data/profileRepository";
import { getCurrentUser } from "@/lib/data/repository";
import { PostCard } from "@/components/PostCard";

export const dynamic = "force-dynamic";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [profile, posts, currentUser] = await Promise.all([
    getProfileById(id),
    getUserPosts(id),
    getCurrentUser(),
  ]);

  if (!profile) notFound();

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-6">
        <Link
          href="/feed"
          className="text-[14px] text-theme-muted hover:text-theme-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary focus-visible:ring-offset-2 rounded"
        >
          ← Back to feed
        </Link>
      </div>

      {/* Profile header */}
      <header className="border-b border-theme-border/60 pb-6 mb-6">
        <h1 className="text-xl font-semibold text-theme-primary tracking-tight">
          {profile.name || "Unnamed"}
        </h1>
        {profile.bio && (
          <p className="mt-2 text-[15px] text-theme-text leading-relaxed">
            {profile.bio}
          </p>
        )}
        {profile.affiliation && (
          <p className="mt-1 text-[14px] text-theme-muted">
            Church: {profile.affiliation}
          </p>
        )}
      </header>

      {/* List of posts */}
      <section aria-label="Posts">
        {posts.length === 0 ? (
          <p className="text-theme-muted text-[15px]">
            No posts yet. Be the first to share.
          </p>
        ) : (
          <ul className="list-none p-0 space-y-6">
            {posts.map((post) => (
              <li key={post.id}>
                <PostCard
                  post={post}
                  currentUserId={currentUser?.id ?? null}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
