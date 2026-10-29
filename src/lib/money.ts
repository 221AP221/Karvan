// Məbləğlər qəpiklə tam ədəd kimi saxlanılır: 15,50 AZN = 1550.
// Intl istifadə etmirik: Node və brauzerin ICU məlumatları fərqli nəticə verib hydration xətası yaradır.
export function formatAzn(qepik: number): string {
  const sign = qepik < 0 ? "-" : "";
  const abs = Math.abs(Math.round(qepik));
  const manat = Math.floor(abs / 100)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${sign}${manat},${String(abs % 100).padStart(2, "0")} AZN`;
}

export function aznToQepik(azn: number): number {
  return Math.round(azn * 100);
}
