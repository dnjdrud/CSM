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
import { MissionContentSection } from "./_components/MissionContentSection";

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

  const [missionPage, contentPage] = await Promise.all([
    listFeedPostsPage({
      currentUserId: uid,
      scope: "ALL",
      limit: PAGE_SIZE,
      cursor: null,
      includeCategories: ["MISSION"],
    }),
    listFeedPostsPage({
      currentUserId: uid,
      scope: "ALL",
      limit: 10,
      cursor: null,
      includeCategories: ["CONTENT", "PHOTO"],
    }),
  ]);

  function filterVisible<T extends { tags: string[]; authorId: string }>(items: T[]): T[] {
    const moderated = currentUser
      ? items.filter((p) => {
          if (isBlocked(currentUser.id, p.authorId)) return false;
          if (isMuted(currentUser.id, p.authorId)) return false;
          return canViewPost(
            p as unknown as Parameters<typeof canViewPost>[0],
            currentUser,
            () => false
          );
        })
      : items;
    return filterByCountryTags(moderated, countryData.tags);
  }

  const missionVisible = filterVisible(missionPage.items);
  const contentVisible = filterVisible(contentPage.items);

  // 분리 규칙:
  // - 선교 소식: 카테고리 MISSION 이면서 YouTube URL 이 없는 글
  // - 관련 콘텐츠: 카테고리 CONTENT/PHOTO 이거나, MISSION 이지만 YouTube URL 이 붙은 글
  const missionItems = missionVisible.filter((p) => !p.youtubeUrl);

  const contentFromMission = missionVisible.filter((p) => !!p.youtubeUrl);
  const contentItemsMap = new Map<string, (typeof contentVisible)[number]>();
  contentVisible.forEach((p) => contentItemsMap.set(p.id as string, p));
  contentFromMission.forEach((p) => {
    contentItemsMap.set(p.id as string, p);
  });
  const contentItems = Array.from(contentItemsMap.values());

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

      {/* Section A: 선교 소식 */}
      <section aria-labelledby="mission-posts-heading">
        <div className="flex items-center justify-between px-1 py-3 border-b border-theme-border/60 mb-0">
          <h2
            id="mission-posts-heading"
            className="text-[13px] font-semibold text-theme-text flex items-center gap-1.5"
          >
            <MissionSectionIcon type="mission" />
            선교 소식
          </h2>
          <Link
            href={writeUrl}
            className="text-[12px] font-medium text-theme-primary hover:opacity-80"
          >
            + 올리기
          </Link>
        </div>

        {missionPage.error ? (
          <div className="mx-0 my-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            게시글을 불러올 수 없습니다. {missionPage.error}
          </div>
        ) : (
          <MissionFeedSection
            items={missionItems}
            country={countryData}
            writeUrl={writeUrl}
          />
        )}
      </section>

      {/* Section B: 관련 콘텐츠 */}
      <section
        aria-labelledby="mission-content-heading"
        className="mt-6 pt-6 border-t border-theme-border/40"
      >
        <div className="flex items-center justify-between px-1 mb-3">
          <h2
            id="mission-content-heading"
            className="text-[13px] font-semibold text-theme-text flex items-center gap-1.5"
          >
            <MissionSectionIcon type="content" />
            관련 콘텐츠
          </h2>
          <Link
            href="/contents"
            className="text-[12px] text-theme-muted hover:text-theme-text transition-colors"
          >
            전체 보기 →
          </Link>
        </div>

        {contentPage.error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            콘텐츠를 불러올 수 없습니다. {contentPage.error}
          </div>
        ) : (
          <MissionContentSection items={contentItems} country={countryData} currentUserId={uid} />
        )}
      </section>
    </TimelineContainer>
  );
}

function MissionSectionIcon({ type }: { type: "mission" | "content" }) {
  if (type === "content") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4 text-theme-muted" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M7 5v14" />
        <path d="M17 5v14" />
        <path d="M3 9h4" />
        <path d="M17 9h4" />
        <path d="M3 15h4" />
        <path d="M17 15h4" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 text-theme-muted" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M7 20l-1-8 3-6 2 2-2 4" />
      <path d="M17 20l1-8-3-6-2 2 2 4" />
      <path d="M10 6l2-2 2 2" />
    </svg>
  );
}
