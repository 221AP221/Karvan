// Dillər: ana səhifə, xidmətlər kataloqu və giriş/qeydiyyat səhifələri üçün.
// Azərbaycan dili əsasdır (prefikssiz URL), türk və rus dilləri /tr və /ru altında: hər dilin öz URL-i
// olduğu üçün axtarış sistemləri hər versiyanı ayrıca indeksləyir (hreflang).

export const LOCALES = ["az", "tr", "ru"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "az";
export const LOCALE_COOKIE = "lang";

export const isLocale = (v: unknown): v is Locale => LOCALES.includes(v as Locale);

export const LOCALE_NAMES: Record<Locale, string> = { az: "Azərbaycanca", tr: "Türkçe", ru: "Русский" };
export const OG_LOCALE: Record<Locale, string> = { az: "az_AZ", tr: "tr_TR", ru: "ru_RU" };

export const HOME_PATH: Record<Locale, string> = { az: "/", tr: "/tr", ru: "/ru" };
export const CATALOG_PATH: Record<Locale, string> = { az: "/xidmetler", tr: "/tr/hizmetler", ru: "/ru/uslugi" };

export const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");

// Yolun hansı dilə aid olduğu (yalnız dil prefiksli səhifələr üçün)
export function localeFromPath(pathname: string): Locale | null {
  if (pathname === "/tr" || pathname.startsWith("/tr/")) return "tr";
  if (pathname === "/ru" || pathname.startsWith("/ru/")) return "ru";
  if (pathname === "/" || pathname === CATALOG_PATH.az) return "az";
  return null;
}

// Metadata üçün hreflang alternativləri
export function alternates(paths: Record<Locale, string>, locale: Locale) {
  return {
    canonical: paths[locale],
    languages: { az: paths.az, tr: paths.tr, ru: paths.ru, "x-default": paths.az },
  };
}
