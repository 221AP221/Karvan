import Link from "next/link";

export type DayLoad = { day: number; orders: number; full: boolean };

const WEEKDAYS = ["B.e", "Ç.a", "Ç", "C.a", "C", "Ş", "B"];

/**
 * Aylıq təqvim: hansı gün boş, hansında sifariş var, hansı doludur (FR-REZ-09).
 * Günə klikləndikdə sifarişlər həmin tarixə süzülür.
 */
export function MonthCalendar({ year, month, load, today }: { year: number; month: number; load: DayLoad[]; today: Date }) {
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // Bazar ertəsi ilk sütun olsun: JS-də bazar 0-dır
  const offset = (first.getDay() + 6) % 7;
  const byDay = new Map(load.map((d) => [d.day, d]));
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
  const monthName = first.toLocaleDateString("az-AZ", { month: "long", year: "numeric" });
  const iso = (day: number) => `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h2 className="font-semibold capitalize">{monthName}</h2>
        <span className="text-xs text-gray-500">{load.reduce((sum, d) => sum + d.orders, 0)} sifariş</span>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-gray-400">
        {WEEKDAYS.map((w) => (
          <span key={w} className="py-1">
            {w}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: offset }, (_, i) => (
          <span key={`pad-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const entry = byDay.get(day);
          const isToday = isCurrentMonth && today.getDate() === day;
          // Boş gün sakit qalır; sifarişli gün markalanır; dolu gün ayrıca rənglə
          const tone = entry?.full
            ? "bg-[var(--brand)] text-white hover:opacity-90"
            : entry
              ? "bg-[var(--brand)]/10 text-[var(--brand)] hover:bg-[var(--brand)]/20"
              : "text-gray-600 hover:bg-gray-100";
          return (
            <Link
              key={day}
              href={`/dashboard/orders?from=${iso(day)}&to=${iso(day)}`}
              className={`relative grid h-9 place-items-center rounded-lg text-sm transition ${tone} ${isToday ? "ring-2 ring-gray-900 ring-offset-1" : ""}`}
              title={entry ? `${entry.orders} sifariş` : "Boşdur"}
            >
              {day}
              {entry && !entry.full && <span className="absolute bottom-1 h-1 w-1 rounded-full bg-[var(--brand)]" aria-hidden />}
            </Link>
          );
        })}
      </div>

      <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
        <li className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-gray-100" aria-hidden /> Boş
        </li>
        <li className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-[var(--brand)]/20" aria-hidden /> Sifariş var
        </li>
        <li className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-[var(--brand)]" aria-hidden /> Dolu
        </li>
      </ul>
    </section>
  );
}
