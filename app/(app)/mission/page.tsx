import Link from "next/link";
import { TimelineContainer } from "@/components/TimelineContainer";
import { getCurrentUser } from "@/lib/data/repository";
import { listFeedPostsPage, isBlocked, isMuted } from "@/lib/data/repository";
import { canViewPost } from "@/lib/domain/guards";
import { encodeCursor } from "@/lib/domain/pagination";
import { findCountryByCode } from "@/lib/mission/countries";
import { MissionCountryFilter } from "./_components/MissionCountryFilter";
import { MissionHubInfiniteList } from "./_components/MissionHubInfiniteList";

export const metadata = { title: "선교 – Cellah" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;
const MISSION_TAGS = ["mission", "선교"];

function hasAnyTag(postTags: string[] | null | undefined, candidates: string[]): boolean {
  if (!Array.isArray(postTags) || postTags.length === 0) return false;
  const lower = postTags.map((t) => t.toLowerCase());
  return candidates.some((c) => lower.includes(c.toLowerCase()));
}

export default async function MissionPage({
  searchParams,
}: {
  searchParams: Promise<{ country?: string }>;
}) {
  const currentUser = await getCurrentUser();
  const params = await searchParams;
  const countryCode = params.country?.toUpperCase() ?? null;
  const country = countryCode ? findCountryByCode(countryCode) : undefined;
  const countryTags = country?.tags ?? null;

  const firstPage = await listFeedPostsPage({
    currentUserId: currentUser?.id ?? null,
    scope: "ALL",
    limit: PAGE_SIZE,
    cursor: null,
    includeCategories: ["MISSION", "CONTENT", "PHOTO"],
  });

  const visibleItems = currentUser
    ? firstPage.items.filter((post) => {
        if (isBlocked(currentUser.id, post.authorId)) return false;
        if (isMuted(currentUser.id, post.authorId)) return false;
        return canViewPost(post, currentUser, () => false);
      })
    : firstPage.items;

  const missionItems = visibleItems.filter((post) => {
    const tags = post.tags ?? [];
    if (!hasAnyTag(tags, MISSION_TAGS) && post.category !== "MISSION") return false;
    if (countryTags && countryTags.length > 0) return hasAnyTag(tags, countryTags);
    return true;
  });

  return (
    <TimelineContainer>
      <div className="pt-2 pb-8">
        <div className="px-4 pt-2 pb-3 border-b border-theme-border bg-theme-surface sticky top-0 z-10">
          <h1 className="text-[18px] font-semibold text-theme-text">세계 선교</h1>
          <p className="text-[13px] text-theme-muted mt-0.5 leading-relaxed">
            국가로 필터링하여 선교 소식을 확인하세요
          </p>
        </div>

        <MissionCountryFilter />

        <div className="px-4 py-3 flex items-center justify-between border-b border-theme-border/60">
          <p className="text-[12px] text-theme-muted">
            {country ? `${country.flag} ${country.name}` : "전체"} · 최신순
          </p>
          {country && (
            <Link
              href={`/mission/${country.code}`}
              className="text-[12px] text-theme-primary hover:opacity-80"
            >
              국가 페이지 →
            </Link>
          )}
        </div>

        {firstPage.error ? (
          <div className="mx-4 my-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            선교 피드를 불러올 수 없습니다. {firstPage.error}
          </div>
        ) : (
          <div className="px-4 pt-4">
            <MissionHubInfiniteList
              initialItems={missionItems}
              initialNextCursorStr={firstPage.nextCursor ? encodeCursor(firstPage.nextCursor) : null}
              countryCode={countryCode}
            />
          </div>
        )}

        {/* Write CTA */}
        <div className="px-4 pt-6 border-t border-theme-border/40">
          <div className="rounded-2xl border border-theme-border bg-theme-surface px-5 py-4 space-y-2">
            <p className="text-[14px] font-semibold text-theme-text">선교 소식 나누기</p>
            <p className="text-[13px] text-theme-muted leading-relaxed">
              현장의 기도 제목, 사역 업데이트, 감사 나눔을
              <br />
              선교 탭에 올려보세요.
            </p>
            <Link
              href={country ? `/write?category=MISSION&country=${country.code}` : "/write?category=MISSION"}
              className="inline-block mt-1 text-[13px] font-semibold text-theme-primary hover:opacity-80"
            >
              + 선교 소식 올리기 →
            </Link>
          </div>
        </div>

        {/* Missionary dashboard link */}
        {currentUser?.role === "MISSIONARY" && (
          <div className="px-4">
            <div className="rounded-2xl border border-theme-primary/30 bg-theme-primary/5 px-5 py-4 space-y-2">
              <p className="text-[14px] font-semibold text-theme-text">선교사 대시보드</p>
              <p className="text-[13px] text-theme-muted">
                내 선교 프로젝트를 등록하고 후원자를 연결하세요.
              </p>
              <div className="flex gap-4 pt-1">
                <Link
                  href="/missionary"
                  className="text-[13px] font-medium text-theme-primary hover:opacity-80"
                >
                  대시보드 →
                </Link>
                <Link
                  href="/missionary/project/create"
                  className="text-[13px] font-medium text-theme-primary hover:opacity-80"
                >
                  프로젝트 등록 →
                </Link>
              </div>
            </div>
          </div>
        )}

      </div>
    </TimelineContainer>
  );
}
