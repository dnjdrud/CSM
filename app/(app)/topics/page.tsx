import Link from "next/link";
import { listPopularTags } from "@/lib/data/repository";
import { TagPill } from "@/components/TagPill";
import { EmptyState } from "@/components/ui/EmptyState";

export default async function TopicsPage() {
  let popular: { tag: string; sampleCount: number }[] = [];
  try {
    popular = await listPopularTags(20);
  } catch (e) {
    console.error("listPopularTags failed", e);
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
        Topics
      </h1>
      <p className="mt-2 text-gray-600 font-sans text-sm">
        Find posts by topic. No trends, just categories.
      </p>
      {popular.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="Nothing here yet"
            description="Topics appear when posts are tagged. Share something to get started."
            action={{ label: "Write a post", href: "/write" }}
          />
        </div>
      ) : (
        <div className="mt-8 flex flex-wrap gap-2" role="list" aria-label="Topics">
          {popular.map(({ tag }) => (
            <TagPill key={tag} tag={tag} />
          ))}
        </div>
      )}
      <p className="mt-8 text-center">
        <Link
          href="/search"
          className="text-sm text-gray-500 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 rounded"
        >
          Search posts & people →
        </Link>
      </p>
    </div>
  );
}
