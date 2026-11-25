"use client";

import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";

/** Formada idarəsiz işlənən variant: dəyəri özü saxlayır, serverə gizli input ilə gedir. */
export function DateFieldInput(props: Omit<Parameters<typeof DateField>[0], "value" | "onChange"> & { defaultValue?: string }) {
  const { defaultValue = "", ...rest } = props;
  const [value, setValue] = useState(defaultValue);
  return <DateField {...rest} value={value} onChange={setValue} />;
}

const WEEKDAYS = ["B.e", "Ç.a", "Ç", "C.a", "C", "Ş", "B"];
const MONTHS = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "İyun", "İyul", "Avqust", "Sentyabr", "Oktyabr", "Noyabr", "Dekabr"];

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const parse = (v: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
};
const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/**
 * Sistemin öz tarix seçicisi (input type="date") brauzerin çəkdiyi pəncərədir və
 * üslub qəbul etmir. Bu komponent onu panelin təqvimi ilə eyni görünüşlü
 * popover ilə əvəz edir; dəyər gizli input-da ISO formatında qalır.
 */
export function DateField({
  name,
  value,
  onChange,
  min,
  placeholder = "gg.aa.yyyy",
  required,
  className = "",
  ariaLabel,
}: {
  name?: string;
  value: string;
  onChange: (value: string) => void;
  min?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
  ariaLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = parse(value);
  const [view, setView] = useState(() => selected ?? new Date());
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const today = new Date();
  const minDate = min ? parse(min) : null;
  const daysInMonth = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
  const offset = (new Date(view.getFullYear(), view.getMonth(), 1).getDay() + 6) % 7;

  function pick(day: number) {
    const picked = new Date(view.getFullYear(), view.getMonth(), day);
    onChange(iso(picked));
    setOpen(false);
  }

  return (
    <div ref={root} className={`relative ${className}`}>
      {name && <input type="hidden" name={name} value={value} />}
      <button
        type="button"
        onClick={() => {
          setView(selected ?? new Date());
          setOpen((v) => !v);
        }}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={ariaLabel}
        aria-required={required}
        className="flex h-10 w-full items-center justify-between gap-2 rounded-xl bg-white/55 px-3 text-left text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] outline-none backdrop-blur-xl transition hover:bg-white/80 dark:bg-white/10 dark:text-gray-100 dark:shadow-none dark:hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-[var(--brand)]/25"
      >
        <span className={selected ? "" : "text-gray-400"}>
          {selected ? selected.toLocaleDateString("az-AZ", { day: "2-digit", month: "2-digit", year: "numeric" }) : placeholder}
        </span>
        <CalendarDays size={15} className="shrink-0 text-gray-400" aria-hidden />
      </button>

      {open && (
        <div role="dialog" className="absolute z-30 mt-1.5 w-[17rem] rounded-2xl border border-gray-100 bg-white p-3 shadow-xl shadow-black/10 dark:border-white/10 dark:bg-[#16171a]">
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))}
              className="grid h-7 w-7 place-items-center rounded-lg text-gray-500 transition hover:bg-gray-100"
              aria-label="Əvvəlki ay"
            >
              <ChevronLeft size={16} aria-hidden />
            </button>
            <span className="text-sm font-semibold">
              {MONTHS[view.getMonth()]} {view.getFullYear()}
            </span>
            <button
              type="button"
              onClick={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))}
              className="grid h-7 w-7 place-items-center rounded-lg text-gray-500 transition hover:bg-gray-100"
              aria-label="Növbəti ay"
            >
              <ChevronRight size={16} aria-hidden />
            </button>
          </div>

          <div className="grid grid-cols-7 text-center text-[11px] font-medium text-gray-400">
            {WEEKDAYS.map((w) => (
              <span key={w} className="py-1">
                {w}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {Array.from({ length: offset }, (_, i) => (
              <span key={`pad-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const date = new Date(view.getFullYear(), view.getMonth(), day);
              const disabled = minDate ? date < minDate : false;
              const isSelected = selected ? sameDay(date, selected) : false;
              return (
                <button
                  key={day}
                  type="button"
                  disabled={disabled}
                  onClick={() => pick(day)}
                  className={`grid h-8 place-items-center rounded-lg text-sm transition ${
                    isSelected
                      ? "bg-[var(--brand)] font-semibold text-white"
                      : disabled
                        ? "text-gray-300"
                        : "text-gray-700 hover:bg-[var(--brand)]/10 hover:text-[var(--brand)] dark:text-gray-300"
                  } ${!isSelected && sameDay(date, today) ? "ring-1 ring-gray-300" : ""}`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          <div className="mt-2 flex items-center justify-between border-t border-gray-100 pt-2 text-sm">
            <button
              type="button"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
              className="font-medium text-gray-500 transition hover:text-gray-800"
            >
              Təmizlə
            </button>
            <button
              type="button"
              onClick={() => {
                onChange(iso(today));
                setOpen(false);
              }}
              className="font-medium text-[var(--brand)] transition hover:opacity-70"
            >
              Bu gün
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
