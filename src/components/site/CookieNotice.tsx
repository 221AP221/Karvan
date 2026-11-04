"use client";

import { Cookie } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const KEY = "cookie-notice";

// Bildiriş yalnız ictimai səhifələrdə göstərilir: panel və giriş ekranlarında işi kəsir
const HIDDEN = ["/dashboard", "/admin", "/login", "/signup", "/forgot-password", "/reset-password", "/pay"];

/**
 * Cookie bildirişi (BRD §23.3, NFR-PRV-04). Analitika qeydi anonimdir, ona görə
 * bildiriş məlumatlandırıcıdır: istifadəçi "Anladım" deyəndə bir daha göstərilmir.
 */
export function CookieNotice({ text, accept, more, href }: { text: string; accept: string; more: string; href: string }) {
  const [show, setShow] = useState(false);
  const pathname = usePathname();
  const hidden = HIDDEN.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setShow(true);
    } catch {
      // brauzer yaddaşı bağlıdırsa bildiriş göstərilmir
    }
  }, []);

  if (!show || hidden) return null;

  const close = () => {
    try {
      localStorage.setItem(KEY, new Date().toISOString());
    } catch {
      // yaddaş yazıla bilmirsə yalnız bu səhifə üçün bağlanır
    }
    setShow(false);
  };

  return (
    <div role="region" aria-label="Cookie bildirişi" className="fixed inset-x-0 bottom-0 z-50 px-3 pb-3 sm:px-4 sm:pb-4">
      <div className="mx-auto flex max-w-3xl flex-col gap-3 rounded-2xl border border-gray-200 bg-white/95 p-4 shadow-xl shadow-black/10 backdrop-blur sm:flex-row sm:items-center dark:border-white/10 dark:bg-[#15161a]/95">
        <Cookie size={20} className="shrink-0 text-[var(--brand)]" aria-hidden />
        <p className="flex-1 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
          {text}{" "}
          <Link href={href} className="font-medium text-gray-900 underline dark:text-white">
            {more}
          </Link>
        </p>
        <button
          type="button"
          onClick={close}
          className="shrink-0 rounded-full bg-[var(--brand)] px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90"
        >
          {accept}
        </button>
      </div>
    </div>
  );
}
