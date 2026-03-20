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
import { findCountryByCode } from "@/lib/mission/countries";
import { MissionFeedSection } from "./_components/MissionFeedSection";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ country: string }>;
}) {
  const { country } = await params;
  const c = findCountryByCode(country);
  if (!c) return {};
  return { title: `${c.flag} ${c.name} 선교 – Cellah` };
}

const PAGE_SIZE = 20;

function filterByCountryTags<T extends { tags: string[] }>(
  items: T[],
  countryTags: string[]
): T[] {
  return items.filter((post) => {
    if (!Array.isArray(post.tags) || post.tags.length === 0) return false;
    return countryTags.some((ct) =>
      post.tags.some((pt) => pt.toLowerCase() === ct.toLowerCase())
    );
  });
}

export default async function MissionCountryPage({
  params,
}: {
  params: Promise<{ country: string }>;
}) {
  const { country } = await params;
  const _countryLookup = findCountryByCode(country);
  if (!_countryLookup) notFound();
  const countryData = _countryLookup;

  const currentUser = await getCurrentUser();
  const uid = currentUser?.id ?? null;

  const allPage = await listFeedPostsPage({
    currentUserId: uid,
    scope: "ALL",
    limit: PAGE_SIZE,
    cursor: null,
    includeCategories: ["MISSION", "CONTENT", "PHOTO"],
  });

  const allItems = (currentUser
    ? allPage.items.filter((p) => {
        if (isBlocked(currentUser.id, p.authorId)) return false;
        if (isMuted(currentUser.id, p.authorId)) return false;
        return canViewPost(
          p as unknown as Parameters<typeof canViewPost>[0],
          currentUser,
          () => false
        );
      })
    : allPage.items
  )
    .filter((p) => filterByCountryTags([p], countryData.tags).length > 0)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const writeUrl = `/write?category=MISSION&country=${encodeURIComponent(countryData.code)}`;

  return (
    <TimelineContainer>
      {/* 뒤로가기 */}
      <div className="pt-1 pb-3 px-1">
        <Link
          href="/mission"
          className="text-[13px] text-theme-muted hover:text-theme-text transition-colors"
        >
          ← 세계 선교
        </Link>
      </div>

      {/* 국가 헤더 */}
      <div className="rounded-2xl border border-theme-border bg-theme-surface p-4 mb-4">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-3">
            <span className="text-3xl" aria-hidden>{countryData.flag}</span>
            <div>
              <h1 className="text-[18px] font-bold text-theme-text">
                {countryData.name}
              </h1>
              <p className="text-[12px] text-theme-muted">{countryData.nameEn}</p>
            </div>
          </div>
          <Link
            href={writeUrl}
            className="shrink-0 text-[12px] font-semibold px-3 py-1.5 rounded-xl border border-theme-border bg-theme-surface-2 text-theme-primary hover:opacity-80 transition-all"
          >
            + 선교 소식
          </Link>
        </div>
        <p className="text-[13px] text-theme-muted leading-relaxed mt-1">
          {countryData.description}
        </p>
        <div className="flex flex-wrap gap-1.5 mt-2.5">
          {countryData.tags.map((tag) => (
            <span
              key={tag}
              className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-theme-accent-bg text-theme-primary"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>

      {/* 통합 피드: 선교 소식 + 콘텐츠 최신순 */}
      <section aria-labelledby="mission-feed-heading">
        <div className="flex items-center justify-between px-1 py-3 border-b border-theme-border/60 mb-0">
          <h2
            id="mission-feed-heading"
            className="text-[13px] font-semibold text-theme-text"
          >
            나눔
          </h2>
          <Link
            href={writeUrl}
            className="text-[12px] font-medium text-theme-primary hover:opacity-80"
          >
            + 올리기
          </Link>
        </div>

        {allPage.error ? (
          <div className="mx-0 my-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            게시글을 불러올 수 없습니다. {allPage.error}
          </div>
        ) : (
          <MissionFeedSection
            items={allItems}
            country={countryData}
            writeUrl={writeUrl}
          />
        )}
      </section>
    </TimelineContainer>
  );
}

