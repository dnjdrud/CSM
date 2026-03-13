import Link from "next/link";
import { listAdminPosts } from "@/lib/data/adminRepository";
import { AdminContentTable } from "./_components/AdminContentTable";

const CATEGORIES = [
  { value: "", label: "전체" },
  { value: "GENERAL", label: "일반" },
  { value: "DEVOTIONAL", label: "묵상" },
  { value: "MINISTRY", label: "사역" },
  { value: "TESTIMONY", label: "간증" },
  { value: "PHOTO", label: "사진" },
  { value: "PRAYER", label: "기도" },
  { value: "CELL", label: "셀" },
  { value: "CONTENT", label: "콘텐츠" },
  { value: "REQUEST", label: "요청" },
  { value: "MISSION", label: "선교" },
];

type Props = { searchParams: Promise<{ category?: string; hidden?: string }> };

export default async function AdminContentPage({ searchParams }: Props) {
  const { category, hidden } = await searchParams;
  const hiddenOnly = hidden === "1";

  const posts = await listAdminPosts({
    category: category || undefined,
    hiddenOnly,
    limit: 100,
  });

  return (
    <div className="">
      <h1 className="text-2xl font-serif font-normal text-gray-800 tracking-tight">
        Content
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        게시글 조회, 카테고리 필터, 숨김 처리.
      </p>

      {/* 필터 바 */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        {CATEGORIES.map(({ value, label }) => {
          const isActive = (value === "" && !category) || category === value;
          const params = new URLSearchParams();
          if (value) params.set("category", value);
          if (hiddenOnly) params.set("hidden", "1");
          const href = `/admin/content${params.toString() ? `?${params}` : ""}`;
          return (
            <Link
              key={value}
              href={href}
              className={`rounded-full px-3 py-1 text-xs font-medium border ${
                isActive
                  ? "bg-gray-800 text-white border-gray-800"
                  : "text-gray-600 border-gray-200 hover:border-gray-400"
              }`}
            >
              {label}
            </Link>
          );
        })}

        <span className="mx-2 text-gray-300">|</span>

        <Link
          href={(() => {
            const params = new URLSearchParams();
            if (category) params.set("category", category);
            if (!hiddenOnly) params.set("hidden", "1");
            return `/admin/content${params.toString() ? `?${params}` : ""}`;
          })()}
          className={`rounded-full px-3 py-1 text-xs font-medium border ${
            hiddenOnly
              ? "bg-red-700 text-white border-red-700"
              : "text-red-600 border-red-200 hover:border-red-400"
          }`}
        >
          숨김만 보기
        </Link>
      </div>

      <p className="mt-3 text-xs text-gray-400">{posts.length}개 게시글</p>

      <AdminContentTable posts={posts} />
    </div>
  );
}
