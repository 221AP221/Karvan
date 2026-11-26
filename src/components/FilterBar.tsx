"use client";

import { LoaderCircle, Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { DateField } from "@/components/DateField";
import { Select } from "@/components/Select";

export type FilterField =
  | { type: "search"; name: string; placeholder: string }
  | { type: "select"; name: string; label: string; options: { value: string; label: string }[] }
  | { type: "date"; name: string; label: string };

// "Maye şüşə": sərhəd yox, yarımşəffaf fon və blur; fokusda yalnız incə parıltı
const control =
  "h-10 rounded-xl border-0 bg-white/55 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] outline-none backdrop-blur-xl transition hover:bg-white/75 focus:bg-white/85 focus:ring-2 focus:ring-[var(--brand)]/20";

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
    <div className="mb-5 flex flex-col gap-3 rounded-2xl bg-gradient-to-b from-white/70 to-white/40 p-3 shadow-[0_1px_0_0_rgba(255,255,255,0.7)_inset,0_10px_30px_-18px_rgba(17,24,39,0.35)] backdrop-blur-xl">
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
            <Select
              key={f.name}
              className="w-auto min-w-[9rem]"
              ariaLabel={f.label}
              value={params.get(f.name) ?? ""}
              onChange={(v) => apply(f.name, v)}
              options={[{ value: "", label: `${f.label}: ${labels.all}` }, ...f.options]}
            />
          ) : f.type === "date" ? (
            <label key={f.name} className="flex items-center gap-2 text-sm text-gray-500">
              {f.label}
              <DateField className="w-[10.5rem]" ariaLabel={f.label} value={params.get(f.name) ?? ""} onChange={(v) => apply(f.name, v)} />
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
