import type { MetadataRoute } from "next";
import { CATALOG_PATH, HOME_PATH, LOCALES, SITE_URL } from "@/i18n/config";
import { db } from "@/lib/db";

// Yeni satıcılar saatda bir əlavə olunur
export const revalidate = 3600;

// Hər dil versiyası ayrıca URL-dir və bir-birinə hreflang ilə bağlanır; satıcı səhifələri də daxildir
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const localized = (paths: Record<(typeof LOCALES)[number], string>, priority: number) =>
    LOCALES.map((l) => ({
      url: `${SITE_URL}${paths[l] === "/" ? "" : paths[l]}`,
      changeFrequency: "weekly" as const,
      priority,
      alternates: { languages: Object.fromEntries(LOCALES.map((x) => [x, `${SITE_URL}${paths[x] === "/" ? "" : paths[x]}`])) },
    }));

  const sellers = await db.profile.findMany({
    where: { showInCatalog: true, services: { some: { isActive: true } } },
    select: { username: true },
    take: 5000,
  });

  return [
    ...localized(HOME_PATH, 1),
    ...localized(CATALOG_PATH, 0.9),
    ...sellers.map((s) => ({ url: `${SITE_URL}/${s.username}`, changeFrequency: "weekly" as const, priority: 0.6 })),
  ];
}
