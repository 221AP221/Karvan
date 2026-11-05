"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useLayoutEffect, useState } from "react";

// İşıqlı/qaranlıq rejim. Seçim brauzerdə yadda qalır; heç seçilməyibsə sistem ayarı tətbiq olunur (layout-dakı skript).
export function ThemeToggle({ labels, className = "" }: { labels: { light: string; dark: string }; className?: string }) {
  const [dark, setDark] = useState<boolean | null>(null);

  // İnkişaf rejimində React yenidən qoşulanda <html>-in sinfini təmizləyir: seçimi geri qaytarırıq
  // (produksiyada təsiri yoxdur) — next/docs: preventing-flash-before-hydration
  useLayoutEffect(() => {
    try {
      const saved = localStorage.getItem("theme");
      const isDark = saved ? saved === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.classList.toggle("dark", isDark);
    } catch {}
  }, []);

  useEffect(() => setDark(document.documentElement.classList.contains("dark")), []);

  function toggle() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {}
    setDark(next);
  }

  const label = dark ? labels.light : labels.dark;
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className={`grid h-9 w-9 place-items-center rounded-full text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white ${className}`}
    >
      {/* İlk renderdə ikon gizlidir: server temanı bilmir */}
      <span className={dark === null ? "opacity-0" : ""}>{dark ? <Sun size={17} strokeWidth={1.9} aria-hidden /> : <Moon size={17} strokeWidth={1.9} aria-hidden />}</span>
    </button>
  );
}
