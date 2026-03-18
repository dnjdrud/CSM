"use client";

import { useLanguage } from "@/lib/i18n";
import { IconGlobe } from "@/components/ui/Icon";

export function LanguageSettingRow() {
  const { locale, setLocale, t } = useLanguage();

  return (
    <li>
      <div className="flex items-center gap-3 px-4 py-3.5">
        <IconGlobe className="h-5 w-5 text-theme-muted shrink-0" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-medium text-theme-text">{t.settings.language}</p>
          <p className="text-[12px] text-theme-muted">{t.settings.languageDesc}</p>
        </div>
        <div className="flex rounded-lg border border-theme-border overflow-hidden text-[13px]">
          <button
            type="button"
            onClick={() => setLocale("ko")}
            className={`px-3 py-1 ${locale === "ko" ? "bg-theme-primary text-white" : "text-theme-muted hover:text-theme-text"}`}
          >
            한국어
          </button>
          <button
            type="button"
            onClick={() => setLocale("en")}
            className={`px-3 py-1 border-l border-theme-border ${locale === "en" ? "bg-theme-primary text-white" : "text-theme-muted hover:text-theme-text"}`}
          >
            English
          </button>
        </div>
      </div>
    </li>
  );
}
