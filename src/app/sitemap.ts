import type { MetadataRoute } from "next";
import { CATALOG_PATH, HOME_PATH, LOCALES, SITE_URL } from "@/i18n/config";
import { db } from "@/lib/db";
import { SERVICE_CATEGORIES } from "@/lib/services";

// Yeni satıcılar və xidmətlər saatda bir dəfə sitemap-a düşür
export const revalidate = 3600;

const url = (path: string) => `${SITE_URL}${path === "/" ? "" : path}`;

// Hər dil versiyası ayrıca URL-dir və bir-birinə hreflang ilə bağlanır
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const localized = (paths: Record<(typeof LOCALES)[number], string>, priority: number, suffix = "") =>
    LOCALES.map((l) => ({
      url: url(paths[l]) + suffix,
      changeFrequency: "weekly" as const,
      priority,
      alternates: { languages: Object.fromEntries(LOCALES.map((x) => [x, url(paths[x]) + suffix])) },
    }));

  const [sellers, categories] = await Promise.all([
    db.profile.findMany({
      where: { showInCatalog: true, user: { blockedAt: null }, services: { some: { isActive: true, blocked: false } } },
      select: { username: true, services: { select: { createdAt: true }, orderBy: { createdAt: "desc" }, take: 1 } },
      take: 5000,
    }),
    // Yalnız xidməti olan sahələr: boş səhifələr sitemap-a düşmür
    db.service.groupBy({
      by: ["category"],
      where: { isActive: true, blocked: false, profile: { showInCatalog: true, user: { blockedAt: null } } },
      _count: true,
    }),
  ]);
  const filled = new Set(categories.map((c) => c.category));

  return [
    ...localized(HOME_PATH, 1),
    ...localized(CATALOG_PATH, 0.9),
    ...SERVICE_CATEGORIES.filter((c) => filled.has(c.key)).flatMap((c) => localized(CATALOG_PATH, 0.7, `?category=${c.key}`)),
    // Hüquqi sənədlər: tək dildə (Azərbaycan), ona görə hreflang verilmir
    ...["/qaydalar", "/mexfilik", "/cookie"].map((path) => ({
      url: url(path),
      changeFrequency: "yearly" as const,
      priority: 0.3,
    })),
    ...sellers.map((s) => ({
      url: url(`/${s.username}`),
      lastModified: s.services[0]?.createdAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
