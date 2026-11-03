import { type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/server";
import { ogImage, ogText } from "@/lib/og";

// Kataloq səhifələrinin paylaşım şəkli (4 dil üçün eyni quruluş)
export function catalogOgImage(locale: Locale) {
  const t = getDictionary(locale).catalog;
  return ogImage({ title: ogText(t.title, 48), subtitle: ogText(t.text, 130), badge: t.eyebrow });
}
