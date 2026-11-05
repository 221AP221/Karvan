import { ArrowRight, BadgeCheck, Clock, MapPin, Search, SearchX, SlidersHorizontal, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/landing/Header";
import { Stars } from "@/components/Rating";
import { SiteFooter } from "@/components/site/SiteFooter";
import type { Prisma } from "@/generated/prisma/client";
import { CATALOG_PATH, HOME_PATH, LOCALES, type Locale, OG_LOCALE } from "@/i18n/config";
import { type Dict, getDictionary } from "@/i18n/server";
import { db } from "@/lib/db";
import { formatRating } from "@/lib/reviews";
import { CURRENCIES, formatMoney, isCurrency } from "@/lib/money";
import { PLAN_LIMITS } from "@/lib/plans";
import { absoluteUrl, breadcrumbs, clamp, fill, jsonLdScript } from "@/lib/seo";
import { type SearchParams, param } from "@/lib/search-params";
import { SERVICE_CATEGORIES, localizedCategory } from "@/lib/services";
import { AutoSubmit } from "./AutoSubmit";

const PAGE_SIZE = 24;
const SORTS = ["recommended", "rating", "new", "priceAsc", "priceDesc"] as const;
type Sort = (typeof SORTS)[number];

// Kataloqun indeksləşən səhifələri: əsas səhifə, sahə və sahə+şəhər. Qalan filtr birləşmələri (axtarış, qiymət,
// sıralama, səhifə 2+) eyni məzmunun təkrarıdır: noindex verilir və canonical əsas səhifəni göstərir.
function catalogSeo(locale: Locale, sp: Record<string, string | string[] | undefined>, total?: number) {
  const t = getDictionary(locale);
  const category = SERVICE_CATEGORIES.some((c) => c.key === param(sp, "category")) ? param(sp, "category") : "";
  const city = param(sp, "city").slice(0, 60);
  const base = CATALOG_PATH[locale];
  const noisy = ["q", "price", "currency", "min", "max", "verified", "sort", "page"].some((k) => param(sp, k));
  const indexable = !noisy;
  const label = category ? (localizedCategory(category, locale) ?? "") : "";

  let title = t.catalog.metaTitle;
  let description = t.catalog.metaDescription;
  if (label) {
    title = fill(t.seo.categoryTitle, { category: label });
    description = fill(t.seo.categoryDescription, { category: label, n: total ?? "" });
  }
  if (city && indexable) title = fill(t.seo.withCity, { title, city });

  const query = new URLSearchParams();
  if (indexable && category) query.set("category", category);
  if (indexable && city) query.set("city", city);
  const suffix = query.size ? `?${query}` : "";
  // Sahə səhifəsinin digər dillərdəki qarşılığı eyni filtrlə göstərilir (hreflang)
  const languages = Object.fromEntries(LOCALES.map((l) => [l, `${CATALOG_PATH[l]}${suffix}`])) as Record<Locale, string>;
  return { title, description: clamp(description), canonical: `${base}${suffix}`, languages, indexable, category, city, label };
}

export async function catalogMetadata(locale: Locale, searchParams?: Record<string, string | string[] | undefined>): Promise<Metadata> {
  const t = getDictionary(locale).catalog;
  const sp = searchParams ?? {};
  const first = catalogSeo(locale, sp);
  // Sahə səhifəsinin təsvirində xidmət sayı göstərilir
  const total = first.label ? await countServices(first.category, first.city) : undefined;
  const seo = catalogSeo(locale, sp, total);
  return {
    title: seo.title,
    description: seo.description,
    keywords: seo.label ? [seo.label, t.metaTitle] : undefined,
    alternates: { canonical: seo.canonical, languages: { ...seo.languages, "x-default": seo.languages.az } },
    openGraph: { type: "website", siteName: "Karvan", title: seo.title, description: seo.description, url: seo.canonical, locale: OG_LOCALE[locale] },
    twitter: { card: "summary_large_image", title: seo.title, description: seo.description },
    robots: { index: seo.indexable, follow: true },
  };
}

// Sahə/şəhər üzrə ümumi say (metadata üçün)
function countServices(category: string, city: string) {
  return db.service.count({
    where: {
      isActive: true,
      blocked: false,
      ...(category ? { category } : {}),
      profile: { showInCatalog: true, user: { blockedAt: null }, ...(city ? { city: { equals: city, mode: "insensitive" as const } } : {}) },
    },
  });
}

function duration(s: { durationDays: number | null; durationWeeks: number | null; durationMonths: number | null; duration: string | null }, t: Dict["catalog"]) {
  const parts = [s.durationMonths && `${s.durationMonths} ${t.months}`, s.durationWeeks && `${s.durationWeeks} ${t.weeks}`, s.durationDays && `${s.durationDays} ${t.days}`].filter(Boolean);
  return parts.length ? parts.join(" ") : s.duration;
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

const control =
  "h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-800 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 dark:border-white/10 dark:bg-white/[0.04] dark:text-gray-100";

export async function CatalogPage({ locale, searchParams }: { locale: Locale; searchParams: SearchParams }) {
  const dict = getDictionary(locale);
  const t = { ...dict.catalog, ...dict.seo };
  const sp = await searchParams;
  const q = param(sp, "q").slice(0, 80);
  const category = param(sp, "category");
  const city = param(sp, "city").slice(0, 60);
  const price = param(sp, "price");
  const currency = isCurrency(param(sp, "currency")) ? param(sp, "currency") : "";
  const min = Number(param(sp, "min").replace(",", "."));
  const max = Number(param(sp, "max").replace(",", "."));
  const verified = param(sp, "verified") === "1";
  const sort: Sort = (SORTS as readonly string[]).includes(param(sp, "sort")) ? (param(sp, "sort") as Sort) : "recommended";
  const page = Math.max(1, Math.floor(Number(param(sp, "page")) || 1));

  const where: Prisma.ServiceWhereInput = {
    isActive: true,
    blocked: false,
    profile: {
      showInCatalog: true,
      user: { blockedAt: null },
      ...(city && { city: { equals: city, mode: "insensitive" } }),
      ...(verified && { user: { blockedAt: null, subscription: { plan: { in: ["PRO", "PRO_MAX"] } } } }),
    },
    ...(q && {
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { customCategory: { contains: q, mode: "insensitive" } },
        { profile: { displayName: { contains: q, mode: "insensitive" } } },
        { profile: { profession: { contains: q, mode: "insensitive" } } },
      ],
    }),
    ...(SERVICE_CATEGORIES.some((c) => c.key === category) && { category }),
    ...(price === "fixed" && { priceType: "FIXED" }),
    ...(price === "negotiable" && { priceType: "NEGOTIABLE" }),
  };
  // Məbləğ filtri yalnız bir valyutada mənalıdır (valyuta seçilməyibsə AZN)
  if (min > 0 || max > 0) {
    where.priceType = "FIXED";
    where.currency = currency || "AZN";
    where.amountQepik = { ...(min > 0 && { gte: Math.round(min * 100) }), ...(max > 0 && { lte: Math.round(max * 100) }) };
  } else if (currency) {
    where.currency = currency;
  }

  const orderBy: Prisma.ServiceOrderByWithRelationInput[] =
    sort === "rating"
      ? [{ profile: { ratingAvg: { sort: "desc", nulls: "last" } } }, { profile: { ratingCount: "desc" } }, { createdAt: "desc" }]
      : sort === "new"
      ? [{ createdAt: "desc" }]
      : sort === "priceAsc"
        ? [{ amountQepik: { sort: "asc", nulls: "last" } }]
        : sort === "priceDesc"
          ? [{ amountQepik: { sort: "desc", nulls: "last" } }]
          : // Tövsiyə: əvvəl Pro Max (önə çıxan), sonra Pro, sonra yeni xidmətlər
            [{ profile: { user: { subscription: { plan: "desc" } } } }, { createdAt: "desc" }];

  const [total, services, cityRows] = await Promise.all([
    db.service.count({ where }),
    db.service.findMany({
      where,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        profile: {
          select: { username: true, displayName: true, profession: true, city: true, avatarUrl: true, theme: true, ratingAvg: true, ratingCount: true, user: { select: { subscription: { select: { plan: true } } } } },
        },
      },
    }),
    db.profile.findMany({
      where: { showInCatalog: true, user: { blockedAt: null }, city: { not: null }, services: { some: { isActive: true, blocked: false } } },
      select: { city: true },
      distinct: ["city"],
      orderBy: { city: "asc" },
    }),
  ]);
  const cities = [...new Set(cityRows.map((c) => c.city!.trim()).filter(Boolean))];
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const path = CATALOG_PATH[locale];
  const seo = catalogSeo(locale, sp, total);
  const active = Boolean(q || category || city || price || currency || min || max || verified || sort !== "recommended");

  const pageHref = (n: number) => {
    const next = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) if (typeof v === "string" && v && k !== "page") next.set(k, v);
    if (n > 1) next.set("page", String(n));
    return `${path}${next.size ? `?${next}` : ""}`;
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 [color-scheme:light] dark:bg-[#0c0c0f] dark:text-gray-100 dark:[color-scheme:dark]">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(catalogJsonLd(locale, seo, services, total))} />
      <Header locale={locale} nav={dict.nav} common={dict.common} paths={CATALOG_PATH} onHome={false} />

      <section className="relative overflow-hidden border-b border-gray-100 bg-gradient-to-b from-violet-50/70 to-white pb-10 pt-28 dark:border-white/5 dark:from-violet-500/10 dark:to-transparent">
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-pink-300/30 blur-3xl dark:bg-pink-600/20" />
        <div className="relative mx-auto max-w-6xl px-4">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-600 dark:text-violet-300">{t.eyebrow}</p>
          {/* Sahə seçiləndə başlıq həmin sahəni göstərir: axtarışda bu səhifə o söz üzrə tanınır */}
          <h1 className="mt-3 max-w-3xl text-balance text-4xl font-bold leading-tight sm:text-5xl">{seo.label ? seo.title : t.title}</h1>
          <p className="mt-4 max-w-2xl text-lg text-gray-600 dark:text-gray-400">{t.text}</p>

          {/* GET formu: filtrlər URL-də qalır, link paylaşmaq olur, JS olmadan da işləyir */}
          <form action={path} className="mt-8 rounded-3xl border border-gray-200 bg-white p-3 shadow-xl shadow-violet-900/5 dark:border-white/10 dark:bg-white/[0.04]">
            <AutoSubmit />
            <div className="flex gap-2">
              <label className="relative flex-1">
                <span className="sr-only">{t.search}</span>
                <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden />
                <input name="q" defaultValue={q} placeholder={t.search} className={`${control} h-12 pl-11 text-base`} />
              </label>
              <button className="h-12 shrink-0 rounded-xl bg-gray-900 px-6 font-semibold text-white transition hover:bg-gray-800 dark:bg-white dark:text-gray-900">{t.searchButton}</button>
            </div>
            <fieldset className="mt-3">
              <legend className="flex items-center gap-2 px-2 pb-2 text-sm font-medium text-gray-600 dark:text-gray-300">
                <SlidersHorizontal size={16} aria-hidden /> {t.filters}
              </legend>
              <div className="grid grid-cols-2 gap-2 px-1 pb-1 lg:grid-cols-4">
                <label>
                  <span className="mb-1 block text-xs font-medium text-gray-500">{t.category}</span>
                  <select name="category" defaultValue={category} className={control} data-autosubmit>
                    <option value="">{t.allCategories}</option>
                    {SERVICE_CATEGORIES.map((c) => (
                      <option key={c.key} value={c.key}>
                        {localizedCategory(c.key, locale)}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className="mb-1 block text-xs font-medium text-gray-500">{t.city}</span>
                  <select name="city" defaultValue={city} className={control} data-autosubmit>
                    <option value="">{t.allCities}</option>
                    {cities.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className="mb-1 block text-xs font-medium text-gray-500">{t.priceType}</span>
                  <select name="price" defaultValue={price} className={control} data-autosubmit>
                    <option value="">{t.anyPrice}</option>
                    <option value="fixed">{t.fixed}</option>
                    <option value="negotiable">{t.negotiable}</option>
                  </select>
                </label>
                <label>
                  <span className="mb-1 block text-xs font-medium text-gray-500">{t.sort}</span>
                  <select name="sort" defaultValue={sort} className={control} data-autosubmit>
                    {SORTS.map((s) => (
                      <option key={s} value={s}>
                        {t.sorts[s]}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="col-span-2 grid grid-cols-[1fr_1fr_1.2fr] gap-2">
                  <label>
                    <span className="mb-1 block text-xs font-medium text-gray-500">{t.min}</span>
                    <input name="min" inputMode="decimal" defaultValue={min > 0 ? String(min) : ""} placeholder="0" className={control} />
                  </label>
                  <label>
                    <span className="mb-1 block text-xs font-medium text-gray-500">{t.max}</span>
                    <input name="max" inputMode="decimal" defaultValue={max > 0 ? String(max) : ""} placeholder="1000" className={control} />
                  </label>
                  <label>
                    <span className="mb-1 block text-xs font-medium text-gray-500">{t.currency}</span>
                    <select name="currency" defaultValue={currency} className={control} data-autosubmit>
                      <option value="">—</option>
                      {CURRENCIES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="col-span-2 flex items-end justify-between gap-3">
                  <label className="flex h-11 cursor-pointer items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <input type="checkbox" name="verified" value="1" defaultChecked={verified} className="h-4 w-4 accent-[var(--brand)]" data-autosubmit />
                    <BadgeCheck size={16} className="fill-sky-500 text-white" aria-hidden /> {t.verified}
                  </label>
                  {active && (
                    <Link href={path} className="h-11 rounded-xl px-4 text-sm font-medium leading-[2.75rem] text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-white/10 dark:hover:text-white">
                      {t.reset}
                    </Link>
                  )}
                </div>
              </div>
            </fieldset>
          </form>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 py-10">
        <p className="mb-5 text-sm text-gray-500" aria-live="polite">
          {t.results.replace("{n}", String(total))}
        </p>

        {services.length ? (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => {
              const plan = s.profile.user.subscription?.plan ?? "FREE";
              const limits = PLAN_LIMITS[plan];
              const brand = (s.profile.theme as { primary?: string } | null)?.primary ?? "#D6127E";
              const time = duration(s, t);
              const cat = s.category === "other" && s.customCategory ? s.customCategory : localizedCategory(s.category, locale);
              return (
                <li key={s.id}>
                  <Link
                    href={`/${s.profile.username}#xidmetler`}
                    className={`group flex h-full flex-col rounded-3xl border bg-white p-5 transition duration-300 hover:-translate-y-1 hover:shadow-xl dark:bg-white/[0.03] ${
                      limits.featured ? "border-amber-300/80 shadow-lg shadow-amber-500/10 dark:border-amber-400/30" : "border-gray-200 hover:border-violet-200 dark:border-white/10 dark:hover:border-violet-400/30"
                    }`}
                    style={{ "--brand": brand } as React.CSSProperties}
                  >
                    {s.imageUrl && <img src={s.imageUrl} alt="" loading="lazy" className="-mx-5 -mt-5 mb-4 aspect-[16/9] w-[calc(100%+2.5rem)] max-w-none rounded-t-3xl object-cover" />}
                    <div className="flex items-center gap-3">
                      {s.profile.avatarUrl ? (
                        <img src={s.profile.avatarUrl} alt="" loading="lazy" className="h-11 w-11 shrink-0 rounded-full object-cover" />
                      ) : (
                        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[var(--brand)] text-sm font-bold text-white">{initials(s.profile.displayName)}</span>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-1 truncate text-sm font-semibold">
                          <span className="truncate">{s.profile.displayName}</span>
                          {limits.verified && <BadgeCheck size={15} className="shrink-0 fill-sky-500 text-white" aria-label={t.verifiedBadge} />}
                        </p>
                        {s.profile.ratingAvg !== null && s.profile.ratingCount > 0 && (
                          <span className="mt-0.5 flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300">
                            <Stars value={s.profile.ratingAvg} size={12} />
                            <span className="font-semibold tabular-nums">{formatRating(s.profile.ratingAvg)}</span>
                            <span className="text-gray-400">({s.profile.ratingCount})</span>
                          </span>
                        )}
                        <p className="flex items-center gap-1 truncate text-xs text-gray-500 dark:text-gray-400">
                          {s.profile.profession}
                          {s.profile.city && (
                            <>
                              {s.profile.profession && " · "}
                              <MapPin size={11} className="shrink-0" aria-hidden /> {s.profile.city}
                            </>
                          )}
                        </p>
                      </div>
                      {limits.featured && (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800 dark:bg-amber-400/15 dark:text-amber-200">
                          <Sparkles size={11} aria-hidden /> {t.featured}
                        </span>
                      )}
                    </div>

                    <h2 className="mt-4 text-lg font-semibold leading-snug">{s.title}</h2>
                    {s.description && <p className="mt-1.5 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">{s.description}</p>}

                    <div className="mt-auto flex flex-wrap items-center gap-2 pt-4 text-xs text-gray-500 dark:text-gray-400">
                      {cat && <span className="rounded-full bg-gray-100 px-2.5 py-1 dark:bg-white/10">{cat}</span>}
                      {time && (
                        <span className="inline-flex items-center gap-1">
                          <Clock size={12} aria-hidden /> {time}
                        </span>
                      )}
                    </div>
                    <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4 dark:border-white/10">
                      <span className="font-display text-lg font-bold tabular-nums">
                        {s.priceType === "FIXED" && s.amountQepik !== null ? formatMoney(s.amountQepik, s.currency) : <span className="text-base font-semibold text-gray-500 dark:text-gray-400">{t.negotiable}</span>}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white transition group-hover:gap-2">
                        {t.order} <ArrowRight size={15} aria-hidden />
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="flex flex-col items-center rounded-3xl border border-dashed border-gray-300 px-6 py-16 text-center dark:border-white/15">
            <SearchX size={36} strokeWidth={1.5} className="text-gray-400" aria-hidden />
            <p className="mt-4 font-semibold">{t.empty}</p>
            <p className="mt-1 text-sm text-gray-500">{t.emptyHint}</p>
            <Link href={path} className="mt-5 rounded-full border border-gray-300 px-5 py-2 text-sm font-medium hover:border-gray-900 dark:border-white/20">
              {t.reset}
            </Link>
          </div>
        )}

        {pages > 1 && (
          <nav className="mt-10 flex items-center justify-center gap-3 text-sm" aria-label={t.page.replace("{n}", String(page)).replace("{total}", String(pages))}>
            {page > 1 && (
              <Link href={pageHref(page - 1)} className="rounded-full border border-gray-300 px-4 py-2 font-medium hover:border-gray-900 dark:border-white/20">
                {t.prev}
              </Link>
            )}
            <span className="text-gray-500">{t.page.replace("{n}", String(page)).replace("{total}", String(pages))}</span>
            {page < pages && (
              <Link href={pageHref(page + 1)} className="rounded-full border border-gray-300 px-4 py-2 font-medium hover:border-gray-900 dark:border-white/20">
                {t.next}
              </Link>
            )}
          </nav>
        )}

        {/* Axtarış sistemləri sahə və şəhər səhifələrini yalnız bu linklərlə tapa bilir (filtrlər <select>-dir) */}
        <nav aria-label={t.browseCategories} className="mt-12 border-t border-gray-100 pt-8 dark:border-white/10">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{t.browseCategories}</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {SERVICE_CATEGORIES.map((c) => (
              <li key={c.key}>
                <Link
                  href={`${path}?category=${c.key}`}
                  className={`inline-block rounded-full border px-3 py-1.5 text-sm transition ${c.key === category ? "border-gray-900 bg-gray-900 text-white dark:border-white dark:bg-white dark:text-gray-900" : "border-gray-200 text-gray-700 hover:border-gray-400 dark:border-white/10 dark:text-gray-300"}`}
                >
                  {localizedCategory(c.key, locale)}
                </Link>
              </li>
            ))}
          </ul>
          {cities.length > 0 && (
            <>
              <h2 className="mt-6 text-sm font-semibold text-gray-900 dark:text-white">{t.browseCities}</h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {cities.map((c) => (
                  <li key={c}>
                    <Link
                      href={`${path}?${category ? `category=${category}&` : ""}city=${encodeURIComponent(c)}`}
                      className={`inline-block rounded-full border px-3 py-1.5 text-sm transition ${c === city ? "border-gray-900 bg-gray-900 text-white dark:border-white dark:bg-white dark:text-gray-900" : "border-gray-200 text-gray-700 hover:border-gray-400 dark:border-white/10 dark:text-gray-300"}`}
                    >
                      {c}
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </nav>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 rounded-3xl bg-gradient-to-r from-violet-600 to-pink-600 p-8 text-white sm:flex-row">
          <p className="text-lg font-semibold">{t.sellerCta}</p>
          <Link href="/signup" className="shrink-0 rounded-full bg-white px-6 py-3 font-semibold text-violet-700">
            {t.sellerButton}
          </Link>
        </div>
      </main>

      <SiteFooter locale={locale} t={dict} paths={CATALOG_PATH} />
    </div>
  );
}

// Kataloq nəticələri: axtarış sistemləri siyahını və qiymətləri oxuya bilsin
function catalogJsonLd(
  locale: Locale,
  seo: ReturnType<typeof catalogSeo>,
  services: { title: string; description: string | null; amountQepik: number | null; currency: string; priceType: string; profile: { username: string; displayName: string } }[],
  total: number,
) {
  const t = getDictionary(locale);
  return [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: seo.title,
      description: seo.description,
      url: absoluteUrl(seo.canonical),
      inLanguage: locale,
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: total,
        itemListElement: services.slice(0, 20).map((s, i) => ({
          "@type": "ListItem",
          position: i + 1,
          url: absoluteUrl(`/${s.profile.username}#xidmetler`),
          item: {
            "@type": "Service",
            name: s.title,
            ...(s.description ? { description: clamp(s.description, 200) } : {}),
            provider: { "@type": "ProfessionalService", name: s.profile.displayName, url: absoluteUrl(`/${s.profile.username}`) },
            ...(s.priceType === "FIXED" && s.amountQepik !== null
              ? { offers: { "@type": "Offer", price: (s.amountQepik / 100).toFixed(2), priceCurrency: s.currency, availability: "https://schema.org/InStock" } }
              : {}),
          },
        })),
      },
    },
    breadcrumbs([
      { name: "Karvan", path: HOME_PATH[locale] },
      { name: t.catalog.eyebrow, path: CATALOG_PATH[locale] },
      ...(seo.label ? [{ name: seo.label, path: seo.canonical }] : []),
    ]),
  ];
}
