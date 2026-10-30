"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";

const NAV = [
  { href: "#nece-isleyir", label: "Necə işləyir" },
  { href: "#xususiyyetler", label: "Xüsusiyyətlər" },
  { href: "#ai", label: "AI" },
  { href: "#qiymetler", label: "Qiymətlər" },
  { href: "#suallar", label: "Suallar" },
];

export function Logo() {
  const gradient = useId();
  return (
    <span className="flex items-center gap-2.5 font-display text-[17px] font-bold tracking-tight">
      <svg viewBox="0 0 32 32" className="h-8 w-8 drop-shadow-[0_4px_10px_rgba(124,58,237,0.35)]" aria-hidden>
        <defs>
          <linearGradient id={gradient} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#7c3aed" />
            <stop offset="1" stopColor="#db2777" />
          </linearGradient>
        </defs>
        <rect width="32" height="32" rx="9" fill={`url(#${gradient})`} />
        {/* Qatlanmış küncü olan faktura vərəqi */}
        <path d="M10 8.5h8.5l4 4V23a1.5 1.5 0 0 1-1.5 1.5H10A1.5 1.5 0 0 1 8.5 23V10A1.5 1.5 0 0 1 10 8.5Z" fill="white" />
        <path d="M18.5 8.5v4h4" fill="#f5d0fe" />
        <rect x="11.5" y="15" width="8" height="1.6" rx="0.8" fill="#c4b5fd" />
        <rect x="11.5" y="18.5" width="5" height="1.6" rx="0.8" fill="#c4b5fd" />
      </svg>
      <span>
        Bio<span className="text-violet-600">Faktura</span>
      </span>
    </span>
  );
}

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled || open ? "border-b border-gray-200/70 bg-white/80 shadow-sm backdrop-blur-lg" : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" aria-label="BioFaktura ana səhifə">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-1 text-sm text-gray-600 md:flex">
          {NAV.map((item) => (
            <a key={item.href} href={item.href} className="rounded-full px-3 py-2 transition hover:bg-gray-100 hover:text-gray-900">
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link href="/login" className="rounded-full px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100">
            Daxil ol
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-gray-900/10 transition hover:-translate-y-0.5 hover:bg-gray-800"
          >
            Pulsuz başla
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="grid h-10 w-10 place-items-center rounded-full hover:bg-gray-100 md:hidden"
          aria-label={open ? "Menyunu bağla" : "Menyunu aç"}
          aria-expanded={open}
        >
          <span className="relative block h-3 w-5">
            <span className={`absolute left-0 h-0.5 w-5 bg-gray-900 transition ${open ? "top-1.5 rotate-45" : "top-0"}`} />
            <span className={`absolute left-0 top-1.5 h-0.5 w-5 bg-gray-900 transition ${open ? "opacity-0" : ""}`} />
            <span className={`absolute left-0 h-0.5 w-5 bg-gray-900 transition ${open ? "top-1.5 -rotate-45" : "top-3"}`} />
          </span>
        </button>
      </div>

      <div className={`grid overflow-hidden transition-all duration-300 md:hidden ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <nav className="min-h-0">
          <div className="flex flex-col gap-1 px-4 pb-4">
            {NAV.map((item) => (
              <a key={item.href} href={item.href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 text-gray-700 hover:bg-gray-100">
                {item.label}
              </a>
            ))}
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Link href="/login" className="rounded-full border border-gray-300 py-2.5 text-center text-sm font-medium">
                Daxil ol
              </Link>
              <Link href="/signup" className="rounded-full bg-gray-900 py-2.5 text-center text-sm font-medium text-white">
                Pulsuz başla
              </Link>
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
}
