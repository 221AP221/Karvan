"use client";

import { Check, Globe } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LOCALES, LOCALE_COOKIE, LOCALE_NAMES, type Locale } from "@/i18n/config";

// Dil seçimi. Dil prefiksli səhifələrdə (ana səhifə, kataloq) həmin səhifənin o dildəki URL-inə keçir,
// qalanlarında seçimi yadda saxlayıb səhifəni yeniləyir.
export function LanguageSwitcher({ locale, paths, label, tone = "light" }: { locale: Locale; paths?: Record<Locale, string>; label: string; tone?: "light" | "dark" }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  function choose(next: Locale) {
    setOpen(false);
    if (next === locale) return;
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    // Tam keçid: <html lang> və səhifənin bütün mətnləri yeni dildə gəlsin
    if (paths) window.location.assign(paths[next] + location.search);
    else router.refresh();
  }

  const button =
    tone === "dark"
      ? "text-white/80 hover:bg-white/10 hover:text-white"
      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white";

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${label}: ${LOCALE_NAMES[locale]}`}
        className={`flex h-9 items-center gap-1.5 rounded-full px-2.5 text-sm font-semibold uppercase transition ${button}`}
      >
        <Globe size={16} strokeWidth={1.9} aria-hidden />
        {locale}
      </button>
      {open && (
        <ul
          role="listbox"
          aria-label={label}
          className="absolute right-0 top-full z-50 mt-2 w-44 overflow-hidden rounded-2xl border border-gray-200 bg-white p-1 shadow-xl dark:border-white/10 dark:bg-[#17181c]"
        >
          {LOCALES.map((l) => (
            <li key={l}>
              <button
                type="button"
                role="option"
                aria-selected={l === locale}
                onClick={() => choose(l)}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-gray-700 transition hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/10"
              >
                <span>
                  <span className="mr-2 inline-block w-6 font-semibold uppercase text-gray-400">{l}</span>
                  {LOCALE_NAMES[l]}
                </span>
                {l === locale && <Check size={15} className="text-[var(--brand)]" aria-hidden />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
