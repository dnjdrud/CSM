import Link from "next/link";
import type { PostWithAuthor } from "@/lib/domain/types";
import type { MissionCountry } from "@/lib/mission/countries";
import { ContentCard } from "@/app/(app)/contents/_components/ContentCard";
// ContentCard is a "use client" component — safe to import from a server component as a leaf

type Props = {
  items: PostWithAuthor[];
  country: MissionCountry;
  currentUserId: string | null;
};

export function MissionContentSection({ items, country, currentUserId }: Props) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-theme-border px-5 py-8 text-center space-y-1.5">
        <p className="text-[13px] text-theme-muted">
          {country.name} 관련 콘텐츠가 아직 없습니다.
        </p>
        <p className="text-[12px] text-theme-muted">
          콘텐츠에{" "}
          <strong>#{country.tags[0]}</strong> 태그를 달면 여기에 표시됩니다.
        </p>
        <Link
          href="/write?category=CONTENT"
          className="inline-block mt-1 text-[12px] text-theme-primary hover:opacity-80"
        >
          콘텐츠 올리기 →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((post) => (
        <ContentCard key={post.id} post={post} currentUserId={currentUserId} />
      ))}
    </div>
  );
}
