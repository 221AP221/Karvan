"use client";

import { useState } from "react";

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
    <span className={`flex items-stretch overflow-hidden transition ${TONES[tone]}`}>
      <select
        value={shown.country.code + shown.country.name}
        onChange={(e) => update(COUNTRIES.find((c) => c.code + c.name === e.target.value) ?? COUNTRIES[0], shown.local)}
        aria-label="Ölkə kodu"
        className="shrink-0 cursor-pointer border-r border-gray-200 bg-transparent pl-3 pr-1 font-medium text-gray-700 outline-none dark:border-white/10 dark:text-gray-200"
      >
        {COUNTRIES.map((c) => (
          <option key={c.code + c.name} value={c.code + c.name}>
            {c.flag} {c.code}
          </option>
        ))}
      </select>
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
