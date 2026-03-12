import { TimelineContainer } from "@/components/TimelineContainer";
import Link from "next/link";

export const metadata = { title: "선교 – Cellah" };

const MOCK_MISSIONS = [
  {
    id: "m1",
    title: "동남아시아 대학생 선교",
    missionary: "박선교",
    country: "🇻🇳 베트남",
    field: "대학생 사역",
    supporters: 34,
    prayerCount: 156,
    status: "active",
    summary: "하노이 국립대 주변에서 한인 유학생들과 현지 학생들을 연결하며 캠퍼스 사역을 진행하고 있습니다.",
  },
  {
    id: "m2",
    title: "중앙아시아 의료 선교",
    missionary: "최의사",
    country: "🇰🇿 카자흐스탄",
    field: "의료 봉사",
    supporters: 21,
    prayerCount: 89,
    status: "active",
    summary: "농촌 지역 무료 의료 봉사와 함께 복음을 전하고 있습니다. 의약품 지원이 필요합니다.",
  },
  {
    id: "m3",
    title: "아프리카 교육 선교",
    missionary: "김교사",
    country: "🇺🇬 우간다",
    field: "교육 사역",
    supporters: 15,
    prayerCount: 67,
    status: "active",
    summary: "시골 마을에 학교를 세우고 아이들에게 복음과 교육을 함께 전합니다.",
  },
];

export default function MissionsPage() {
  return (
    <TimelineContainer>
      <div className="flex flex-col">
        {/* Header */}
        <div className="px-4 py-4 border-b border-theme-border">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold text-theme-text">선교</h1>
          </div>
          <nav className="flex gap-4 mt-3 text-[13px]">
            <span className="font-medium text-theme-primary border-b-2 border-theme-primary pb-0.5">전체</span>
            <Link href="/missionary" className="text-theme-muted hover:text-theme-text">선교사</Link>
          </nav>
        </div>

        {/* Mission list */}
        <div className="divide-y divide-theme-border/60">
          {MOCK_MISSIONS.map((mission) => (
            <Link key={mission.id} href={`/missions/${mission.id}`} className="block px-4 py-4 hover:bg-theme-surface transition-colors">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-lg shrink-0">
                  {mission.country.split(" ")[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-theme-text text-[14px]">{mission.title}</p>
                      <p className="text-[12px] text-theme-muted mt-0.5">{mission.missionary} · {mission.country.split(" ")[1]} · {mission.field}</p>
                    </div>
                    <span className="shrink-0 text-[11px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full">진행중</span>
                  </div>
                  <p className="text-[13px] text-theme-muted mt-2 line-clamp-2 leading-relaxed">{mission.summary}</p>
                  <div className="flex items-center gap-3 mt-2 text-[12px] text-theme-muted">
                    <span>👥 후원자 {mission.supporters}명</span>
                    <span>🙏 기도 {mission.prayerCount}회</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </TimelineContainer>
  );
}
