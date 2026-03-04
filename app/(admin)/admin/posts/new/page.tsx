import { redirect } from "next/navigation";
import Link from "next/link";
import { getAdminOrNull } from "@/lib/admin/guard";
import { CATEGORY_LABELS } from "@/lib/domain/types";
import type { PostCategory, Visibility } from "@/lib/domain/types";
import { NewPostForm } from "./_components/NewPostForm";

const CATEGORIES: PostCategory[] = ["PRAYER", "DEVOTIONAL", "MINISTRY", "TESTIMONY"];
const VISIBILITIES: Visibility[] = ["PUBLIC", "MEMBERS", "FOLLOWERS", "PRIVATE"];

const VISIBILITY_LABELS: Record<Visibility, string> = {
  PUBLIC: "Public",
  MEMBERS: "Members only",
  FOLLOWERS: "Followers only",
  PRIVATE: "Private",
};

export default async function AdminNewPostPage() {
  const admin = await getAdminOrNull();
  if (!admin) {
    return (
      <div className="mx-auto max-w-xl px-6 py-10">
        <h1 className="text-xl font-semibold text-gray-800">권한 없음</h1>
        <p className="mt-2 text-sm text-gray-600">
          이 페이지는 관리자만 이용할 수 있습니다.
        </p>
        <Link
          href="/community"
          className="mt-4 inline-block text-sm text-theme-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary focus-visible:ring-offset-2 rounded"
        >
          커뮤니티로 이동 →
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-6 py-10">
      <h1 className="text-2xl font-serif font-normal text-gray-800 tracking-tight">
        새 게시물
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        관리자 전용. 제목·내용·선택 사항(YouTube URL 등)을 입력한 뒤 저장하면 커뮤니티 피드에 노출됩니다.
      </p>

      <NewPostForm
        categories={CATEGORIES}
        visibilities={VISIBILITIES}
        categoryLabels={CATEGORY_LABELS}
        visibilityLabels={VISIBILITY_LABELS}
      />
    </div>
  );
}
