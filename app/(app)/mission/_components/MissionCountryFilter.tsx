"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { MISSION_COUNTRIES } from "@/lib/mission/countries";

export function MissionCountryFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const value = searchParams.get("country") ?? "";

  function setCountry(code: string) {
    const next = new URLSearchParams(searchParams);
    if (!code) next.delete("country");
    else next.set("country", code);
    const qs = next.toString();
    router.push(qs ? `/mission?${qs}` : "/mission");
  }

  return (
    <div className="px-4 pt-3 pb-4 border-b border-theme-border/60 bg-theme-surface">
      <label className="block text-[12px] font-medium text-theme-muted mb-1">
        국가 선택
      </label>
      <select
        value={value}
        onChange={(e) => setCountry(e.target.value)}
        className="w-full text-[14px] border border-theme-border rounded-lg px-3 py-2 bg-theme-surface text-theme-text focus:outline-none focus:ring-2 focus:ring-theme-primary/40"
        aria-label="선교 국가 필터"
      >
        <option value="">전체 국가</option>
        {MISSION_COUNTRIES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.flag} {c.name}
          </option>
        ))}
      </select>
    </div>
  );
}

