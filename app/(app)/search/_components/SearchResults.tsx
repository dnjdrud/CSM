import Link from "next/link";
import type { PostWithAuthor } from "@/lib/domain/types";
import type { User } from "@/lib/domain/types";
import { ROLE_DISPLAY } from "@/lib/domain/types";
import { PostCard } from "@/components/PostCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { TagPill } from "@/components/TagPill";

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
      <ul className="list-none p-0 mt-6 space-y-4" role="list">
        {people.map((user) => (
          <li key={user.id}>
            <Link
              href={`/profile/${user.id}`}
              className="block rounded-md border border-gray-200 bg-gray-50/50 px-4 py-3 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2"
            >
              <span className="font-medium text-gray-800">{user.name}</span>
              <span className="text-gray-500 text-sm ml-2">{ROLE_DISPLAY[user.role]}</span>
              {user.affiliation && (
                <p className="mt-1 text-sm text-gray-600">{user.affiliation}</p>
              )}
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
