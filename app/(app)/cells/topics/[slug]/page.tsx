import { notFound } from "next/navigation";
import Link from "next/link";
import { TimelineContainer } from "@/components/TimelineContainer";
import {
  getCurrentUser,
  listFeedPostsPage,
  isBlocked,
  isMuted,
} from "@/lib/data/repository";
import { canViewPost } from "@/lib/domain/guards";
import { encodeCursor } from "@/lib/domain/pagination";
import { findTopicBySlug, TOPIC_COLOR_CLASSES, CELL_TOPICS } from "@/lib/cells/topics";
import { TopicFeedInfiniteList } from "./_components/TopicFeedInfiniteList";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const topic = findTopicBySlug(slug);
  if (!topic) return {};
  return { title: `${topic.name} – Cellah 셀` };
}

const PAGE_SIZE = 30;

function filterByTopicTags<T extends { tags: string[] }>(items: T[], topicTags: string[]): T[] {
  return items.filter((post) => {
    if (!Array.isArray(post.tags) || post.tags.length === 0) return false;
    return topicTags.some((topicTag) =>
      post.tags.some((postTag) => postTag.toLowerCase() === topicTag.toLowerCase())
    );
  });
}

export default async function TopicFeedPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const _topicLookup = findTopicBySlug(slug);
  if (!_topicLookup) notFound();
  const topic = _topicLookup;

  const colors = TOPIC_COLOR_CLASSES[topic.color] ?? TOPIC_COLOR_CLASSES["blue"]!;
  const currentUser = await getCurrentUser();
  const uid = currentUser?.id ?? null;

  // 셀 나눔 + 콘텐츠 통합 fetch
  const [cellPage, contentPage] = await Promise.all([
    listFeedPostsPage({
      currentUserId: uid,
      scope: "ALL",
      limit: PAGE_SIZE,
      cursor: null,
      includeCategories: ["CELL"],
    }),
    listFeedPostsPage({
      currentUserId: uid,
      scope: "ALL",
      limit: 20,
      cursor: null,
      includeCategories: ["CONTENT", "PHOTO"],
    }),
  ]);

  function filterVisible<T extends { tags: string[]; authorId: string }>(items: T[]): T[] {
    const moderated = currentUser
      ? items.filter((p) => {
          if (isBlocked(currentUser.id, p.authorId)) return false;
          if (isMuted(currentUser.id, p.authorId)) return false;
          return canViewPost(p as unknown as Parameters<typeof canViewPost>[0], currentUser, () => false);
        })
      : items;
    return filterByTopicTags(moderated, topic.tags);
  }

  // 두 피드 합산 후 최신순 정렬
  const allItems = [
    ...filterVisible(cellPage.items),
    ...filterVisible(contentPage.items),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const writeUrl = `/write?category=CELL&tag=${encodeURIComponent(topic.tags[0] ?? "")}`;

  return (
    <TimelineContainer>
      {/* 뒤로가기 */}
      <div className="pt-1 pb-3">
        <Link
          href="/cells"
          className="text-[13px] text-theme-muted hover:text-theme-text transition-colors"
        >
          ← 셀 목록
        </Link>
      </div>

      {/* 토픽 헤더 */}
      <div className={`rounded-2xl border p-4 mb-4 ${colors.border} ${colors.bg}`}>
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-3">
            <span className="text-2xl" aria-hidden>{topic.icon}</span>
            <h1 className={`text-[18px] font-bold ${colors.text}`}>{topic.name}</h1>
          </div>
          <Link
            href={writeUrl}
            className={`shrink-0 text-[12px] font-semibold px-3 py-1.5 rounded-xl border transition-all ${colors.border} ${colors.badge} hover:opacity-80`}
          >
            + 글쓰기
          </Link>
        </div>
        <p className="text-[13px] text-theme-muted leading-relaxed">{topic.description}</p>
        <div className="flex flex-wrap gap-1.5 mt-2.5">
          {topic.hashtags.map((tag) => (
            <span
              key={tag}
              className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${colors.badge}`}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* 통합 피드 */}
      <section aria-labelledby="topic-feed-heading">
        <div className="flex items-center justify-between px-1 py-3 border-b border-theme-border/60 mb-0">
          <h2
            id="topic-feed-heading"
            className="text-[13px] font-semibold text-theme-text"
          >
            나눔
          </h2>
          <Link
            href={writeUrl}
            className="text-[12px] font-medium text-theme-primary hover:opacity-80"
          >
            + 글쓰기
          </Link>
        </div>

        {cellPage.error ? (
          <div className="mx-0 my-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            게시글을 불러올 수 없습니다. {cellPage.error}
          </div>
        ) : (
          <TopicFeedInfiniteList
            initialItems={allItems}
            initialNextCursorStr={
              allItems.length < cellPage.items.length + contentPage.items.length
                ? null
                : cellPage.nextCursor
                ? encodeCursor(cellPage.nextCursor)
                : null
            }
            currentUserId={uid}
            topic={topic}
          />
        )}
      </section>

      {/* 다른 토픽 */}
      <section aria-labelledby="other-topics-heading" className="mt-8 pt-6 border-t border-theme-border/40">
        <h2
          id="other-topics-heading"
          className="text-[13px] font-semibold text-theme-text mb-3 px-1"
        >
          다른 토픽 보기
        </h2>
        <div className="flex flex-wrap gap-2">
          {CELL_TOPICS.filter((t) => t.slug !== topic.slug).map((t) => (
            <Link
              key={t.slug}
              href={`/cells/topics/${t.slug}`}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-theme-border bg-theme-surface text-[12px] font-medium text-theme-text transition-all duration-200 hover:bg-theme-surface-2 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary focus-visible:ring-offset-2 focus-visible:ring-offset-theme-bg"
            >
              <span aria-hidden>{t.icon}</span>
              {t.name}
            </Link>
          ))}
        </div>
      </section>
    </TimelineContainer>
  );
}
