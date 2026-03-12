import { TimelineContainer } from "@/components/TimelineContainer";
import { getCurrentUser } from "@/lib/data/repository";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createProjectAction } from "../../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "선교 프로젝트 등록 – Cellah" };

export default async function MissionaryProjectCreatePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <TimelineContainer>
      <div className="px-4 py-6 space-y-6">
        <div>
          <Link href="/missionary" className="text-[12px] text-theme-muted hover:text-theme-primary">← 대시보드</Link>
          <h1 className="text-xl font-semibold text-theme-text mt-2">프로젝트 등록</h1>
        </div>

        <form action={createProjectAction} className="space-y-4">
          <div className="space-y-2">
            <label className="text-[13px] font-medium text-theme-text">프로젝트 이름 *</label>
            <input
              type="text"
              name="title"
              required
              minLength={2}
              maxLength={100}
              placeholder="예: 동남아시아 대학생 선교"
              className="w-full rounded-xl border border-theme-border bg-theme-surface px-4 py-3 text-[14px] text-theme-text placeholder-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-primary/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-[13px] font-medium text-theme-text">나라</label>
              <input
                type="text"
                name="country"
                maxLength={50}
                placeholder="예: 베트남"
                className="w-full rounded-xl border border-theme-border bg-theme-surface px-4 py-3 text-[14px] text-theme-text placeholder-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-primary/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[13px] font-medium text-theme-text">사역 분야</label>
              <input
                type="text"
                name="field"
                maxLength={50}
                placeholder="예: 대학생 사역"
                className="w-full rounded-xl border border-theme-border bg-theme-surface px-4 py-3 text-[14px] text-theme-text placeholder-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-primary/50"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[13px] font-medium text-theme-text">프로젝트 소개</label>
            <textarea
              name="description"
              rows={5}
              maxLength={2000}
              placeholder="선교 현장과 사역 내용을 소개해주세요. 기도 후원자들이 더 잘 알고 기도할 수 있습니다."
              className="w-full rounded-xl border border-theme-border bg-theme-surface px-4 py-3 text-[14px] text-theme-text placeholder-theme-muted resize-none focus:outline-none focus:ring-2 focus:ring-theme-primary/50"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-theme-primary text-white text-[14px] font-medium hover:opacity-90"
          >
            프로젝트 등록
          </button>
        </form>
      </div>
    </TimelineContainer>
  );
}
