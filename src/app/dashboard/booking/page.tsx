import { CalendarOff } from "lucide-react";
import { ActionForm } from "@/components/ActionForm";
import { DateFieldInput } from "@/components/DateField";
import { Card, inputClass } from "@/components/ui";
import { requirePageAccess } from "@/lib/auth";
import { parseWorkDays } from "@/lib/booking";
import { db } from "@/lib/db";
import { BookingSettings } from "./BookingSettings";
import { blockSlot, unblockSlot } from "./actions";

const dateTime = (d: Date) =>
  d.toLocaleString("az-AZ", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

export default async function BookingPage() {
  const profile = await requirePageAccess("services");
  const [blocks, withoutDuration] = await Promise.all([
    db.blockedSlot.findMany({ where: { profileId: profile.id, end: { gte: new Date() } }, orderBy: { start: "asc" }, take: 20 }),
    db.service.count({ where: { profileId: profile.id, isActive: true, durationMin: null } }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Rezervasiya</h1>
        <p className="text-sm text-gray-500">İş saatlarınızı təyin edin — müştəri yalnız boş saatları görsün.</p>
      </div>

      <BookingSettings
        values={{
          bookingEnabled: profile.bookingEnabled,
          bufferMin: profile.bufferMin,
          travelBufferMin: profile.travelBufferMin,
          workDays: parseWorkDays(profile.workDays),
          workStart: profile.workStart,
          workEnd: profile.workEnd,
        }}
      />

      {profile.bookingEnabled && withoutDuration > 0 && (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          {withoutDuration} aktiv xidmətdə seans müddəti yazılmayıb — onlar üçün 60 dəqiqə sayılır. Xidmətin səhifəsindən dəqiqləşdirə bilərsiniz.
        </p>
      )}

      <Card title="Bağlı vaxtlar">
        <p className="mb-4 text-sm text-gray-500">Məzuniyyət, şəxsi iş və ya dolu gün — bu aralıqlarda müştəri slot görməyəcək.</p>
        <ActionForm action={blockSlot} submitLabel="Vaxtı bağla" successMessage="Bağlandı" resetOnSuccess>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto_1.2fr]">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-gray-600">Tarix</span>
              <DateFieldInput name="day" required ariaLabel="Tarix" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-gray-600">Başlama</span>
              <input name="start" type="time" defaultValue="09:00" className={inputClass} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-gray-600">Bitmə</span>
              <input name="end" type="time" defaultValue="18:00" className={inputClass} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-gray-600">Qeyd</span>
              <input name="note" maxLength={120} placeholder="Məs: həkim" className={inputClass} />
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" name="allDay" className="h-4 w-4 accent-[var(--brand)]" />
            Bütün günü bağla
          </label>
        </ActionForm>

        {blocks.length > 0 && (
          <ul className="mt-5 divide-y divide-gray-100 border-t border-gray-100">
            {blocks.map((b) => (
              <li key={b.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <span className="flex min-w-0 items-center gap-2">
                  <CalendarOff size={16} className="shrink-0 text-gray-400" aria-hidden />
                  <span className="truncate">
                    {dateTime(b.start)} — {dateTime(b.end)}
                    {b.note && <span className="text-gray-500"> · {b.note}</span>}
                  </span>
                </span>
                <form action={unblockSlot.bind(null, b.id)}>
                  <button className="rounded-full px-3 py-1 text-xs text-red-600 transition hover:bg-red-50">Aç</button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
