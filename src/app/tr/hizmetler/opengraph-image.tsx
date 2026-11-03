import { getDictionary } from "@/i18n/server";
import { OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og";
import { catalogOgImage } from "@/lib/og-catalog";

export const alt = getDictionary("tr").catalog.metaTitle;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image() {
  return catalogOgImage("tr");
}
