// Məbləğlər qəpiklə tam ədəd kimi saxlanılır: 15,50 AZN = 1550.
export function formatAzn(qepik: number): string {
  return (
    new Intl.NumberFormat("az-AZ", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(qepik / 100) + " AZN"
  );
}

export function aznToQepik(azn: number): number {
  return Math.round(azn * 100);
}
