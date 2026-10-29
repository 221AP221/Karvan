"use client";

import { useState } from "react";

type Result = { invoiceUrl: string } | { pending: true } | { error: string };

export function OrderForm({ serviceId, fixedPrice }: { serviceId: string; fixedPrice: boolean }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  async function submit(form: FormData) {
    setBusy(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId, ...Object.fromEntries(form) }),
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
        onClick={() => setOpen(true)}
        className="mt-3 w-full rounded-full bg-[var(--brand)] py-2 font-medium text-white"
      >
        {fixedPrice ? "Sifariş et" : "Qiymət soruş"}
      </button>
    );
  }

  return (
    <form action={submit} className="mt-3 flex flex-col gap-2">
      <input name="customerName" required placeholder="Adınız" className="rounded-lg border px-3 py-2" />
      <input
        name="customerPhone"
        required
        type="tel"
        placeholder="+994 50 123 45 67"
        className="rounded-lg border px-3 py-2"
      />
      <input name="customerEmail" type="email" placeholder="E-poçt (könüllü)" className="rounded-lg border px-3 py-2" />
      <textarea name="note" placeholder="Qeyd" rows={2} className="rounded-lg border px-3 py-2" />
      {result && "error" in result && <p className="text-sm text-red-600">{result.error}</p>}
      <button disabled={busy} className="rounded-full bg-[var(--brand)] py-2 font-medium text-white disabled:opacity-60">
        {busy ? "Göndərilir..." : fixedPrice ? "Fakturanı al" : "Sorğu göndər"}
      </button>
    </form>
  );
}
