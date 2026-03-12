import { TimelineContainer } from "@/components/TimelineContainer";
import Link from "next/link";

export const dynamic = "force-dynamic";

const MOCK_PRAYER = {
  id: "p1",
  author: "김민준",
  avatarInitial: "김",
  content: "이번 주 직장에서 중요한 발표가 있습니다. 많이 떨리지만 하나님께서 담대함을 주시길 기도해 주세요. 제 팀 전체에게도 좋은 결과가 있도록 함께 기도 부탁드립니다.",
  category: "개인",
  createdAt: "2026년 3월 12일",
  answered: false,
  prayerCount: 5,
  prayers: [
    { author: "이서연", avatarInitial: "이", message: "하나님의 평강이 함께하길 기도합니다 🙏", time: "1시간 전" },
    { author: "박지호", avatarInitial: "박", message: "담대함과 지혜를 주시길 기도했습니다!", time: "2시간 전" },
    { author: "최예린", avatarInitial: "최", message: "주님 손에 맡기고 의지하세요. 기도합니다.", time: "3시간 전" },
  ],
};

export default async function PrayerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <TimelineContainer>
      <div className="flex flex-col">
        {/* Header */}
        <div className="px-4 py-4 border-b border-theme-border">
          <Link href="/prayer" className="text-[12px] text-theme-muted hover:text-theme-primary">← 기도</Link>
        </div>

        {/* Prayer content */}
        <div className="px-4 py-5 border-b border-theme-border">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-theme-primary/20 flex items-center justify-center text-theme-primary font-semibold shrink-0">
              {MOCK_PRAYER.avatarInitial}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-theme-text">{MOCK_PRAYER.author}</span>
                <span className="text-[11px] bg-theme-primary/10 text-theme-primary px-2 py-0.5 rounded-full">{MOCK_PRAYER.category}</span>
              </div>
              <p className="text-[12px] text-theme-muted mt-0.5">{MOCK_PRAYER.createdAt}</p>
            </div>
          </div>
          <p className="text-[15px] text-theme-text mt-4 leading-relaxed">{MOCK_PRAYER.content}</p>

          {/* Actions */}
          <div className="flex items-center gap-3 mt-4">
            <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-theme-primary text-white text-[13px] font-medium hover:opacity-90">
              🙏 함께 기도하기
            </button>
            <span className="text-[13px] text-theme-muted">{MOCK_PRAYER.prayerCount}명이 기도했습니다</span>
          </div>
        </div>

        {/* Prayer responses */}
        <div className="px-4 py-4 space-y-4">
          <p className="text-[13px] font-medium text-theme-text">기도 응원</p>
          {MOCK_PRAYER.prayers.map((p, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-theme-primary/20 flex items-center justify-center text-theme-primary text-sm font-semibold shrink-0">
                {p.avatarInitial}
              </div>
              <div className="flex-1 rounded-xl bg-theme-surface border border-theme-border px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-medium text-theme-text">{p.author}</span>
                  <span className="text-[11px] text-theme-muted">{p.time}</span>
                </div>
                <p className="text-[13px] text-theme-text mt-0.5">{p.message}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Comment input */}
        <div className="px-4 py-3 border-t border-theme-border">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="기도 응원 메시지를 남겨주세요..."
              className="flex-1 rounded-xl border border-theme-border bg-theme-surface px-3 py-2 text-[13px] text-theme-text placeholder-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-primary/50"
            />
            <button className="px-3 py-2 bg-theme-primary text-white rounded-lg text-[13px] font-medium hover:opacity-90">
              전송
            </button>
          </div>
        </div>
      </div>
    </TimelineContainer>
  );
}
