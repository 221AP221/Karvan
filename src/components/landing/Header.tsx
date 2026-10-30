"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Logo } from "@/components/Logo";
import { LanguageSwitcher } from "@/components/site/LanguageSwitcher";
import { ThemeToggle } from "@/components/site/ThemeToggle";
import { CATALOG_PATH, HOME_PATH, type Locale } from "@/i18n/config";
import type { Dict } from "@/i18n/server";

export { Logo };

type Props = {
  locale: Locale;
  nav: Dict["nav"];
  common: Dict["common"];
  // Dil dəyişəndə keçiləcək səhifə (ana səhifə və ya kataloq)
  paths: Record<Locale, string>;
  // Ana səhifədə bölmələrə keçid lövbərlə, digər səhifələrdə ana səhifənin bölməsinə
  onHome?: boolean;
};

export function Header({ locale, nav, common, paths, onHome = true }: Props) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const home = HOME_PATH[locale];
  const anchor = (id: string) => (onHome ? `#${id}` : `${home === "/" ? "" : home}/#${id}`);

  const items = [
    { href: anchor("nece-isleyir"), label: nav.how },
    { href: anchor("imkanlar"), label: nav.features },
    { href: CATALOG_PATH[locale], label: nav.catalog, page: true },
    { href: anchor("qiymetler"), label: nav.pricing },
    { href: anchor("suallar"), label: nav.faq },
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const link = "rounded-full px-3 py-2 transition hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-white/10 dark:hover:text-white";

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled || open ? "border-b border-gray-200/70 bg-white/80 shadow-sm backdrop-blur-lg dark:border-white/10 dark:bg-[#0c0c0f]/80" : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <Link href={home} aria-label="Karvan">
          <span className="dark:hidden">
            <Logo />
          </span>
          <span className="hidden dark:inline">
            <Logo tone="dark" />
          </span>
        </Link>

        <nav className="hidden items-center gap-0.5 text-sm text-gray-600 lg:flex dark:text-gray-300">
          {items.map((item) =>
            item.page ? (
              <Link key={item.href} href={item.href} className={link}>
                {item.label}
              </Link>
            ) : (
              <a key={item.href} href={item.href} className={link}>
                {item.label}
              </a>
            ),
          )}
        </nav>

        <div className="flex items-center gap-1">
          <LanguageSwitcher locale={locale} paths={paths} label={common.language} />
          <ThemeToggle labels={{ light: common.themeLight, dark: common.themeDark }} />
          <div className="ml-1 hidden items-center gap-2 lg:flex">
            <Link href="/login" className="rounded-full px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/10">
              {nav.login}
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-gray-900/10 transition hover:-translate-y-0.5 hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
            >
              {nav.signup}
            </Link>
          </div>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="grid h-10 w-10 place-items-center rounded-full hover:bg-gray-100 lg:hidden dark:hover:bg-white/10"
            aria-label={open ? common.menuClose : common.menuOpen}
            aria-expanded={open}
          >
            <span className="relative block h-3 w-5">
              <span className={`absolute left-0 h-0.5 w-5 bg-gray-900 transition dark:bg-white ${open ? "top-1.5 rotate-45" : "top-0"}`} />
              <span className={`absolute left-0 top-1.5 h-0.5 w-5 bg-gray-900 transition dark:bg-white ${open ? "opacity-0" : ""}`} />
              <span className={`absolute left-0 h-0.5 w-5 bg-gray-900 transition dark:bg-white ${open ? "top-1.5 -rotate-45" : "top-3"}`} />
            </span>
          </button>
        </div>
      </div>

      <div className={`grid overflow-hidden transition-all duration-300 lg:hidden ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <nav className="min-h-0">
          <div className="flex flex-col gap-1 px-4 pb-4">
            {items.map((item) => (
              <a key={item.href} href={item.href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/10">
                {item.label}
              </a>
            ))}
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Link href="/login" className="rounded-full border border-gray-300 py-2.5 text-center text-sm font-medium dark:border-white/20">
                {nav.login}
              </Link>
              <Link href="/signup" className="rounded-full bg-gray-900 py-2.5 text-center text-sm font-medium text-white dark:bg-white dark:text-gray-900">
                {nav.signup}
              </Link>
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
}
