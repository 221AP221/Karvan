import { getDictionary } from "@/i18n/server";
import { OG_CONTENT_TYPE, OG_SIZE, ogImage, ogText } from "@/lib/og";

const t = getDictionary("en");
export const alt = t.meta.title;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image() {
  return ogImage({ title: t.hero.lead.join(" ") + " " + t.hero.words[0], subtitle: ogText(t.meta.description, 140) });
}
