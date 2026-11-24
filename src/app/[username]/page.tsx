import { ArrowUpRight, BadgeCheck, Briefcase, Clock, ExternalLink, MapPin, Phone, ShoppingBag, UserRound, Star } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HomeButton } from "@/components/HomeButton";
import { LanguageSwitcher } from "@/components/site/LanguageSwitcher";
import { Logo } from "@/components/Logo";
import { PageTracker } from "@/components/PageTracker";
import { RatingBadge, Stars } from "@/components/Rating";
import { SocialIcon } from "@/components/SocialIcon";
import { CATALOG_PATH } from "@/i18n/config";
import { getDictionary, getLocale } from "@/i18n/server";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { formatPhone } from "@/lib/phone";
import { PLAN_LIMITS } from "@/lib/plans";
import { maskName } from "@/lib/reviews";
import { absoluteUrl, breadcrumbs, clamp, fill, jsonLdScript } from "@/lib/seo";
import { categoryLabel, formatDuration } from "@/lib/services";
import { PLATFORM_BY_KEY } from "@/lib/social";
import { OrderForm } from "./OrderForm";

type Props = { params: Promise<{ username: string }> };

async function getProfile(username: string) {
  return db.profile.findUnique({
    where: { username: username.toLowerCase() },
    include: {
      socialLinks: { orderBy: { position: "asc" } },
      services: { where: { isActive: true, blocked: false }, orderBy: { position: "asc" } },
      portfolio: { orderBy: { position: "asc" } },
      reviews: { where: { hidden: false }, orderBy: { createdAt: "desc" }, take: 20, include: { service: { select: { title: true } } } },
      user: { select: { blockedAt: true, subscription: { select: { plan: true } } } },
    },
  });
}

// Satıcı səhifələri uzun-quyruq axtarışların əsas mənbəyidir: "makiyaj ustası Bakı" kimi sorğular bura gətirir.
// Başlıq, təsvir və strukturlu məlumat profil məlumatından qurulur.
function seoParts(profile: NonNullable<Awaited<ReturnType<typeof getProfile>>>) {
  const t = getDictionary("az").seo;
  const services = profile.services.map((s) => s.title);
  const cheapest = profile.services
    .filter((s) => s.priceType === "FIXED" && s.amountQepik !== null)
    .sort((a, b) => a.amountQepik! - b.amountQepik!)[0];
  const title = profile.profession ? fill(t.sellerTitle, { name: profile.displayName, profession: profile.profession }) : profile.displayName;
  const intro = profile.profession ? fill(t.sellerIntro, { profession: profile.profession, city: profile.city ?? "" }) : (profile.city ?? "");
  const description = services.length
    ? clamp(fill(t.sellerDescription, { intro: profile.bio?.trim() || intro, services: services.slice(0, 4).join(", ") }))
    : clamp(profile.bio?.trim() || fill(t.sellerFallback, { name: profile.displayName }));
  return { title: profile.city ? fill(t.sellerCity, { title, city: profile.city }) : title, description, cheapest };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const username = (await params).username;
  const profile = await getProfile(username);
  // Bloklanmış və ya tapılmayan səhifə indeksləşmir
  if (!profile || profile.user.blockedAt) return { robots: { index: false, follow: false } };
  const { title, description } = seoParts(profile);
  const path = `/${profile.username}`;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "profile",
      siteName: "Karvan",
      title,
      description,
      url: path,
      locale: "az_AZ",
    },
    twitter: { card: "summary", title, description },
    robots: { index: profile.showInCatalog, follow: true },
  };
}

// Axtarış sistemləri üçün: xidmətlər qiymətləri ilə birlikdə oxunaqlı formada
function SellerJsonLd({ profile }: { profile: NonNullable<Awaited<ReturnType<typeof getProfile>>> }) {
  const { description } = seoParts(profile);
  const url = absoluteUrl(`/${profile.username}`);
  const data = [
    {
      "@context": "https://schema.org",
      "@type": "ProfessionalService",
      "@id": `${url}#business`,
      name: profile.displayName,
      url,
      description,
      ...(profile.profession ? { additionalType: profile.profession, knowsAbout: profile.profession } : {}),
      ...(profile.avatarUrl ? { image: profile.avatarUrl.startsWith("http") ? profile.avatarUrl : absoluteUrl(profile.avatarUrl) } : {}),
      ...(profile.phone ? { telephone: profile.phone } : {}),
      ...(profile.city ? { address: { "@type": "PostalAddress", addressLocality: profile.city, addressCountry: "AZ" } } : {}),
      ...(profile.socialLinks.length ? { sameAs: profile.socialLinks.filter((l) => l.platform !== "CUSTOM").map((l) => l.url) } : {}),
      // Reytinq axtarış nəticəsində ulduz kimi görünə bilər (rich result)
      ...(profile.ratingAvg !== null && profile.ratingCount > 0
        ? {
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: profile.ratingAvg,
              reviewCount: profile.ratingCount,
              bestRating: 5,
              worstRating: 1,
            },
          }
        : {}),
      ...(profile.services.length
        ? {
            hasOfferCatalog: {
              "@type": "OfferCatalog",
              name: "Xidmətlər",
              itemListElement: profile.services.map((s) => ({
                "@type": "Offer",
                name: s.title,
                ...(s.description ? { description: s.description } : {}),
                ...(s.priceType === "FIXED" && s.amountQepik !== null
                  ? { price: (s.amountQepik / 100).toFixed(2), priceCurrency: s.currency, availability: "https://schema.org/InStock" }
                  : {}),
                itemOffered: { "@type": "Service", name: s.title, ...(categoryLabel(s.category) ? { serviceType: categoryLabel(s.category) } : {}) },
              })),
            },
          }
        : {}),
    },
    breadcrumbs([
      { name: "Karvan", path: "/" },
      { name: "Xidmətlər", path: CATALOG_PATH.az },
      { name: profile.displayName, path: `/${profile.username}` },
    ]),
  ];
  return <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(data)} />;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

function CallButton({ phone, label, className = "" }: { phone: string; label: string; className?: string }) {
  return (
    <a
      href={`tel:${phone}`}
      data-track="PHONE_CLICK"
      aria-label={`${label}: ${formatPhone(phone)}`}
      className={`group items-center gap-3 rounded-full bg-[var(--brand)] py-1.5 pl-1.5 pr-5 text-white shadow-lg shadow-[var(--brand)]/25 transition hover:-translate-y-0.5 hover:shadow-xl ${className}`}
    >
      <span className="grid h-9 w-9 place-items-center rounded-full bg-white/20">
        <Phone size={17} strokeWidth={2} className="transition group-hover:rotate-12" aria-hidden />
      </span>
      <span className="leading-tight">
        <span className="block text-[11px] font-medium uppercase tracking-wide text-white/75">{label}</span>
        <span className="block whitespace-nowrap font-semibold tabular-nums">{formatPhone(phone)}</span>
      </span>
    </a>
  );
}

function SectionHeading({ id, icon: Icon, title, count }: { id: string; icon: typeof Briefcase; title: string; count?: number }) {
  return (
    <h2 id={id} className="mb-4 flex scroll-mt-6 items-center gap-2.5 text-lg font-bold">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--brand)]/10 text-[var(--brand)]">
        <Icon size={17} strokeWidth={1.9} aria-hidden />
      </span>
      {title}
      {count !== undefined && <span className="text-sm font-medium text-gray-400">{count}</span>}
    </h2>
  );
}

export default async function ProfilePage({ params }: Props) {
  const profile = await getProfile((await params).username);
  if (!profile || profile.user.blockedAt) notFound();

  // Səhifənin dili: ziyarətçinin seçimi (cookie / proxy) — satıcının məzmunu olduğu kimi qalır
  const locale = await getLocale();
  const t = getDictionary(locale).seller;

  const brand = (profile.theme as { primary?: string } | null)?.primary ?? "#D6127E";
  const socials = profile.socialLinks.filter((l) => l.platform !== "CUSTOM");
  const links = profile.socialLinks.filter((l) => l.platform === "CUSTOM");
  const limits = PLAN_LIMITS[profile.user.subscription?.plan ?? "FREE"];
  const branding = limits.branding;

  const sections = [
    profile.services.length > 0 && { id: "xidmetler", label: t.services },
    profile.portfolio.length > 0 && { id: "isler", label: t.portfolio },
    profile.about && { id: "haqqimda", label: t.about },
    profile.reviews.length > 0 && { id: "reyler", label: t.reviews },
  ].filter(Boolean) as { id: string; label: string }[];

  return (
    <div className="min-h-screen bg-gray-50" style={{ "--brand": brand } as React.CSSProperties}>
      <PageTracker username={profile.username} />
      {!profile.user.blockedAt && profile.showInCatalog && <SellerJsonLd profile={profile} />}
      {/* Üz qabığı */}
      <div className="relative h-40 overflow-hidden sm:h-56">
        {profile.coverUrl ? (
          <img src={profile.coverUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div
            className="h-full w-full"
            style={{ background: `radial-gradient(120% 140% at 0% 0%, ${brand} 0%, transparent 60%), radial-gradient(120% 140% at 100% 0%, #ff94c8 0%, transparent 55%), linear-gradient(135deg, ${brand}, #111827)` }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
        <HomeButton className="absolute left-4 top-4 sm:left-6 sm:top-6" />
        {/* Ziyarətçi səhifənin dilini dəyişə bilir: satıcının yazdığı mətnlər olduğu kimi qalır */}
        <div className="absolute right-4 top-4 rounded-full bg-white/90 shadow-lg shadow-black/10 ring-1 ring-black/5 backdrop-blur sm:right-6 sm:top-6">
          <LanguageSwitcher locale={locale} label={t.language} />
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 pb-16 lg:grid-cols-[340px_1fr] lg:gap-8">
        {/* Sol: profil kartı */}
        <aside className="relative z-10 -mt-16 lg:sticky lg:top-6 lg:-mt-24 lg:self-start">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 text-center shadow-xl shadow-gray-900/5 lg:text-left">
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt={profile.displayName} className="mx-auto h-28 w-28 rounded-full object-cover ring-4 ring-white shadow-lg lg:mx-0" />
            ) : (
              <span className="mx-auto grid h-28 w-28 place-items-center rounded-full bg-[var(--brand)] text-3xl font-bold text-white ring-4 ring-white shadow-lg lg:mx-0">
                {initials(profile.displayName)}
              </span>
            )}
            <h1 className="mt-4 inline-flex items-center gap-1.5 text-2xl font-bold">
              {profile.displayName}
              {limits.verified && (
                <BadgeCheck size={22} strokeWidth={2.25} className="shrink-0 fill-sky-500 text-white" aria-label={t.verified}>
                  <title>{t.verified}</title>
                </BadgeCheck>
              )}
            </h1>
            {/* Reytinq rəylər bölməsinə aparır */}
            {profile.ratingAvg !== null && profile.ratingCount > 0 && (
              <a
                href="#reyler"
                className="mt-2 inline-flex rounded-lg transition hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand)]"
              >
                <RatingBadge value={profile.ratingAvg} count={profile.ratingCount} label={t.ratingLabel} className="justify-center lg:justify-start" />
              </a>
            )}
            {(profile.profession || profile.city) && (
              <p className="mt-1 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm text-gray-500 lg:justify-start">
                {/* Peşə: kataloqda eyni sahədəki digər satıcılar */}
                {profile.profession && (
                  <Link
                    href={`${CATALOG_PATH[locale]}?q=${encodeURIComponent(profile.profession)}`}
                    className="font-medium text-[var(--brand)] underline-offset-4 hover:underline"
                  >
                    {profile.profession}
                  </Link>
                )}
                {profile.city && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin size={14} strokeWidth={1.75} aria-hidden /> {profile.city}
                  </span>
                )}
              </p>
            )}
            {profile.bio && <p className="mt-3 text-pretty text-gray-600">{profile.bio}</p>}

            {/* Böyük ekranda nömrə sağ yuxarıdadır, kiçikdə burada */}
            {profile.phone && <CallButton phone={profile.phone} label={t.call} className="mt-5 inline-flex lg:hidden" />}

            {socials.length > 0 && (
              <ul className="mt-5 flex flex-wrap justify-center gap-2 lg:justify-start">
                {socials.map((link) => (
                  <li key={link.id}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-track="LINK_CLICK"
                      data-track-target={link.platform}
                      aria-label={PLATFORM_BY_KEY[link.platform as keyof typeof PLATFORM_BY_KEY]?.label ?? link.platform}
                      title={PLATFORM_BY_KEY[link.platform as keyof typeof PLATFORM_BY_KEY]?.label}
                      className="grid h-11 w-11 place-items-center rounded-full border border-gray-200 bg-white text-gray-700 transition hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md"
                    >
                      <SocialIcon platform={link.platform} size={19} color />
                    </a>
                  </li>
                ))}
              </ul>
            )}

            {links.length > 0 && (
              <ul className="mt-5 flex flex-col gap-2">
                {links.map((link) => (
                  <li key={link.id}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-track="LINK_CLICK"
                      data-track-target={link.label}
                      className="group flex items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-left font-medium transition hover:border-[var(--brand)] hover:shadow-md"
                    >
                      {link.label}
                      <ArrowUpRight size={18} strokeWidth={1.75} className="shrink-0 text-gray-400 transition group-hover:text-[var(--brand)]" aria-hidden />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        {/* Sağ: məzmun */}
        <main className="min-w-0 lg:pt-8">
          {/* Naviqasiya zənciri: ziyarətçi kataloqa qayıda bilir, axtarış sistemi səhifənin yerini anlayır */}
          <nav aria-label={t.nav} className="mb-4 flex flex-wrap items-center gap-1.5 text-xs text-gray-500">
            <Link href="/" className="hover:text-gray-900">
              Karvan
            </Link>
            <span aria-hidden>›</span>
            <Link href={CATALOG_PATH[locale]} className="hover:text-gray-900">
              {t.catalog}
            </Link>
            {profile.city && (
              <>
                <span aria-hidden>›</span>
                <Link href={`${CATALOG_PATH[locale]}?city=${encodeURIComponent(profile.city)}`} className="hover:text-gray-900">
                  {profile.city}
                </Link>
              </>
            )}
            <span aria-hidden>›</span>
            <span className="text-gray-700">{profile.displayName}</span>
          </nav>
          {(sections.length > 1 || profile.phone) && (
            <div className={`sticky top-0 z-10 -mx-4 mb-6 items-center gap-3 ${sections.length > 1 ? "flex" : "hidden lg:flex"} bg-gray-50/90 px-4 py-3 backdrop-blur lg:mx-0 lg:px-0`}>
              {sections.length > 1 && (
                <nav className="flex min-w-0 flex-1 gap-2 overflow-x-auto">
                  {sections.map((s) => (
                    <a key={s.id} href={`#${s.id}`} className="whitespace-nowrap rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-[var(--brand)] hover:text-[var(--brand)]">
                      {s.label}
                    </a>
                  ))}
                </nav>
              )}
              {profile.phone && <CallButton phone={profile.phone} label={t.call} className="ml-auto hidden shrink-0 lg:inline-flex" />}
            </div>
          )}

          <div className="flex flex-col gap-10">
            {profile.services.length > 0 && (
              <section>
                <SectionHeading id="xidmetler" icon={ShoppingBag} title={t.services} />
                <ul className="grid gap-3 md:grid-cols-2">
                  {profile.services.map((service) => (
                    <li key={service.id} className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 transition hover:shadow-lg hover:shadow-gray-900/5">
                      {service.imageUrl && <img src={service.imageUrl} alt={service.title} loading="lazy" className="-mx-5 -mt-5 mb-4 aspect-[16/9] w-[calc(100%+2.5rem)] max-w-none object-cover" />}
                      <div className="flex items-start justify-between gap-4">
                        <h3 className="font-semibold">{service.title}</h3>
                        <span className="shrink-0 rounded-full bg-[var(--brand)]/10 px-3 py-1 text-sm font-semibold text-[var(--brand)]">
                          {service.priceType === "FIXED" && service.amountQepik !== null ? formatMoney(service.amountQepik, service.currency) : "Razılaşma ilə"}
                        </span>
                      </div>
                      {formatDuration(service, t) && (
                        <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-gray-500">
                          <Clock size={14} strokeWidth={1.75} aria-hidden /> {formatDuration(service, t)}
                        </p>
                      )}
                      {service.description && <p className="mt-3 flex-1 text-sm text-gray-600">{service.description}</p>}
                      <OrderForm
                        serviceId={service.id}
                        serviceTitle={service.title}
                        fixedPrice={service.priceType === "FIXED"}
                        booking={profile.bookingEnabled}
                        needsAddress={service.location === "CUSTOMER"}
                        t={t}
                      />
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {profile.portfolio.length > 0 && (
              <section>
                <SectionHeading id="isler" icon={Briefcase} title={t.portfolio} count={profile.portfolio.length} />
                <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {profile.portfolio.map((item) => {
                    const body = (
                      <>
                        <div className="aspect-[4/3] overflow-hidden bg-gray-100">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.title} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                          ) : (
                            <div className="grid h-full place-items-center bg-gradient-to-br from-[var(--brand)]/15 to-gray-100 text-[var(--brand)]">
                              <Briefcase size={30} strokeWidth={1.5} aria-hidden />
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <p className="flex items-start justify-between gap-2 font-semibold">
                            {item.title}
                            {item.linkUrl && <ExternalLink size={15} strokeWidth={1.75} className="mt-1 shrink-0 text-gray-400 group-hover:text-[var(--brand)]" aria-hidden />}
                          </p>
                          {item.description && <p className="mt-1 text-sm text-gray-600">{item.description}</p>}
                        </div>
                      </>
                    );
                    const card = "group block h-full overflow-hidden rounded-2xl border border-gray-200 bg-white transition hover:shadow-lg hover:shadow-gray-900/5";
                    return (
                      <li key={item.id}>
                        {item.linkUrl ? (
                          <a href={item.linkUrl} target="_blank" rel="noopener noreferrer" className={card}>
                            {body}
                          </a>
                        ) : (
                          <div className={card}>{body}</div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

            {profile.about && (
              <section>
                <SectionHeading id="haqqimda" icon={UserRound} title={t.about} />
                <div className="whitespace-pre-line rounded-2xl border border-gray-200 bg-white p-6 leading-relaxed text-gray-700">
                  {profile.about}
                </div>
              </section>
            )}

            {profile.reviews.length > 0 && (
              <section>
                <SectionHeading id="reyler" icon={Star} title={t.reviews} count={profile.ratingCount} />
                <ul className="grid gap-3">
                  {profile.reviews.map((review) => (
                    <li key={review.id} className="rounded-2xl border border-gray-200 bg-white p-5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="flex items-center gap-2">
                          <Stars value={review.rating} />
                          <span className="font-medium">{maskName(review.customerName)}</span>
                        </span>
                        <time dateTime={review.createdAt.toISOString()} className="text-xs text-gray-400">
                          {new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short", year: "numeric" }).format(review.createdAt)}
                        </time>
                      </div>
                      {review.service && <p className="mt-1 text-xs text-gray-500">{review.service.title}</p>}
                      {review.comment && <p className="mt-2 whitespace-pre-line text-gray-700">{review.comment}</p>}
                      {review.reply && (
                        <div className="mt-3 rounded-xl bg-gray-50 p-3 text-sm">
                          <p className="font-medium text-gray-700">{t.sellerReply}</p>
                          <p className="mt-1 whitespace-pre-line text-gray-600">{review.reply}</p>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {sections.length === 0 && (
              <p className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-500">
                Bu səhifə hələ hazırlanır.
              </p>
            )}
          </div>
        </main>
      </div>

      {branding && (
        <a href="/" className="flex items-center justify-center gap-1.5 pb-10 text-xs text-gray-400 opacity-80 transition hover:opacity-100">
          <Logo size="sm" />
          {t.madeWith}
        </a>
      )}
    </div>
  );
}
