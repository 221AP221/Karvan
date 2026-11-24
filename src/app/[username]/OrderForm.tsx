"use client";

import { PhoneInput } from "@/components/PhoneInput";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import type { Dict } from "@/i18n/server";
import { track, visitorId } from "@/lib/track";

type Result = { invoiceUrl: string } | { pending: true } | { error: string; slotTaken?: boolean };

const input = "rounded-lg border border-gray-300 px-3 py-2 outline-none transition focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/15";

const today = () => new Date().toLocaleDateString("sv-SE"); // YYYY-MM-DD, yerli vaxt

export function OrderForm({
  serviceId,
  serviceTitle,
  fixedPrice,
  booking,
  needsAddress,
  t,
}: {
  serviceId: string;
  serviceTitle: string;
  fixedPrice: boolean;
  booking: boolean;
  needsAddress: boolean;
  t: Dict["seller"];
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [day, setDay] = useState(today);
  const [slots, setSlots] = useState<string[] | null>(null);
  const [slot, setSlot] = useState("");
  const [reload, setReload] = useState(0);

  // Esc forma açıq olanda onu bağlayır
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !busy && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, busy]);

  // Tarix dəyişəndə boş saatlar yenidən gətirilir; köhnə sorğunun cavabı gec gəlsə, atılır
  useEffect(() => {
    if (!open || !booking || !day) return;
    let active = true;
    setSlots(null);
    setSlot("");
    fetch(`/api/booking/slots?serviceId=${encodeURIComponent(serviceId)}&day=${day}`)
      .then((r) => r.json())
      .then((data: { slots?: string[] }) => active && setSlots(data.slots ?? []))
      .catch(() => active && setSlots([]));
    return () => {
      active = false;
    };
  }, [open, booking, day, serviceId, reload]);

  function close() {
    setOpen(false);
    setResult(null);
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (booking && !slot) return setResult({ error: t.slotRequired });
    const form = new FormData(e.currentTarget);
    setBusy(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId,
          visitorId: visitorId(),
          ...Object.fromEntries(form),
          ...(booking ? { day, slot } : {}),
        }),
      });
      const data: Result = await res.json();
      if ("invoiceUrl" in data) window.location.href = data.invoiceUrl;
      else {
        setResult(data);
        // Slot aradan gedibsə, siyahı dərhal yenilənsin ki, müştəri boş saatı görsün
        if ("error" in data && data.slotTaken) setReload((n) => n + 1);
      }
    } catch {
      setResult({ error: t.netError });
    } finally {
      setBusy(false);
    }
  }

  if (result && "pending" in result) {
    return (
      <p className="mt-3 rounded-lg bg-green-50 p-3 text-sm text-green-800">
        {t.pending}
      </p>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => {
          setOpen(true);
          track("ORDER_OPEN", { target: serviceId });
        }}
        className="mt-3 w-full rounded-full bg-[var(--brand)] py-2 font-medium text-white transition hover:opacity-90"
      >
        {fixedPrice ? t.order : t.ask}
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="mt-3 flex flex-col gap-2" aria-label={`${serviceTitle}: ${fixedPrice ? t.orderTitle : t.askTitle}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">{fixedPrice ? t.orderTitle : t.askTitle}</span>
        <button
          type="button"
          onClick={close}
          disabled={busy}
          aria-label={t.close}
          title={t.closeEsc}
          className="grid h-8 w-8 place-items-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50"
        >
          <X size={18} strokeWidth={2} aria-hidden />
        </button>
      </div>
      <input name="customerName" required autoFocus placeholder={t.name} className={input} />
      <PhoneInput name="customerPhone" required label={t.phone} />
      <input name="customerEmail" type="email" placeholder={t.email} className={input} />
      <p className="-mt-1 text-xs text-gray-500">{t.emailHint}</p>

      {booking && (
        <>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">{t.pickDate}</span>
            <input type="date" value={day} min={today()} onChange={(e) => setDay(e.target.value)} className={`${input} w-full`} />
          </label>
          <div>
            <span className="mb-1.5 block text-sm font-medium text-gray-700">{t.pickSlot}</span>
            {slots === null ? (
              <p className="text-sm text-gray-500">{t.loadingSlots}</p>
            ) : slots.length === 0 ? (
              <p className="text-sm text-gray-500">{t.noSlots}</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {slots.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSlot(s)}
                    aria-pressed={slot === s}
                    className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                      slot === s
                        ? "border-[var(--brand)] bg-[var(--brand)] text-white"
                        : "border-gray-300 text-gray-700 hover:border-[var(--brand)] hover:text-[var(--brand)]"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
          {needsAddress && (
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700">{t.address}</span>
              <input name="address" required maxLength={200} className={`${input} w-full`} />
              <span className="mt-1 block text-xs text-gray-500">{t.addressHint}</span>
            </label>
          )}
        </>
      )}

      <textarea name="note" placeholder={t.note} rows={2} className={input} />
      {result && "error" in result && <p className="text-sm text-red-600">{result.error}</p>}
      <div className="flex gap-2">
        <button type="button" onClick={close} disabled={busy} className="rounded-full border border-gray-300 px-4 py-2 font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50">
          {t.cancel}
        </button>
        <button disabled={busy} className="flex-1 rounded-full bg-[var(--brand)] py-2 font-medium text-white transition hover:opacity-90 disabled:opacity-60">
          {busy ? t.sending : fixedPrice ? t.submitOrder : t.submitAsk}
        </button>
      </div>
    </form>
  );
}
