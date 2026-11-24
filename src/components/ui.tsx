import Link from "next/link";
import type { ComponentProps } from "react";

export const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/20";

export const buttonClass =
  "inline-flex items-center justify-center rounded-full bg-[var(--brand)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60";

export const secondaryButtonClass =
  "inline-flex items-center justify-center rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-60";

export function Field({ label, hint, ...props }: ComponentProps<"input"> & { label: string; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>
      <input className={inputClass} {...props} />
      {hint && <span className="mt-1 block text-xs text-gray-500">{hint}</span>}
    </label>
  );
}

export function Card({ title, children, actions }: { title?: string; children: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5">
      {(title || actions) && (
        <div className="mb-4 flex items-center justify-between gap-2">
          {title && <h2 className="font-semibold">{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

// Səhifələmə: keçid düymələri solda, sayğac sağda; çərçivəsiz, yalnız mətn.
export function Pager({ page, pages, href }: { page: number; pages: number; href: (n: number) => string }) {
  if (pages <= 1) return null;
  return (
    <nav className="mt-4 flex items-center justify-between gap-3 text-sm" aria-label="Səhifələr">
      <span className="flex items-center gap-4">
        {page > 1 && (
          <Link href={href(page - 1)} className="font-medium text-[var(--brand)] transition hover:opacity-70">
            Əvvəlki
          </Link>
        )}
        {page < pages && (
          <Link href={href(page + 1)} className="font-medium text-[var(--brand)] transition hover:opacity-70">
            Növbəti
          </Link>
        )}
      </span>
      <span className="tabular-nums text-gray-500">
        {page} / {pages}
      </span>
    </nav>
  );
}

// searchParams-dan yeni URL (səhifə nömrəsi dəyişəndə filtrlər qalsın)
export function hrefWith(path: string, sp: Record<string, string | string[] | undefined>, changes: Record<string, string | null>) {
  const next = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) if (typeof v === "string" && v) next.set(k, v);
  for (const [k, v] of Object.entries(changes)) {
    if (v) next.set(k, v);
    else next.delete(k);
  }
  return `${path}${next.size ? `?${next}` : ""}`;
}
