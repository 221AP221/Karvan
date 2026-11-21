import { ArrowRight, type LucideIcon } from "lucide-react";
import Link from "next/link";

// İki sıra, əks istiqamətdə axan sahələr zolağı (CSS animasiyası, GPU ilə, bulanıqlıqsız).
// Hər sıranın sonunda "daha çoxları" linki dövr edərkən bir dəfə görünür (kataloqa aparır).
export function Marquee({ rows, more }: { rows: { label: string; icon: LucideIcon }[][]; more?: { label: string; href: string } }) {
  return (
    <div className="flex flex-col gap-3 [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
      {rows.map((items, r) => (
        <div key={r} className="group flex overflow-hidden">
          {[0, 1].map((copy) => (
            <ul
              key={copy}
              aria-hidden={copy === 1}
              className={`flex shrink-0 gap-3 pr-3 group-hover:[animation-play-state:paused] ${r % 2 ? "animate-marquee-reverse" : "animate-marquee"}`}
            >
              {items.map(({ label, icon: Icon }) => (
                <li
                  key={label}
                  className="flex items-center gap-2.5 whitespace-nowrap rounded-full border border-gray-200 bg-white py-2 pl-2 pr-5 text-sm font-medium text-gray-700 shadow-sm sm:text-[15px] dark:border-white/10 dark:bg-white/[0.04] dark:text-gray-200"
                >
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-violet-50 text-violet-600 ring-1 ring-violet-100 dark:bg-violet-500/15 dark:text-violet-300 dark:ring-violet-400/20">
                    <Icon size={15} strokeWidth={1.75} aria-hidden />
                  </span>
                  {label}
                </li>
              ))}
              {more && (
                <li aria-hidden={copy === 1 ? true : undefined}>
                  <Link
                    href={more.href}
                    tabIndex={copy === 1 ? -1 : undefined}
                    className="flex items-center gap-1.5 whitespace-nowrap rounded-full bg-gray-900 py-2 pl-5 pr-4 text-sm font-medium text-white shadow-sm transition hover:bg-gray-800 sm:text-[15px] dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
                  >
                    {more.label}
                    <ArrowRight size={15} strokeWidth={2} aria-hidden />
                  </Link>
                </li>
              )}
            </ul>
          ))}
        </div>
      ))}
    </div>
  );
}
