"use client";

import { createContext, useContext, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { translations, DEFAULT_LOCALE, LOCALE_COOKIE, type Locale, type Translations } from "./translations";

interface LanguageContextValue {
  locale: Locale;
  t: Translations;
  setLocale: (locale: Locale) => void;
  isPending: boolean;
}

const LanguageContext = createContext<LanguageContextValue>({
  locale: DEFAULT_LOCALE,
  t: translations[DEFAULT_LOCALE],
  setLocale: () => {},
  isPending: false,
});

export function LanguageProvider({
  children,
  initialLocale = DEFAULT_LOCALE,
}: {
  children: ReactNode;
  initialLocale?: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function setLocale(next: Locale) {
    // persist to cookie (1 year)
    document.cookie = `${LOCALE_COOKIE}=${next};path=/;max-age=31536000;SameSite=Lax`;
    startTransition(() => {
      setLocaleState(next);
      router.refresh(); // re-render server components with new locale
    });
  }

  return (
    <LanguageContext.Provider value={{ locale, t: translations[locale], setLocale, isPending }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

/** Shorthand hook — returns only the translation object. */
export function useT(): Translations {
  return useContext(LanguageContext).t;
}
