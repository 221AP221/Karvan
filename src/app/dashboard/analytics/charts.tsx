"use client";

import { useState } from "react";

export type BarDatum = { label: string; value: number; display: string };

// Tək seriyalı sütun qrafiki: üzərinə gəldikdə (və ya Tab ilə) dəyər göstərilir
export function BarChart({ data, ariaLabel, top, ticks }: { data: BarDatum[]; ariaLabel: string; top: number; ticks: [string, string, string] }) {
  const [active, setActive] = useState<number | null>(null);
  const shown = active !== null ? data[active] : null;
  const labelIdx = new Set([0, Math.floor((data.length - 1) / 2), data.length - 1]);

  return (
    <figure aria-label={ariaLabel} className="select-none">
      <div className="relative flex h-44 gap-2">
        {/* Y oxu */}
        <div className="flex w-12 shrink-0 flex-col justify-between whitespace-nowrap text-right text-[11px] tabular-nums text-gray-400" aria-hidden>
          {ticks.map((t, i) => (
            <span key={i} className="-translate-y-1/2 first:translate-y-0 last:translate-y-0">
              {t}
            </span>
          ))}
        </div>
        <div className="relative flex-1" onPointerLeave={() => setActive(null)}>
          {/* Şəbəkə xətləri */}
          <div className="pointer-events-none absolute inset-0 flex flex-col justify-between" aria-hidden>
            <span className="border-t border-dashed border-gray-200" />
            <span className="border-t border-dashed border-gray-200" />
            <span className="border-t border-gray-300" />
          </div>
          <div className="absolute inset-0 flex items-end gap-[2px]">
            {data.map((d, i) => (
              <button
                key={d.label}
                type="button"
                tabIndex={0}
                aria-label={`${d.label}: ${d.display}`}
                onPointerEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                className="group relative flex h-full flex-1 items-end outline-none"
              >
                <span
                  className={`block w-full rounded-t-[4px] bg-[var(--brand)] transition-opacity ${active === null || active === i ? "opacity-100" : "opacity-40"}`}
                  style={{ height: `${d.value ? Math.max(2, (d.value / top) * 100) : 0}%` }}
                />
              </button>
            ))}
          </div>
          {shown && active !== null && (
            <div
              role="status"
              className="pointer-events-none absolute -top-2 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg bg-gray-900 px-2.5 py-1.5 text-xs text-white shadow-lg"
              style={{ left: `${Math.min(88, Math.max(12, ((active + 0.5) / data.length) * 100))}%` }}
            >
              <strong className="block text-sm tabular-nums">{shown.display}</strong>
              <span className="text-white/70">{shown.label}</span>
            </div>
          )}
        </div>
      </div>
      {/* X oxu: ilk, orta və son */}
      <div className="ml-14 mt-2 flex text-[11px] text-gray-400" aria-hidden>
        {data.map((d, i) => (
          <span key={d.label} className={`flex flex-1 ${i === 0 ? "justify-start" : i === data.length - 1 ? "justify-end" : "justify-center"}`}>
            {labelIdx.has(i) ? <span className="whitespace-nowrap">{d.label.split(" – ")[0]}</span> : null}
          </span>
        ))}
      </div>
    </figure>
  );
}
