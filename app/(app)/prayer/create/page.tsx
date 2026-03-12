import { TimelineContainer } from "@/components/TimelineContainer";
import { getCurrentUser } from "@/lib/data/repository";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata = { title: "기도 요청하기 – Cellah" };

export default async function PrayerCreatePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <TimelineContainer>
      <div className="px-4 py-6 space-y-6">
        <div>
          <Link href="/prayer" className="text-[12px] text-theme-muted hover:text-theme-primary">← 기도</Link>
          <h1 className="text-xl font-semibold text-theme-text mt-2">기도 요청하기</h1>
        </div>

        <form className="space-y-4">
          {/* Category */}
          <div className="space-y-2">
            <label className="text-[13px] font-medium text-theme-text">카테고리</label>
            <div className="flex flex-wrap gap-2">
              {["개인", "가족", "셀", "교회", "선교", "사회"].map((cat) => (
                <label key={cat} className="flex items-center gap-1.5 cursor-pointer">
                  <input type="radio" name="category" value={cat} className="accent-theme-primary" defaultChecked={cat === "개인"} />
                  <span className="text-[13px] text-theme-text">{cat}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <label className="text-[13px] font-medium text-theme-text">기도 내용</label>
            <textarea
              rows={6}
              placeholder="기도 제목을 나눠주세요. 구체적일수록 함께 기도하기 좋습니다."
              className="w-full rounded-xl border border-theme-border bg-theme-surface px-4 py-3 text-[14px] text-theme-text placeholder-theme-muted resize-none focus:outline-none focus:ring-2 focus:ring-theme-primary/50"
            />
          </div>

          {/* Visibility */}
          <div className="space-y-2">
            <label className="text-[13px] font-medium text-theme-text">공개 범위</label>
            <select className="w-full rounded-xl border border-theme-border bg-theme-surface px-4 py-3 text-[14px] text-theme-text focus:outline-none focus:ring-2 focus:ring-theme-primary/50">
              <option value="all">전체 공개</option>
              <option value="cell">내 셀만</option>
              <option value="private">나만 보기</option>
            </select>
          </div>

          <div className="pt-2 rounded-xl border border-theme-border/60 bg-amber-50 dark:bg-amber-950/20 px-4 py-3">
            <p className="text-[12px] text-amber-700 dark:text-amber-400">기도 요청 기능은 준비 중입니다. 곧 사용하실 수 있습니다.</p>
          </div>

          <button
            type="submit"
            disabled
            className="w-full py-3 rounded-xl bg-theme-primary text-white text-[14px] font-medium disabled:opacity-50 cursor-not-allowed"
          >
            기도 요청 등록
          </button>
        </form>
      </div>
    </TimelineContainer>
  );
}
