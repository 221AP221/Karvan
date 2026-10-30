// Məbləğlər qəpik/sentlə tam ədəd kimi saxlanılır: 15,50 AZN = 1550.
// Intl istifadə etmirik: Node və brauzerin ICU məlumatları fərqli nəticə verib hydration xətası yaradır.

export const CURRENCIES = [
  { code: "AZN", label: "₼ AZN", name: "Manat" },
  { code: "USD", label: "$ USD", name: "Dollar" },
  { code: "EUR", label: "€ EUR", name: "Avro" },
] as const;

export type Currency = (typeof CURRENCIES)[number]["code"];

export const isCurrency = (value: unknown): value is Currency => CURRENCIES.some((c) => c.code === value);

export function formatMoney(minor: number, currency: string = "AZN"): string {
  const sign = minor < 0 ? "-" : "";
  const abs = Math.abs(Math.round(minor));
  const major = Math.floor(abs / 100)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${sign}${major},${String(abs % 100).padStart(2, "0")} ${currency}`;
}

export const formatAzn = (qepik: number) => formatMoney(qepik, "AZN");

export function aznToQepik(azn: number): number {
  return Math.round(azn * 100);
}

// Fərqli valyutalarda olan məbləğləri toplamaq olmaz: valyuta üzrə ayrıca göstəririk
export function formatTotals(rows: { currency: string; _sum: { totalQepik: number | null } }[]): string {
  const parts = rows.filter((r) => r._sum.totalQepik).map((r) => formatMoney(r._sum.totalQepik!, r.currency));
  return parts.length ? parts.join(" + ") : formatMoney(0, "AZN");
}
