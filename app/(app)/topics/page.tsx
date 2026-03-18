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
        href="/home"
        className="text-sm text-gray-500 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 rounded mb-6 inline-block"
      >
        ← 홈으로
      </Link>
      <h1 className="text-2xl font-serif font-normal text-gray-800 tracking-tight">
        태그
      </h1>
      <p className="mt-2 text-gray-600 font-sans text-sm">
        태그별로 게시글을 찾아보세요.
      </p>
      {popular.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="아직 태그가 없습니다"
            description="게시글에 태그를 붙이면 여기에 표시됩니다."
            action={{ label: "글 쓰기", href: "/write" }}
          />
        </div>
      ) : (
        <div className="mt-8 flex flex-wrap gap-2" role="list" aria-label="태그 목록">
          {popular.map(({ tag }) => (
            <TagPill key={tag} tag={tag} />
          ))}
        </div>
      )}
      <p className="mt-8 text-center">
        <Link
          href="/contents"
          className="text-sm text-gray-500 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 rounded"
        >
          콘텐츠에서 검색하기 →
        </Link>
      </p>
    </div>
  );
}
