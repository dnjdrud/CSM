import { TimelineContainer } from "@/components/TimelineContainer";
import { getCurrentUser } from "@/lib/data/repository";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createQuestionAction } from "../actions";
import { THEOLOGY_CATEGORY_LABELS } from "@/lib/domain/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "신학 질문하기 – Cellah" };

export default async function TheologyAskPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <TimelineContainer>
      <div className="px-4 py-6 space-y-6">
        <div>
          <Link href="/theology" className="text-[12px] text-theme-muted hover:text-theme-primary">← 신학</Link>
          <h1 className="text-xl font-semibold text-theme-text mt-2">질문하기</h1>
        </div>

        <form action={createQuestionAction} className="space-y-4">
          {/* Category */}
          <div className="space-y-2">
            <label className="text-[13px] font-medium text-theme-text">카테고리</label>
            <div className="flex flex-wrap gap-3">
              {(Object.entries(THEOLOGY_CATEGORY_LABELS) as [string, string][]).map(([value, label]) => (
                <label key={value} className="flex items-center gap-1.5 cursor-pointer">
                  <input type="radio" name="category" value={value} className="accent-theme-primary" defaultChecked={value === "GENERAL"} />
                  <span className="text-[13px] text-theme-text">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <label className="text-[13px] font-medium text-theme-text">제목 *</label>
            <input
              type="text"
              name="title"
              required
              minLength={5}
              maxLength={200}
              placeholder="예: 구원은 잃어버릴 수 있나요?"
              className="w-full rounded-xl border border-theme-border bg-theme-surface px-4 py-3 text-[14px] text-theme-text placeholder-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-primary/50"
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <label className="text-[13px] font-medium text-theme-text">질문 내용 *</label>
            <textarea
              name="content"
              rows={5}
              required
              minLength={10}
              maxLength={2000}
              placeholder="질문의 배경과 궁금한 점을 자세히 적어주세요."
              className="w-full rounded-xl border border-theme-border bg-theme-surface px-4 py-3 text-[14px] text-theme-text placeholder-theme-muted resize-none focus:outline-none focus:ring-2 focus:ring-theme-primary/50"
            />
          </div>

          <button type="submit" className="w-full py-3 rounded-xl bg-theme-primary text-white text-[14px] font-medium hover:opacity-90">
            질문 등록
          </button>
        </form>
      </div>
    </TimelineContainer>
  );
}
