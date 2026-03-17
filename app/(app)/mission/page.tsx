import Link from "next/link";
import { TimelineContainer } from "@/components/TimelineContainer";
import { getCurrentUser } from "@/lib/data/repository";
import {
  MISSION_COUNTRIES,
  MISSION_REGIONS,
  groupByRegion,
} from "@/lib/mission/countries";

export const metadata = { title: "선교 – Cellah" };
export const dynamic = "force-dynamic";

export default async function MissionPage() {
  const currentUser = await getCurrentUser();
  const byRegion = groupByRegion(MISSION_COUNTRIES);

  return (
    <TimelineContainer>
      <div className="pt-2 pb-8 space-y-6">

        {/* Header */}
        <div className="px-4 pt-2">
          <h1 className="text-[20px] font-bold text-theme-text">🌍 세계 선교</h1>
          <p className="text-[13px] text-theme-muted mt-0.5 leading-relaxed">
            국가를 선택해 해당 나라의 선교 소식을 확인하세요
          </p>
        </div>

        {/* Region-organized country grid */}
        <div className="px-4 space-y-6">
          {MISSION_REGIONS.filter((r) => byRegion.has(r)).map((region) => {
            const countries = byRegion.get(region)!;
            return (
              <section key={region} aria-labelledby={`region-${region}`}>
                <h2
                  id={`region-${region}`}
                  className="text-[11px] font-semibold text-theme-muted uppercase tracking-wider mb-2.5"
                >
                  {region}
                </h2>
                <ul className="grid grid-cols-2 gap-2">
                  {countries.map((country) => (
                    <li key={country.code}>
                      <Link
                        href={`/mission/${country.code}`}
                        className="flex items-center gap-2.5 rounded-xl border border-theme-border bg-theme-surface px-3.5 py-3 hover:border-theme-border-2 hover:bg-theme-surface-2 transition-all group"
                      >
                        <span className="text-xl shrink-0" aria-hidden>
                          {country.flag}
                        </span>
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-theme-text group-hover:text-blue-700 transition-colors truncate">
                            {country.name}
                          </p>
                          <p className="text-[11px] text-theme-muted truncate">
                            {country.nameEn}
                          </p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>

        {/* Write CTA */}
        <div className="px-4 pt-2 border-t border-theme-border/40">
          <div className="rounded-2xl border border-theme-border bg-theme-surface px-5 py-4 space-y-2">
            <p className="text-[14px] font-semibold text-blue-900">선교 소식 나누기</p>
            <p className="text-[13px] text-blue-700/80 leading-relaxed">
              현장의 기도 제목, 사역 업데이트, 감사 나눔을
              <br />
              선교 탭에 올려보세요.
            </p>
            <Link
              href="/write?category=MISSION"
              className="inline-block mt-1 text-[13px] font-semibold text-blue-600 hover:opacity-80"
            >
              + 선교 소식 올리기 →
            </Link>
          </div>
        </div>

        {/* Missionary dashboard link */}
        {currentUser?.role === "MISSIONARY" && (
          <div className="px-4">
            <div className="rounded-2xl border border-theme-primary/30 bg-theme-primary/5 px-5 py-4 space-y-2">
              <p className="text-[14px] font-semibold text-theme-text">선교사 대시보드</p>
              <p className="text-[13px] text-theme-muted">
                내 선교 프로젝트를 등록하고 후원자를 연결하세요.
              </p>
              <div className="flex gap-4 pt-1">
                <Link
                  href="/missionary"
                  className="text-[13px] font-medium text-theme-primary hover:opacity-80"
                >
                  대시보드 →
                </Link>
                <Link
                  href="/missionary/project/create"
                  className="text-[13px] font-medium text-theme-primary hover:opacity-80"
                >
                  프로젝트 등록 →
                </Link>
              </div>
            </div>
          </div>
        )}

      </div>
    </TimelineContainer>
  );
}
