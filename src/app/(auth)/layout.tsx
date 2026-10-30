import { FileText, Link2, ShieldCheck, Wallet } from "lucide-react";
import Link from "next/link";
import { AuthShowcase } from "@/components/auth/AuthShowcase";
import { BackButton } from "@/components/BackButton";
import { Logo } from "@/components/Logo";
import { LanguageSwitcher } from "@/components/site/LanguageSwitcher";
import { ThemeToggle } from "@/components/site/ThemeToggle";
import { HOME_PATH } from "@/i18n/config";
import { getDictionary, getLocale } from "@/i18n/server";

const POINT_ICONS = [Link2, FileText, Wallet];

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const t = getDictionary(locale);
  const a = t.auth;
  const home = HOME_PATH[locale];
  return (
    <div className="relative min-h-screen overflow-hidden">
      <AuthShowcase />

      <div className="relative grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
        {/* Sol: mesaj (yalnız böyük ekranda) */}
        <div className="hidden flex-col justify-between p-12 text-white lg:flex">
          <Link href={home} className="w-fit" aria-label="Karvan">
            <Logo tone="dark" />
          </Link>
          <div className="max-w-md">
            <h2 className="text-4xl font-bold leading-tight">
              {a.headline[0]}
              <br />
              <span className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-amber-200 bg-clip-text text-transparent">{a.headline[1]}</span> {a.headline[2]}
            </h2>
            <ul className="mt-8 space-y-4">
              {a.points.map((text, i) => {
                const Icon = POINT_ICONS[i];
                return (
                <li key={text} className="flex items-center gap-3 text-white/80">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/10 ring-1 ring-white/15">
                    <Icon size={17} strokeWidth={1.75} aria-hidden />
                  </span>
                  {text}
                </li>
                );
              })}
            </ul>
          </div>
          <p className="flex items-center gap-2 text-sm text-white/50">
            <ShieldCheck size={16} aria-hidden /> {a.secure}
          </p>
        </div>

        {/* Sağ: forma */}
        <div className="flex items-center justify-center p-4 text-gray-900 sm:p-8 lg:bg-white dark:text-gray-100 lg:dark:bg-[#0f1013]">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl shadow-black/30 sm:p-8 lg:rounded-none lg:p-0 lg:shadow-none dark:bg-[#141519] lg:dark:bg-transparent">
            <div className="mb-8 flex items-center justify-between">
              <BackButton fallback={home} label={t.common.back} className="-ml-2 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white" />
              <Link href={home} className="lg:hidden" aria-label="Karvan">
                <span className="dark:hidden">
                  <Logo />
                </span>
                <span className="hidden dark:inline">
                  <Logo tone="dark" />
                </span>
              </Link>
              <div className="flex items-center gap-1">
                <Link href={home} className="hidden rounded-full px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-900 lg:inline dark:text-gray-400 dark:hover:text-white">
                  {t.common.home}
                </Link>
                <LanguageSwitcher locale={locale} label={t.common.language} />
                <ThemeToggle labels={{ light: t.common.themeLight, dark: t.common.themeDark }} />
              </div>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
