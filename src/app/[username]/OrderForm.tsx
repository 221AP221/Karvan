"use client";

import { PhoneInput } from "@/components/PhoneInput";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { track, visitorId } from "@/lib/track";

type Result = { invoiceUrl: string } | { pending: true } | { error: string };

const input = "rounded-lg border border-gray-300 px-3 py-2 outline-none transition focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/15";

export function OrderForm({ serviceId, serviceTitle, fixedPrice }: { serviceId: string; serviceTitle: string; fixedPrice: boolean }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  // Esc forma açıq olanda onu bağlayır
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !busy && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, busy]);

  function close() {
    setOpen(false);
    setResult(null);
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId, visitorId: visitorId(), ...Object.fromEntries(form) }),
      });
      const data: Result = await res.json();
      if ("invoiceUrl" in data) window.location.href = data.invoiceUrl;
      else setResult(data);
    } catch {
      setResult({ error: "Bağlantı xətası, yenidən cəhd edin." });
    } finally {
      setBusy(false);
    }
  }

  if (result && "pending" in result) {
    return (
      <p className="mt-3 rounded-lg bg-green-50 p-3 text-sm text-green-800">
        Sorğunuz göndərildi. Satıcı qiyməti təsdiqləyən kimi faktura sizə göndəriləcək.
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
        {fixedPrice ? "Sifariş et" : "Qiymət soruş"}
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="mt-3 flex flex-col gap-2" aria-label={`${serviceTitle}: sifariş`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">{fixedPrice ? "Sifariş məlumatları" : "Qiymət sorğusu"}</span>
        <button
          type="button"
          onClick={close}
          disabled={busy}
          aria-label="Bağla"
          title="Bağla (Esc)"
          className="grid h-8 w-8 place-items-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50"
        >
          <X size={18} strokeWidth={2} aria-hidden />
        </button>
      </div>
      <input name="customerName" required autoFocus placeholder="Adınız" className={input} />
      <PhoneInput name="customerPhone" required label="Telefon nömrəniz" />
      <input name="customerEmail" type="email" placeholder="E-poçt (könüllü)" className={input} />
      <textarea name="note" placeholder="Qeyd" rows={2} className={input} />
      {result && "error" in result && <p className="text-sm text-red-600">{result.error}</p>}
      <div className="flex gap-2">
        <button type="button" onClick={close} disabled={busy} className="rounded-full border border-gray-300 px-4 py-2 font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50">
          Ləğv et
        </button>
        <button disabled={busy} className="flex-1 rounded-full bg-[var(--brand)] py-2 font-medium text-white transition hover:opacity-90 disabled:opacity-60">
          {busy ? "Göndərilir..." : fixedPrice ? "Fakturanı al" : "Sorğu göndər"}
        </button>
      </div>
    </form>
  );
}
