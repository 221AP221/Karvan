"use client";

import { useState } from "react";
import { ActionForm } from "@/components/ActionForm";
import { Card, inputClass } from "@/components/ui";
import { saveBookingSettings } from "./actions";

const DAYS = [
  { value: 1, label: "B.e" },
  { value: 2, label: "Ç.a" },
  { value: 3, label: "Ç" },
  { value: 4, label: "C.a" },
  { value: 5, label: "C" },
  { value: 6, label: "Ş" },
  { value: 7, label: "B" },
];

export type BookingValues = {
  bookingEnabled: boolean;
  bufferMin: number;
  travelBufferMin: number;
  workDays: number[];
  workStart: string;
  workEnd: string;
};

export function BookingSettings({ values }: { values: BookingValues }) {
  const [enabled, setEnabled] = useState(values.bookingEnabled);

  return (
    <ActionForm action={saveBookingSettings} submitLabel="Yadda saxla" successMessage="Yadda saxlanıldı">
      <Card title="Rezervasiya">
        <label className="flex items-start gap-3">
          <input type="checkbox" name="bookingEnabled" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[var(--brand)]" />
          <span>
            <span className="block text-sm font-medium text-gray-900">Müştəri özü vaxt seçsin</span>
            <span className="block text-xs text-gray-500">
              Söndürülüb qalsa, müştəri istədiyi vaxtı sərbəst yazır və siz təsdiqləyirsiniz — heç nə dəyişmir.
            </span>
          </span>
        </label>

        <div className={`mt-5 flex flex-col gap-5 transition ${enabled ? "" : "pointer-events-none opacity-40"}`}>
          <fieldset>
            <legend className="mb-1.5 text-sm font-medium text-gray-700">İş günləri</legend>
            <div className="flex flex-wrap gap-1.5">
              {DAYS.map((d) => (
                <label key={d.value} className="cursor-pointer">
                  <input type="checkbox" name="workDays" value={d.value} defaultChecked={values.workDays.includes(d.value)} className="peer sr-only" />
                  <span className="grid h-10 w-12 place-items-center rounded-lg border border-gray-300 text-sm font-medium text-gray-600 transition peer-checked:border-[var(--brand)] peer-checked:bg-[var(--brand)]/10 peer-checked:text-[var(--brand)]">
                    {d.label}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700">İş başlayır</span>
              <input name="workStart" type="time" defaultValue={values.workStart} className={inputClass} />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700">İş bitir</span>
              <input name="workEnd" type="time" defaultValue={values.workEnd} className={inputClass} />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700">Ara (bufer)</span>
              <input name="bufferMin" type="number" min={0} max={240} step={5} defaultValue={values.bufferMin} className={inputClass} />
              <span className="mt-1 block text-xs text-gray-500">Hər rezervasiyadan sonra bu qədər dəqiqə boş saxlanılır.</span>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700">Yol buferi</span>
              <input name="travelBufferMin" type="number" min={0} max={240} step={5} defaultValue={values.travelBufferMin} className={inputClass} />
              <span className="mt-1 block text-xs text-gray-500">Yalnız “müştərinin ünvanında” xidmətlərə əlavə olunur.</span>
            </label>
          </div>
        </div>
      </Card>
    </ActionForm>
  );
}
