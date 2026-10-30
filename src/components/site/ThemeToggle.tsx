"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

// İşıqlı/qaranlıq rejim. Seçim brauzerdə yadda qalır; heç seçilməyibsə sistem ayarı tətbiq olunur (layout-dakı skript).
export function ThemeToggle({ labels, className = "" }: { labels: { light: string; dark: string }; className?: string }) {
  const [dark, setDark] = useState<boolean | null>(null);

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
