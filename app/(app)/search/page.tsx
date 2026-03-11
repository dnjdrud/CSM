import { Suspense } from "react";
import Link from "next/link";
import { getCurrentUser } from "@/lib/data/repository";
import { searchPosts, searchPeople, searchTags } from "@/lib/data/repository";
import { Skeleton } from "@/components/ui/Skeleton";
import { SearchTabs } from "./_components/SearchTabs";
import { SearchResults, type SearchTab } from "./_components/SearchResults";
import { SearchForm } from "./_components/SearchForm";

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

  if (currentUser && (q || (tab === "people" && (role || denomination)))) {
    const [postsResult, peopleResult, tagsResult] = await Promise.all([
      q ? searchPosts({ q, currentUserId: currentUser.id, scope: "ALL" }) : Promise.resolve([]),
      searchPeople({ q, viewerId: currentUser.id, role, denomination }),
      q ? Promise.resolve(searchTags(q)) : Promise.resolve([]),
    ]);
    posts = postsResult;
    people = peopleResult;
    tags = tagsResult;
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Link
        href="/feed"
        className="text-sm text-gray-500 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 rounded mb-6 inline-block"
      >
        ← 피드로 돌아가기
      </Link>
      <h1 className="text-2xl font-serif font-normal text-gray-800 tracking-tight">
        검색
      </h1>
      <p className="mt-2 text-gray-600 font-sans text-sm">
        포스트, 사람, 주제를 찾아보세요.
      </p>

      <Suspense fallback={
        <div className="mt-4 flex gap-2">
          <Skeleton className="h-10 flex-1 rounded-md" />
          <Skeleton className="h-10 w-24 rounded-md" />
        </div>
      }>
        <SearchForm initialQ={q} initialTab={tab} initialRole={role} initialDenomination={denomination} />
      </Suspense>

      <div className="mt-6">
        <Suspense fallback={<div className="flex gap-6 border-b border-gray-200 pb-3"><div className="h-4 w-12 rounded bg-gray-100 animate-pulse" /><div className="h-4 w-14 rounded bg-gray-100 animate-pulse" /><div className="h-4 w-10 rounded bg-gray-100 animate-pulse" /></div>}>
          <SearchTabs currentTab={tab} />
        </Suspense>
        <SearchResults tab={tab} q={q} posts={posts} people={people} tags={tags} />
      </div>
    </div>
  );
}
