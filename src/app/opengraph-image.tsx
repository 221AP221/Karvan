import { getDictionary } from "@/i18n/server";
import { OG_CONTENT_TYPE, OG_SIZE, ogImage, ogText } from "@/lib/og";

export const alt = "Karvan — link-in-bio səhifə, sifariş və onlayn faktura";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image() {
  const t = getDictionary("az");
  return ogImage({ title: t.hero.lead.join(" ") + " " + t.hero.words[0], subtitle: ogText(t.meta.description, 140) });
}
