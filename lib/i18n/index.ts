// Client-safe exports only — do NOT export server.ts here
export { LanguageProvider, useLanguage, useT } from "./LanguageProvider";
export type { Locale, Translations } from "./translations";
export { translations, DEFAULT_LOCALE, LOCALE_COOKIE } from "./translations";
