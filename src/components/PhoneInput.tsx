"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

// Ölkə prefiksi seçilən telefon sahəsi. Forma tam beynəlxalq nömrəni (+994501234567) gizli sahədə göndərir.
export const COUNTRIES = [
  { code: "+994", flag: "🇦🇿", name: "Azərbaycan", digits: 9, mask: [2, 3, 2, 2], placeholder: "50 123 45 67" },
  { code: "+90", flag: "🇹🇷", name: "Türkiyə", digits: 10, mask: [3, 3, 2, 2], placeholder: "532 123 45 67" },
  { code: "+995", flag: "🇬🇪", name: "Gürcüstan", digits: 9, mask: [3, 2, 2, 2], placeholder: "555 12 34 56" },
  { code: "+7", flag: "🇷🇺", name: "Rusiya / Qazaxıstan", digits: 10, mask: [3, 3, 2, 2], placeholder: "912 345 67 89" },
  { code: "+998", flag: "🇺🇿", name: "Özbəkistan", digits: 9, mask: [2, 3, 2, 2], placeholder: "90 123 45 67" },
  { code: "+380", flag: "🇺🇦", name: "Ukrayna", digits: 9, mask: [2, 3, 2, 2], placeholder: "50 123 45 67" },
  { code: "+49", flag: "🇩🇪", name: "Almaniya", digits: 11, mask: [3, 4, 4], placeholder: "151 2345 6789" },
  { code: "+1", flag: "🇺🇸", name: "ABŞ / Kanada", digits: 10, mask: [3, 3, 4], placeholder: "201 555 0123" },
] as const;

type Country = (typeof COUNTRIES)[number];

// "+994501234567", "0501234567", "994 50 ..." → ölkə + yerli rəqəmlər
export function splitPhone(value: string | null | undefined): { country: Country; local: string } {
  const raw = (value ?? "").replace(/[^\d+]/g, "");
  if (/^0\d{9}$/.test(raw)) return { country: COUNTRIES[0], local: raw.slice(1) };
  const withPlus = raw.startsWith("+") ? raw : raw.length > 9 ? `+${raw}` : raw;
  const match = [...COUNTRIES].sort((a, b) => b.code.length - a.code.length).find((c) => withPlus.startsWith(c.code));
  if (match) return { country: match, local: withPlus.slice(match.code.length) };
  return { country: COUNTRIES[0], local: raw.replace(/\D/g, "") };
}

function format(local: string, mask: readonly number[]) {
  const parts: string[] = [];
  let i = 0;
  for (const n of mask) {
    if (i >= local.length) break;
    parts.push(local.slice(i, i + n));
    i += n;
  }
  return parts.join(" ");
}

const TONES = {
  auth: "h-12 rounded-xl border border-gray-200 bg-white text-[15px] dark:border-white/10 dark:bg-white/[0.04] dark:text-gray-100 focus-within:border-violet-500 focus-within:ring-4 focus-within:ring-violet-500/10",
  panel: "h-10 rounded-lg border border-gray-300 bg-white text-sm focus-within:border-[var(--brand)] focus-within:ring-2 focus-within:ring-[var(--brand)]/20",
};

export function PhoneInput({
  name,
  defaultValue,
  value,
  onChange,
  required,
  tone = "panel",
  label = "Telefon nömrəsi",
}: {
  name: string;
  defaultValue?: string | null;
  value?: string;
  onChange?: (full: string) => void;
  required?: boolean;
  tone?: keyof typeof TONES;
  label?: string;
}) {
  const initial = splitPhone(value ?? defaultValue);
  const [country, setCountry] = useState<Country>(initial.country);
  const [local, setLocal] = useState(initial.local);
  // İdarə olunan rejim (məs. AI fakturanı doldurur): xaricdən gələn dəyər göstərilir
  const shown = value !== undefined ? splitPhone(value) : { country, local };
  const full = shown.local ? `${shown.country.code}${shown.local}` : "";

  function update(nextCountry: Country, nextLocal: string) {
    // Tam nömrə yapışdırılıbsa (+994 50 ..., 994..., 050 ...), ölkə kodu avtomatik tanınır
    const onlyDigits = nextLocal.replace(/\D/g, "");
    if (nextLocal.trim().startsWith("+") || (onlyDigits.length > nextCountry.digits && onlyDigits.startsWith(nextCountry.code.slice(1)))) {
      const parsed = splitPhone(nextLocal.trim().startsWith("+") ? nextLocal : `+${onlyDigits}`);
      nextCountry = parsed.country;
      nextLocal = parsed.local;
    }
    const digits = nextLocal.replace(/\D/g, "").replace(/^0+/, "").slice(0, nextCountry.digits);
    setCountry(nextCountry);
    setLocal(digits);
    onChange?.(digits ? `${nextCountry.code}${digits}` : "");
  }

  return (
    <span className={`flex items-stretch transition ${TONES[tone]}`}>
      <CountryPicker
        value={shown.country}
        onChange={(c) => update(c, shown.local)}
        tone={tone}
      />
      <input
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        aria-label={label}
        required={required}
        value={format(shown.local, shown.country.mask)}
        onChange={(e) => update(shown.country, e.target.value)}
        placeholder={shown.country.placeholder}
        pattern={`[0-9 ]{${shown.country.digits + shown.country.mask.length - 1}}`}
        title={`${shown.country.digits} rəqəm`}
        className="min-w-0 flex-1 bg-transparent px-3 tabular-nums outline-none placeholder:text-gray-400"
      />
      <input type="hidden" name={name} value={full} />
    </span>
  );
}

/**
 * Ölkə kodu seçicisi. Brauzerin öz <select> siyahısı OS tərəfindən çəkilir və
 * appin dizaynını qəbul etmir, ona görə siyahını özümüz çəkirik.
 */
function CountryPicker({ value, onChange, tone }: { value: Country; onChange: (c: Country) => void; tone: keyof typeof TONES }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLSpanElement>(null);

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

  return (
    <span ref={root} className="relative flex shrink-0 items-stretch">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Ölkə kodu"
        className={`flex items-center gap-1.5 rounded-l-[inherit] border-r pl-3 pr-2 font-medium outline-none transition ${
          tone === "auth"
            ? "border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/5"
            : "border-gray-200 text-gray-700 hover:bg-gray-50"
        }`}
      >
        <span aria-hidden>{value.flag}</span>
        <span className="tabular-nums">{value.code}</span>
        <ChevronDown size={14} className={`text-gray-400 transition ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute left-0 top-full z-30 mt-1.5 max-h-72 w-60 overflow-auto rounded-xl border border-gray-100 bg-white p-1 shadow-xl shadow-black/10 dark:border-white/10 dark:bg-[#16171a]"
        >
          {COUNTRIES.map((c) => {
            const isSelected = c.code === value.code && c.name === value.name;
            return (
              <li key={c.code + c.name}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(c);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition ${
                    isSelected
                      ? "bg-[var(--brand)]/10 font-medium text-[var(--brand)]"
                      : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/10"
                  }`}
                >
                  <span aria-hidden>{c.flag}</span>
                  <span className="min-w-0 flex-1 truncate">{c.name}</span>
                  <span className="shrink-0 tabular-nums text-gray-400">{c.code}</span>
                  {isSelected && <Check size={14} className="shrink-0" aria-hidden />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </span>
  );
}
