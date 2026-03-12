import { TimelineContainer } from "@/components/TimelineContainer";
import { getCurrentUser } from "@/lib/data/repository";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata = { title: "알림 설정 – Cellah" };

export default async function SettingsNotificationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <TimelineContainer>
      <div className="px-4 py-6 space-y-6">
        <div>
          <Link href="/settings" className="text-[12px] text-theme-muted hover:text-theme-primary">← 설정</Link>
          <h1 className="text-xl font-semibold text-theme-text mt-2">알림 설정</h1>
        </div>

        {/* Push Notifications */}
        <div className="space-y-2">
          <p className="text-[12px] font-medium text-theme-muted uppercase tracking-wider">푸시 알림</p>
          <div className="rounded-xl border border-theme-border bg-theme-surface divide-y divide-theme-border/60 overflow-hidden">
            {[
              { label: "새 댓글", desc: "내 게시글에 댓글이 달릴 때" },
              { label: "좋아요", desc: "내 게시글에 반응이 달릴 때" },
              { label: "새 팔로워", desc: "누군가 나를 팔로우할 때" },
              { label: "셀 메시지", desc: "셀 채팅에 새 메시지가 올 때" },
              { label: "기도 응답", desc: "기도제목에 응원이 달릴 때" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-[14px] text-theme-text">{item.label}</p>
                  <p className="text-[12px] text-theme-muted mt-0.5">{item.desc}</p>
                </div>
                <div className="w-11 h-6 bg-theme-primary rounded-full relative cursor-not-allowed opacity-50">
                  <div className="absolute right-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow" />
                </div>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-theme-muted px-1">알림 설정 기능은 준비 중입니다.</p>
        </div>

        {/* Email Notifications */}
        <div className="space-y-2">
          <p className="text-[12px] font-medium text-theme-muted uppercase tracking-wider">이메일 알림</p>
          <div className="rounded-xl border border-theme-border bg-theme-surface divide-y divide-theme-border/60 overflow-hidden">
            {[
              { label: "주간 요약", desc: "셀과 기도 활동 주간 요약" },
              { label: "셀 초대", desc: "새 셀 초대가 왔을 때" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-[14px] text-theme-text">{item.label}</p>
                  <p className="text-[12px] text-theme-muted mt-0.5">{item.desc}</p>
                </div>
                <div className="w-11 h-6 bg-theme-border rounded-full relative cursor-not-allowed opacity-50">
                  <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </TimelineContainer>
  );
}
