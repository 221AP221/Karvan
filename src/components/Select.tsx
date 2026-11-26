"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

export type SelectOption = { value: string; label: string };

/**
 * Sistemin öz <select> siyahısı brauzer tərəfindən çəkilir və üslub qəbul etmir
 * (mavi seçim zolağı, sistem şrifti). Bu komponent onu öz siyahımızla əvəz edir;
 * dəyər gizli input-da qaldığı üçün adi formalarda eyni cür işləyir.
 */
export function Select({
  name,
  value,
  onChange,
  options,
  placeholder,
  required,
  className = "",
  ariaLabel,
  disabled,
  autoSubmit,
}: {
  name?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  required?: boolean;
  className?: string;
  ariaLabel?: string;
  disabled?: boolean;
  /** Seçildikdə öz formasını göndərir (filtr formaları üçün) */
  autoSubmit?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const listId = useId();

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  function pick(v: string) {
    onChange(v);
    setOpen(false);
    // Filtr formaları seçimdən sonra özü göndərilir
    if (autoSubmit) requestAnimationFrame(() => root.current?.closest("form")?.requestSubmit());
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") return setOpen(false);
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (open) pick(options[active]?.value ?? value);
      else setOpen(true);
      return;
    }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) return setOpen(true);
      setActive((i) => {
        const next = e.key === "ArrowDown" ? i + 1 : i - 1;
        return Math.max(0, Math.min(options.length - 1, next));
      });
    }
  }

  return (
    <div ref={root} className={`relative ${className}`}>
      {name && <input type="hidden" name={name} value={value} />}
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          setActive(Math.max(0, options.findIndex((o) => o.value === value)));
          setOpen((v) => !v);
        }}
        onKeyDown={onKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={ariaLabel}
        aria-required={required}
        className="flex h-10 w-full items-center justify-between gap-2 rounded-xl bg-white/55 px-3 text-left text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] outline-none backdrop-blur-xl transition hover:bg-white/80 dark:bg-white/10 dark:text-gray-100 dark:shadow-none dark:hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-[var(--brand)]/25 disabled:cursor-not-allowed disabled:text-gray-400 disabled:hover:bg-white/55"
      >
        <span className={`truncate ${selected ? "" : "text-gray-400"}`}>{selected?.label ?? placeholder ?? ""}</span>
        <ChevronDown size={15} className={`shrink-0 text-gray-400 transition ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>

      {open && !disabled && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-30 mt-1.5 max-h-72 w-full min-w-max overflow-auto rounded-xl border border-gray-100 bg-white p-1 shadow-xl shadow-black/10 dark:border-white/10 dark:bg-[#16171a]"
        >
          {options.map((o, i) => {
            const isSelected = o.value === value;
            return (
              <li key={o.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => pick(o.value)}
                  className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition ${
                    isSelected
                      ? "bg-[var(--brand)]/10 font-medium text-[var(--brand)]"
                      : i === active
                        ? "bg-gray-50 text-gray-800 dark:bg-white/10 dark:text-gray-100"
                        : "text-gray-700 dark:text-gray-300"
                  }`}
                >
                  <span className="truncate">{o.label}</span>
                  {isSelected && <Check size={14} className="shrink-0" aria-hidden />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/** Formada idarəsiz işlənən variant: dəyəri özü saxlayır, serverə gizli input ilə gedir. */
export function SelectInput({
  defaultValue = "",
  ...rest
}: Omit<Parameters<typeof Select>[0], "value" | "onChange"> & { defaultValue?: string }) {
  const [value, setValue] = useState(defaultValue);
  return <Select {...rest} value={value} onChange={setValue} />;
}
