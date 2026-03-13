import { cookies } from "next/headers";
import { translations, DEFAULT_LOCALE, LOCALE_COOKIE, type Locale, type Translations } from "./translations";

export async function getServerLocale(): Promise<Locale> {
  try {
    const cookieStore = await cookies();
    const value = cookieStore.get(LOCALE_COOKIE)?.value;
    if (value === "ko" || value === "en") return value;
  } catch {
    // cookies() not available in this context
  }
  return DEFAULT_LOCALE;
}

export async function getServerT(): Promise<Translations> {
  const locale = await getServerLocale();
  return translations[locale];
}
