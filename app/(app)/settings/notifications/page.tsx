import { TimelineContainer } from "@/components/TimelineContainer";
import { getCurrentUser, getNotificationPrefs } from "@/lib/data/repository";
import { redirect } from "next/navigation";
import Link from "next/link";
import { updateNotifPrefsAction } from "./actions";
import type { NotificationPrefs } from "@/lib/domain/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "알림 설정 – Cellah" };

const PUSH_ITEMS: { key: keyof NotificationPrefs; label: string; desc: string }[] = [
  { key: "pushComments",        label: "새 댓글",   desc: "내 게시글에 댓글이 달릴 때" },
  { key: "pushReactions",       label: "좋아요",    desc: "내 게시글에 반응이 달릴 때" },
  { key: "pushFollowers",       label: "새 팔로워", desc: "누군가 나를 팔로우할 때" },
  { key: "pushCellMessages",    label: "셀 메시지", desc: "셀 채팅에 새 메시지가 올 때" },
  { key: "pushPrayerResponses", label: "기도 응원", desc: "기도제목에 응원이 달릴 때" },
];

const EMAIL_ITEMS: { key: keyof NotificationPrefs; label: string; desc: string }[] = [
  { key: "emailWeeklyDigest", label: "주간 요약", desc: "셀과 기도 활동 주간 요약" },
  { key: "emailCellInvites",  label: "셀 초대",   desc: "새 셀 초대가 왔을 때" },
];

export default async function SettingsNotificationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const prefs = await getNotificationPrefs(user.id);

  return (
    <TimelineContainer>
      <div className="px-4 py-6 space-y-6">
        <div>
          <Link href="/settings" className="text-[12px] text-theme-muted hover:text-theme-primary">← 설정</Link>
          <h1 className="text-xl font-semibold text-theme-text mt-2">알림 설정</h1>
        </div>

        <form action={updateNotifPrefsAction} className="space-y-6">
          {/* Push */}
          <div className="space-y-2">
            <p className="text-[12px] font-medium text-theme-muted uppercase tracking-wider">푸시 알림</p>
            <div className="rounded-xl border border-theme-border bg-theme-surface divide-y divide-theme-border/60 overflow-hidden">
              {PUSH_ITEMS.map((item) => (
                <label key={item.key} className="flex items-center justify-between px-4 py-3 cursor-pointer">
                  <div>
                    <p className="text-[14px] text-theme-text">{item.label}</p>
                    <p className="text-[12px] text-theme-muted mt-0.5">{item.desc}</p>
                  </div>
                  <input
                    type="checkbox"
                    name={item.key}
                    defaultChecked={prefs[item.key] as boolean}
                    className="w-4 h-4 accent-theme-primary"
                  />
                </label>
              ))}
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <p className="text-[12px] font-medium text-theme-muted uppercase tracking-wider">이메일 알림</p>
            <div className="rounded-xl border border-theme-border bg-theme-surface divide-y divide-theme-border/60 overflow-hidden">
              {EMAIL_ITEMS.map((item) => (
                <label key={item.key} className="flex items-center justify-between px-4 py-3 cursor-pointer">
                  <div>
                    <p className="text-[14px] text-theme-text">{item.label}</p>
                    <p className="text-[12px] text-theme-muted mt-0.5">{item.desc}</p>
                  </div>
                  <input
                    type="checkbox"
                    name={item.key}
                    defaultChecked={prefs[item.key] as boolean}
                    className="w-4 h-4 accent-theme-primary"
                  />
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-theme-primary text-white text-[14px] font-medium hover:opacity-90"
          >
            저장
          </button>
        </form>
      </div>
    </TimelineContainer>
  );
}
