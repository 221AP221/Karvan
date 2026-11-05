"use client";

import { ChevronDown, LoaderCircle, Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

export type FilterField =
  | { type: "search"; name: string; placeholder: string }
  | { type: "select"; name: string; label: string; options: { value: string; label: string }[] }
  | { type: "date"; name: string; label: string };

const control =
  "h-10 rounded-xl border border-gray-200 bg-white text-sm outline-none transition focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/15";

// Filtrlər URL-də saxlanılır: səhifə yenilənəndə və ya link paylaşılanda itmir.
// `labels` verilməyəndə Azərbaycan dili işlədilir (admin panel hələ AZ-dir)
export function FilterBar({
  fields,
  total,
  labels = { all: "hamısı", results: "{n} nəticə" },
}: {
  fields: FilterField[];
  total: number;
  labels?: { all: string; results: string };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const search = fields.find((f) => f.type === "search");
  const [query, setQuery] = useState(search ? (params.get(search.name) ?? "") : "");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  function apply(name: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(name, value);
    else next.delete(name);
    startTransition(() => router.replace(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false }));
  }

  useEffect(() => () => clearTimeout(timer.current), []);

  const active = fields.some((f) => params.get(f.name));

  return (
    <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-3">
      {search && (
        <label className="relative block">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              clearTimeout(timer.current);
              const value = e.target.value.trim();
              timer.current = setTimeout(() => apply(search.name, value), 300);
            }}
            placeholder={search.placeholder}
            aria-label={search.placeholder}
            className={`${control} w-full pl-9 pr-3`}
          />
        </label>
      )}
      <div className="flex flex-wrap items-center gap-2">
        {fields.map((f) =>
          f.type === "select" ? (
            <label key={f.name} className="relative">
              <span className="sr-only">{f.label}</span>
              <select value={params.get(f.name) ?? ""} onChange={(e) => apply(f.name, e.target.value)} className={`${control} appearance-none pl-3 pr-9`}>
                <option value="">{f.label}: {labels.all}</option>
                {f.options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden />
            </label>
          ) : f.type === "date" ? (
            <label key={f.name} className="flex items-center gap-2 text-sm text-gray-500">
              {f.label}
              <input type="date" value={params.get(f.name) ?? ""} onChange={(e) => apply(f.name, e.target.value)} className={`${control} px-3 text-gray-700`} />
            </label>
          ) : null,
        )}
        {active && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              startTransition(() => router.replace(pathname, { scroll: false }));
            }}
            className="inline-flex h-10 items-center gap-1 rounded-xl px-3 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900"
          >
            <X size={15} aria-hidden /> Təmizlə
          </button>
        )}
        <span className="ml-auto inline-flex h-10 items-center gap-2 px-2 text-sm text-gray-400">
          {pending && <LoaderCircle size={15} className="animate-spin" aria-hidden />}
          {labels.results.replace("{n}", String(total))}
        </span>
      </div>
    </div>
  );
}
