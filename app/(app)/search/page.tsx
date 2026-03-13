import { Suspense } from "react";
import { getCurrentUser } from "@/lib/data/repository";
import { searchPosts, searchPeople, searchTags, listFeedPostsPage } from "@/lib/data/repository";
import { Skeleton } from "@/components/ui/Skeleton";
import { TimelineContainer } from "@/components/TimelineContainer";
import { PostCard } from "@/components/PostCard";
import { SearchTabs } from "./_components/SearchTabs";
import { SearchResults, type SearchTab } from "./_components/SearchResults";
import { SearchForm } from "./_components/SearchForm";

export const dynamic = "force-dynamic";

const VALID_TABS: SearchTab[] = ["posts", "people", "tags"];

function parseTab(tab: string | null): SearchTab {
  if (tab && VALID_TABS.includes(tab as SearchTab)) return tab as SearchTab;
  return "posts";
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tab?: string; role?: string; denomination?: string }>;
}) {
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const tab = parseTab(params.tab ?? null);
  const role = params.role?.trim() || undefined;
  const denomination = params.denomination?.trim() || undefined;
  const currentUser = await getCurrentUser();

  let posts: Awaited<ReturnType<typeof searchPosts>> = [];
  let people: Awaited<ReturnType<typeof searchPeople>> = [];
  let tags: string[] = [];
  let recentPosts: Awaited<ReturnType<typeof listFeedPostsPage>>["items"] = [];

  if (currentUser && (q || (tab === "people" && (role || denomination)))) {
    const [postsResult, peopleResult, tagsResult] = await Promise.all([
      q ? searchPosts({ q, currentUserId: currentUser.id, scope: "ALL" }) : Promise.resolve([]),
      searchPeople({ q, viewerId: currentUser.id, role, denomination }),
      q ? Promise.resolve(searchTags(q)) : Promise.resolve([]),
    ]);
    posts = postsResult;
    people = peopleResult;
    tags = tagsResult;
  } else if (currentUser && !q) {
    const result = await listFeedPostsPage({
      currentUserId: currentUser.id,
      scope: "ALL",
      limit: 7,
    });
    recentPosts = result.items;
  }

  return (
    <TimelineContainer>
      <div className="px-4 pt-5 pb-4 border-b border-theme-border">
        <h1 className="text-[17px] font-semibold text-theme-text mb-3">검색</h1>
        <Suspense fallback={
          <div className="flex gap-2">
            <Skeleton className="h-10 flex-1 rounded-md" />
            <Skeleton className="h-10 w-16 rounded-md" />
          </div>
        }>
          <SearchForm initialQ={q} initialTab={tab} initialRole={role} initialDenomination={denomination} />
        </Suspense>
      </div>

      {!q && recentPosts.length > 0 && (
        <div>
          <div className="px-4 pt-4 pb-2">
            <p className="text-[12px] font-semibold text-theme-muted uppercase tracking-wide">최신 게시글</p>
          </div>
          <ul className="list-none p-0" role="list">
            {recentPosts.map((post) => (
              <li key={post.id}>
                <PostCard post={post} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {q && (
        <div>
          <div className="sticky top-0 z-10 bg-theme-surface border-b border-theme-border px-4 pt-3">
            <Suspense fallback={<div className="flex gap-4 pb-3"><div className="h-4 w-12 rounded bg-theme-border animate-pulse" /><div className="h-4 w-14 rounded bg-theme-border animate-pulse" /></div>}>
              <SearchTabs currentTab={tab} />
            </Suspense>
          </div>
          <SearchResults tab={tab} q={q} posts={posts} people={people} tags={tags} />
        </div>
      )}
    </TimelineContainer>
  );
}
