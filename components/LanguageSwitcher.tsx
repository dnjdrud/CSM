"use client";

import { useLanguage } from "@/lib/i18n";

export function LanguageSwitcher() {
  const { t, setLocale, locale, isPending } = useLanguage();

  return (
    <button
      type="button"
      onClick={() => setLocale(locale === "ko" ? "en" : "ko")}
      disabled={isPending}
      className="rounded px-2 py-1 text-[12px] font-medium text-theme-muted hover:text-theme-text border border-theme-border/60 hover:border-theme-border focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary focus-visible:ring-offset-2 disabled:opacity-50 transition-colors"
      aria-label={locale === "ko" ? "Switch to English" : "한국어로 전환"}
    >
      {t.header.langSwitch}
    </button>
  );
}
