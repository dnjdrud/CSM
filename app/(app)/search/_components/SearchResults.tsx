import Link from "next/link";
import type { PostWithAuthor } from "@/lib/domain/types";
import type { User } from "@/lib/domain/types";
import { ROLE_DISPLAY } from "@/lib/domain/types";
import { PostCard } from "@/components/PostCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { TagPill } from "@/components/TagPill";
import { Highlight } from "@/components/ui/Highlight";

export type SearchTab = "posts" | "people" | "tags";

interface SearchResultsProps {
  tab: SearchTab;
  q: string;
  posts: PostWithAuthor[];
  people: User[];
  tags: string[];
}

export function SearchResults({ tab, q, posts, people, tags }: SearchResultsProps) {
  if (tab === "posts") {
    if (posts.length === 0) {
      return (
        <div className="mt-6">
          <EmptyState
            title={q ? "No matches" : "Nothing here yet"}
            description={q ? "Try different words or browse the feed." : "Search posts, people, and topics above."}
          />
        </div>
      );
    }
    return (
      <ul className="list-none p-0 mt-6" role="list">
        {posts.map((post) => (
          <li key={post.id}>
            <PostCard post={post} />
          </li>
        ))}
      </ul>
    );
  }

  if (tab === "people") {
    if (people.length === 0) {
      return (
        <div className="mt-6">
          <EmptyState
            title={q ? "No matches" : "Nothing here yet"}
            description={q ? "Try different words or browse the feed." : "Search posts, people, and topics above."}
          />
        </div>
      );
    }
    return (
      <ul className="list-none p-0 mt-6 space-y-3" role="list">
        {people.map((user) => (
          <li key={user.id}>
            <Link
              href={`/profile/${user.id}`}
              className="block rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <span className="font-medium text-gray-900 text-[14px]">
                    <Highlight text={user.name} query={q} />
                  </span>
                  <span className="text-gray-500 text-[12px] ml-2">{ROLE_DISPLAY[user.role]}</span>
                  {user.affiliation && (
                    <p className="mt-0.5 text-[13px] text-gray-600 truncate">
                      <Highlight text={user.affiliation} query={q} />
                    </p>
                  )}
                  {user.bio && (
                    <p className="mt-0.5 text-[12px] text-gray-400 line-clamp-1">
                      <Highlight text={user.bio} query={q} />
                    </p>
                  )}
                </div>
                {user.supportUrl && (
                  <span className="shrink-0 text-[11px] text-gray-400 mt-0.5">🙌 후원</span>
                )}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    );
  }

  // tags
  if (tags.length === 0) {
    return (
      <div className="mt-6">
        <EmptyState
          title={q ? "No matches" : "Nothing here yet"}
          description={q ? "Try different words or browse the feed." : "Search posts, people, and topics above."}
        />
      </div>
    );
  }
  return (
    <div className="mt-6 flex flex-wrap gap-2" role="list" aria-label="Tags">
      {tags.map((tag) => (
        <TagPill key={tag} tag={tag} />
      ))}
    </div>
  );
}
