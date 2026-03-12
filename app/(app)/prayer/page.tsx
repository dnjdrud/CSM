import { TimelineContainer } from "@/components/TimelineContainer";
import { getCurrentUser } from "@/lib/data/repository";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata = { title: "기도 – Cellah" };

const MOCK_PRAYERS = [
  { id: "p1", author: "김민준", avatarInitial: "김", content: "이번 주 직장에서 중요한 발표가 있습니다. 담대함을 주시도록 기도해 주세요.", category: "개인", responses: 5, createdAt: "2시간 전", answered: false },
  { id: "p2", author: "이서연", avatarInitial: "이", content: "아버지의 건강 회복을 위해 기도 부탁드립니다. 이번 주 검사 결과가 나옵니다.", category: "가족", responses: 12, createdAt: "4시간 전", answered: false },
  { id: "p3", author: "박지호", avatarInitial: "박", content: "선교지에서 언어 장벽을 넘어 현지인들과 소통할 수 있도록 기도 부탁드립니다.", category: "선교", responses: 8, createdAt: "어제", answered: false },
  { id: "p4", author: "최예린", avatarInitial: "최", content: "대학원 입학 시험 합격을 위해 기도해 주세요. 하나님의 뜻대로 되길 원합니다.", category: "개인", responses: 7, createdAt: "어제", answered: true },
  { id: "p5", author: "정승현", avatarInitial: "정", content: "우리 셀 모임이 더욱 깊은 교제의 장이 되길 기도해 주세요.", category: "셀", responses: 15, createdAt: "2일 전", answered: false },
];

export default async function PrayerPage() {
  const user = await getCurrentUser();

  return (
    <TimelineContainer>
      <div className="flex flex-col">
        {/* Header */}
        <div className="px-4 py-4 border-b border-theme-border">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold text-theme-text">기도</h1>
            <Link
              href="/prayer/create"
              className="px-3 py-1.5 text-sm font-medium bg-theme-primary text-white rounded-lg hover:opacity-90"
            >
              + 기도 요청
            </Link>
          </div>
          {/* Sub-nav */}
          <nav className="flex gap-4 mt-3 text-[13px]">
            <span className="font-medium text-theme-primary border-b-2 border-theme-primary pb-0.5">전체</span>
            <Link href="/prayer/my" className="text-theme-muted hover:text-theme-text">내 기도</Link>
            <Link href="/prayer/chains" className="text-theme-muted hover:text-theme-text">기도 체인</Link>
          </nav>
        </div>

        {/* Prayer list */}
        <div className="divide-y divide-theme-border/60">
          {MOCK_PRAYERS.map((prayer) => (
            <Link key={prayer.id} href={`/prayer/${prayer.id}`} className="block px-4 py-4 hover:bg-theme-surface transition-colors">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-theme-primary/20 flex items-center justify-center text-theme-primary font-semibold text-sm shrink-0">
                  {prayer.avatarInitial}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[13px] font-medium text-theme-text">{prayer.author}</span>
                    <span className="text-[11px] bg-theme-primary/10 text-theme-primary px-2 py-0.5 rounded-full">{prayer.category}</span>
                    {prayer.answered && (
                      <span className="text-[11px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full">✓ 응답</span>
                    )}
                    <span className="text-[12px] text-theme-muted ml-auto">{prayer.createdAt}</span>
                  </div>
                  <p className="text-[14px] text-theme-text mt-1 line-clamp-2 leading-relaxed">{prayer.content}</p>
                  <p className="text-[12px] text-theme-muted mt-1.5">🙏 {prayer.responses}명이 기도했습니다</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </TimelineContainer>
  );
}
