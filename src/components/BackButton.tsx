"use client";

import { ArrowLeft } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

// Bu tabda sayt daxilində neçə səhifə açılıb (document.referrer SPA keçidlərində dəyişmir)
let visited = 0;

export function NavigationTracker() {
  const pathname = usePathname();
  useEffect(() => {
    visited++;
  }, [pathname]);
  return null;
}

// Əvvəlki səhifəyə qayıdır; sayt daxilində əvvəlki səhifə yoxdursa (link birbaşa açılıbsa) bir üst bölməyə keçir.
export function BackButton({ fallback, hideOn = [], className = "", label = "Geri" }: { fallback?: string; hideOn?: string[]; className?: string; label?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  if (hideOn.includes(pathname)) return null;
  const parent = fallback ?? (pathname.split("/").slice(0, -1).join("/") || "/");

  return (
    <button
      type="button"
      onClick={() => (visited > 1 ? router.back() : router.push(parent))}
      className={`group inline-flex items-center gap-1.5 rounded-full py-1.5 pl-2 pr-3 text-sm font-medium text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 ${className}`}
    >
      <ArrowLeft size={16} strokeWidth={2} className="transition-transform group-hover:-translate-x-0.5" aria-hidden />
      {label}
    </button>
  );
}
