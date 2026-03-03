import Link from "next/link";
import { getCurrentUser } from "@/lib/data/repository";
import { listPostsByTag, normalizeTag } from "@/lib/data/repository";
import { TimelineContainer } from "@/components/TimelineContainer";
import { EmptyState } from "@/components/ui/EmptyState";
import { PostCard } from "@/components/PostCard";

export default async function TopicPage({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag } = await params;
  const decoded = decodeURIComponent(tag ?? "");
  const normalized = normalizeTag(decoded);
  if (!normalized) {
    return (
      <TimelineContainer>
        <div className="px-4 pt-10">
          <Link href="/topics" className="text-sm text-neutral-500 hover:text-gray-700">
            ← All topics
          </Link>
          <p className="mt-6 text-[15px] text-neutral-500">Invalid topic.</p>
        </div>
      </TimelineContainer>
    );
  }
  const currentUser = await getCurrentUser();
  const posts = await listPostsByTag(normalized, {
    currentUserId: currentUser?.id ?? null,
    scope: "ALL",
  });

  const displayName = normalized.charAt(0).toUpperCase() + normalized.slice(1);

  return (
    <TimelineContainer>
      <div className="px-4 pt-6">
        <Link
          href="/topics"
          className="text-xs text-neutral-500 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 rounded inline-block mb-4"
        >
          ← All topics
        </Link>
        <h1 className="text-base font-medium text-gray-800">
          {displayName}
        </h1>
      </div>
      {posts.length === 0 ? (
        <div className="px-4 py-6">
          <EmptyState
            title="Nothing here yet"
            description="This topic is quiet for now."
          />
        </div>
      ) : (
        <ul className="list-none p-0 px-4 space-y-4 pb-6" role="list">
          {posts.map((post) => (
            <li key={post.id}>
              <PostCard post={post} currentUserId={currentUser?.id ?? null} />
            </li>
          ))}
        </ul>
      )}
    </TimelineContainer>
  );
}
