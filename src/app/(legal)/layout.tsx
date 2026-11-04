import Link from "next/link";
import { HomeButton } from "@/components/HomeButton";

export const LEGAL_UPDATED = "4 noyabr 2026";

const pages = [
  { href: "/qaydalar", label: "İstifadə şərtləri" },
  { href: "/mexfilik", label: "Məxfilik siyasəti" },
  { href: "/cookie", label: "Cookie siyasəti" },
];

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0c0d10]">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <HomeButton className="shadow-none ring-gray-200 dark:bg-white/10 dark:text-white dark:ring-white/10" />

        <nav aria-label="Hüquqi sənədlər" className="mt-8 flex flex-wrap gap-2">
          {pages.map((p) => (
            <Link
              key={p.href}
              href={p.href}
              className="rounded-full border border-gray-200 bg-white px-3.5 py-1.5 text-sm text-gray-700 transition hover:border-gray-400 dark:border-white/10 dark:bg-white/5 dark:text-gray-200"
            >
              {p.label}
            </Link>
          ))}
        </nav>

        <article className="legal mt-6 rounded-2xl border border-gray-200 bg-white p-6 sm:p-9 dark:border-white/10 dark:bg-white/[0.03]">
          {children}
        </article>

        <p className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
          Sual yarandıqda: <a href="mailto:hello@karvan.az" className="underline">hello@karvan.az</a> · *0221
        </p>
      </div>
    </div>
  );
}
