import Link from "next/link";
import { notFound } from "next/navigation";
import { getUserById, listPostsByAuthorId } from "@/lib/data/repository";
import { ROLE_DISPLAY } from "@/lib/domain/types";

export const dynamic = "force-dynamic";

function postPreview(content: string, title?: string | null): string {
  const t = title?.trim();
  if (t) return t;
  const text = (content ?? "").trim();
  if (text.length <= 80) return text;
  return text.slice(0, 80) + "…";
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [user, posts] = await Promise.all([
    getUserById(id),
    listPostsByAuthorId(id),
  ]);

  if (!user) {
    notFound();
  }

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

      <header className="border-b border-theme-border/60 pb-6 mb-6">
        <h1 className="text-xl font-semibold text-theme-primary tracking-tight">
          {user.name || "Unnamed"}
        </h1>
        {user.role && (
          <p className="mt-1 text-[14px] text-theme-muted">
            Role: {ROLE_DISPLAY[user.role] ?? user.role}
          </p>
        )}
        {user.affiliation && (
          <p className="mt-1 text-[14px] text-theme-muted">
            Affiliation: {user.affiliation}
          </p>
        )}
        {user.bio && (
          <p className="mt-2 text-[15px] text-theme-text leading-relaxed">
            {user.bio}
          </p>
        )}
      </header>

      <section aria-label="Recent posts">
        <h2 className="text-base font-medium text-theme-primary mb-3">
          Recent posts
        </h2>
        {posts.length === 0 ? (
          <p className="text-theme-muted text-[15px]">
            No posts yet.
          </p>
        ) : (
          <ul className="list-none p-0 space-y-3">
            {posts.map((post) => (
              <li key={post.id}>
                <Link
                  href={`/post/${post.id}`}
                  className="block rounded-lg border border-theme-border/60 bg-theme-surface px-3 py-2 text-[15px] text-theme-text hover:bg-theme-border/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary focus-visible:ring-offset-2"
                >
                  {postPreview(post.content, post.title)}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
