import { TimelineContainer } from "@/components/TimelineContainer";
import { getCurrentUser } from "@/lib/data/repository";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createPrayerRequestAction } from "../actions";
import { PRAYER_CATEGORY_LABELS } from "@/lib/domain/types";

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

        <form action={createPrayerRequestAction} className="space-y-4">
          {/* Category */}
          <div className="space-y-2">
            <label className="text-[13px] font-medium text-theme-text">카테고리</label>
            <div className="flex flex-wrap gap-3">
              {(Object.entries(PRAYER_CATEGORY_LABELS) as [string, string][]).map(([value, label]) => (
                <label key={value} className="flex items-center gap-1.5 cursor-pointer">
                  <input type="radio" name="category" value={value} className="accent-theme-primary" defaultChecked={value === "PERSONAL"} />
                  <span className="text-[13px] text-theme-text">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <label className="text-[13px] font-medium text-theme-text">기도 내용</label>
            <textarea
              name="content"
              rows={6}
              required
              minLength={5}
              maxLength={1000}
              placeholder="기도 제목을 나눠주세요. 구체적일수록 함께 기도하기 좋습니다."
              className="w-full rounded-xl border border-theme-border bg-theme-surface px-4 py-3 text-[14px] text-theme-text placeholder-theme-muted resize-none focus:outline-none focus:ring-2 focus:ring-theme-primary/50"
            />
          </div>

          {/* Visibility */}
          <div className="space-y-2">
            <label className="text-[13px] font-medium text-theme-text">공개 범위</label>
            <select
              name="visibility"
              className="w-full rounded-xl border border-theme-border bg-theme-surface px-4 py-3 text-[14px] text-theme-text focus:outline-none focus:ring-2 focus:ring-theme-primary/50"
            >
              <option value="PUBLIC">전체 공개</option>
              <option value="CELL">내 셀만</option>
              <option value="PRIVATE">나만 보기</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-theme-primary text-white text-[14px] font-medium hover:opacity-90"
          >
            기도 요청 등록
          </button>
        </form>
      </div>
    </TimelineContainer>
  );
}
