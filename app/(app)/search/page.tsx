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
  searchParams: Promise<{ q?: string; tab?: string }>;
}) {
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const tab = parseTab(params.tab ?? null);
  const currentUser = await getCurrentUser();

  let posts: Awaited<ReturnType<typeof searchPosts>> = [];
  let people: Awaited<ReturnType<typeof searchPeople>> = [];
  let tags: string[] = [];

  const loadPeople = currentUser && (q || tab === "people");
  if (q && currentUser) {
    const [postsResult, peopleResult, tagsResult] = await Promise.all([
      searchPosts({ q, currentUserId: currentUser.id, scope: "ALL" }),
      loadPeople ? searchPeople({ q, viewerId: currentUser.id }) : Promise.resolve([]),
      Promise.resolve(searchTags(q)),
    ]);
    posts = postsResult;
    people = peopleResult;
    tags = tagsResult;
  } else if (loadPeople) {
    people = await searchPeople({ q, viewerId: currentUser!.id });
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Link
        href="/feed"
        className="text-sm text-gray-500 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 rounded mb-6 inline-block"
      >
        ← Back to feed
      </Link>
      <h1 className="text-2xl font-serif font-normal text-gray-800 tracking-tight">
        Search
      </h1>
      <p className="mt-2 text-gray-600 font-sans text-sm">
        Find posts, people, and topics. No algorithms.
      </p>

      <Suspense fallback={
        <div className="mt-4 flex gap-2">
          <Skeleton className="h-10 flex-1 rounded-md" />
          <Skeleton className="h-10 w-24 rounded-md" />
        </div>
      }>
        <SearchForm initialQ={q} initialTab={tab} />
      </Suspense>

      <div className="mt-6">
        <SearchTabs currentTab={tab} />
        <SearchResults tab={tab} q={q} posts={posts} people={people} tags={tags} />
      </div>
    </div>
  );
}
