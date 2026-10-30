import type { Metadata } from "next";
import { HOME_PATH, type Locale, OG_LOCALE, alternates } from "@/i18n/config";
import { getDictionary } from "@/i18n/server";

export function landingMetadata(locale: Locale): Metadata {
  const t = getDictionary(locale).meta;
  return {
    title: { absolute: t.title },
    description: t.description,
    keywords: t.keywords,
    alternates: alternates(HOME_PATH, locale),
    openGraph: { type: "website", siteName: "Karvan", title: t.title, description: t.description, url: HOME_PATH[locale], locale: OG_LOCALE[locale] },
    twitter: { card: "summary_large_image", title: t.title, description: t.description },
  };
}
