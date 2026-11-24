import Link from "next/link";
import { Logo } from "@/components/Logo";
import { CATALOG_PATH, HOME_PATH, type Locale } from "@/i18n/config";
import type { Dict } from "@/i18n/server";

// Sayt footeri: ana səhifə və kataloq üçün ortaq
export function SiteFooter({ locale, t }: { locale: Locale; t: Dict }) {
  const f = t.footer;
  const home = HOME_PATH[locale] === "/" ? "" : HOME_PATH[locale];
  const columns = [
    {
      title: f.product,
      links: [
        { href: `${home}/#nece-isleyir`, label: f.links.how },
        { href: `${home}/#imkanlar`, label: f.links.features },
        { href: `${home}/#ai`, label: f.links.ai },
        { href: `${home}/#qiymetler`, label: f.links.pricing },
      ],
    },
    {
      title: f.explore,
      links: [
        { href: CATALOG_PATH[locale], label: f.links.catalog },
        { href: "/demo", label: f.links.demo },
        { href: `${home}/#suallar`, label: f.links.faq },
      ],
    },
    {
      title: f.legal,
      links: [
        { href: "/qaydalar", label: f.links.terms },
        { href: "/mexfilik", label: f.links.privacy },
        { href: "/cookie", label: f.links.cookies },
      ],
    },
    {
      title: f.account,
      links: [
        { href: "/signup", label: f.links.signup },
        { href: "/login", label: f.links.login },
        { href: "/forgot-password", label: f.links.forgot },
      ],
    },
  ];

  return (
    <footer className="border-t border-gray-200 bg-gray-50/60 text-sm dark:border-white/10 dark:bg-white/[0.02]">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 md:grid-cols-[1.4fr_repeat(4,1fr)] lg:grid-cols-[1.3fr_repeat(5,1fr)]">
        <div className="max-w-xs">
          <Link href={HOME_PATH[locale]} aria-label="Karvan" className="inline-block">
            <span className="dark:hidden">
              <Logo />
            </span>
            <span className="hidden dark:inline">
              <Logo tone="dark" />
            </span>
          </Link>
          <p className="mt-4 leading-relaxed text-gray-600 dark:text-gray-400">{f.tagline}</p>
        </div>

        {columns.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <p className="font-semibold text-gray-900 dark:text-white">{col.title}</p>
            <ul className="mt-4 space-y-3">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-gray-600 transition hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <div>
          <p className="font-semibold text-gray-900 dark:text-white">{f.contact}</p>
          {/* İkonsuz: mətnin özü nə olduğunu deyir. Hər sətir öz yerinə aparır. */}
          <ul className="mt-4 space-y-3 text-gray-600 dark:text-gray-400">
            <li>
              <a href="tel:*0221" className="font-semibold text-gray-900 transition hover:text-[var(--brand)] dark:text-white">
                *0221
              </a>
            </li>
            <li>
              <a href="mailto:hello@karvan.az" className="transition hover:text-gray-900 dark:hover:text-white">
                hello@karvan.az
              </a>
            </li>
            <li>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(f.city)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="transition hover:text-gray-900 dark:hover:text-white"
              >
                {f.city}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-200 dark:border-white/10">
        {/* Dil və tema seçimi yuxarıdakı başlıqdadır: burada təkrarına ehtiyac yoxdur */}
        <div className="mx-auto max-w-6xl px-4 py-6 text-gray-500 dark:text-gray-400">
          <p>© 2026 Karvan. {f.rights}</p>
        </div>
      </div>
    </footer>
  );
}
