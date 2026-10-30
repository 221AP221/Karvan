"use client";

import { Building2, Check, Copy, CreditCard, Lock, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { startTransition, useActionState, useState } from "react";
import { payByCard, payByTransfer } from "../actions";

type Props = {
  plan: string;
  planName: string;
  prices: { 1: string; 12: string; monthlyOfYear: string };
  reference: string;
  bank: { recipient: string; bank: string; iban: string; voen: string; sample: boolean };
  testMode: boolean;
};

const input = "h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/20";

function CopyRow({ label, value }: { label: string; value: string }) {
  const [done, setDone] = useState(false);
  return (
    <div className="flex items-center justify-between gap-3 border-t border-gray-100 py-2.5 text-sm first:border-0">
      <span className="text-gray-500">{label}</span>
      <span className="flex items-center gap-2 font-medium">
        <span className="font-mono">{value}</span>
        <button type="button" onClick={() => { navigator.clipboard.writeText(value.replace(/\s/g, label === "IBAN" ? "" : " ")); setDone(true); setTimeout(() => setDone(false), 1500); }} className="text-gray-400 hover:text-gray-900" aria-label={`${label} kopyala`}>
          {done ? <Check size={15} className="text-emerald-600" aria-hidden /> : <Copy size={15} aria-hidden />}
        </button>
      </span>
    </div>
  );
}

export function CheckoutForm({ plan, planName, prices, reference, bank, testMode }: Props) {
  const [months, setMonths] = useState<1 | 12>(1);
  const [method, setMethod] = useState<"card" | "transfer">("card");
  const [cardState, cardAction, cardPending] = useActionState(payByCard, undefined);
  const [bankState, bankAction, bankPending] = useActionState(payByTransfer, undefined);
  const [number, setNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const total = prices[months];

  const submit = (action: (f: FormData) => void) => (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    data.set("plan", plan);
    data.set("months", String(months));
    startTransition(() => action(data));
  };

  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/dashboard/billing" className="text-sm text-gray-500 hover:text-gray-900">
        ← Tariflər
      </Link>
      <h1 className="mt-2 text-2xl font-bold">{planName} tarifinə keçid</h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-5">
          {/* Müddət */}
          <section className="rounded-2xl border border-gray-200 bg-white p-5">
            <h2 className="mb-3 font-semibold">Müddət</h2>
            <div className="grid grid-cols-2 gap-3">
              {([1, 12] as const).map((m) => (
                <button key={m} type="button" onClick={() => setMonths(m)} className={`rounded-xl border p-4 text-left transition ${months === m ? "border-[var(--brand)] bg-[var(--brand)]/5 ring-2 ring-[var(--brand)]/20" : "border-gray-200 hover:border-gray-400"}`}>
                  <span className="flex items-center justify-between font-semibold">
                    {m === 1 ? "Aylıq" : "İllik"}
                    {m === 12 && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">2 ay pulsuz</span>}
                  </span>
                  <span className="mt-1 block text-sm text-gray-600 tabular-nums">{m === 1 ? `${prices[1]} / ay` : `${prices[12]} / il (${prices.monthlyOfYear} / ay)`}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Ödəniş üsulu */}
          <section className="rounded-2xl border border-gray-200 bg-white p-5">
            <h2 className="mb-3 font-semibold">Ödəniş üsulu</h2>
            <div className="mb-5 grid grid-cols-2 gap-2 rounded-xl bg-gray-100 p-1">
              {[
                { key: "card" as const, label: "Bank kartı", icon: CreditCard },
                { key: "transfer" as const, label: "Bank köçürməsi", icon: Building2 },
              ].map(({ key, label, icon: Icon }) => (
                <button key={key} type="button" onClick={() => setMethod(key)} className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition ${method === key ? "bg-white shadow-sm" : "text-gray-500 hover:text-gray-800"}`}>
                  <Icon size={16} aria-hidden /> {label}
                </button>
              ))}
            </div>

            {method === "card" ? (
              <form onSubmit={submit(cardAction)} className="flex flex-col gap-3">
                {testMode && (
                  <p className="rounded-lg border border-sky-200 bg-sky-50 p-3 text-xs text-sky-900">
                    <strong>Test rejimi:</strong> ödəniş sistemi hələ qoşulmayıb, kartdan pul çıxılmır. Yoxlamaq üçün <span className="font-mono">4242 4242 4242 4242</span>, istənilən gələcək tarix və CVC yazın. Uğursuz ödəniş üçün: <span className="font-mono">4000 0000 0000 0002</span>.
                  </p>
                )}
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-gray-600">Kart nömrəsi</span>
                  <input name="number" required inputMode="numeric" autoComplete="cc-number" placeholder="0000 0000 0000 0000" value={number} onChange={(e) => setNumber(e.target.value.replace(/\D/g, "").slice(0, 19).replace(/(\d{4})(?=\d)/g, "$1 "))} className={`${input} font-mono tracking-wider`} />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-gray-600">Bitmə tarixi</span>
                    <input name="expiry" required inputMode="numeric" autoComplete="cc-exp" placeholder="AA/İİ" value={expiry} onChange={(e) => { const v = e.target.value.replace(/\D/g, "").slice(0, 4); setExpiry(v.length > 2 ? `${v.slice(0, 2)}/${v.slice(2)}` : v); }} className={`${input} font-mono`} />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-gray-600">CVC</span>
                    <input name="cvc" required inputMode="numeric" autoComplete="cc-csc" maxLength={4} placeholder="123" type="password" className={`${input} font-mono`} />
                  </label>
                </div>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-gray-600">Kart sahibi</span>
                  <input name="name" required autoComplete="cc-name" placeholder="AD SOYAD" className={`${input} uppercase`} />
                </label>
                {cardState?.error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{cardState.error}</p>}
                <button disabled={cardPending} className="mt-1 flex h-12 items-center justify-center gap-2 rounded-full bg-[var(--brand)] font-semibold text-white hover:opacity-90 disabled:opacity-60">
                  <Lock size={16} aria-hidden /> {cardPending ? "Ödəniş emal olunur..." : `${total} ödə`}
                </button>
                <p className="flex items-center justify-center gap-1.5 text-xs text-gray-500">
                  <ShieldCheck size={14} aria-hidden /> Kart məlumatları Karvan-da saxlanılmır
                </p>
              </form>
            ) : (
              <form onSubmit={submit(bankAction)} className="flex flex-col gap-3">
                <input type="hidden" name="reference" value={reference} />
                <p className="text-sm text-gray-600">Aşağıdakı hesaba <strong>{total}</strong> köçürün. Təyinatda ödəniş kodunu mütləq yazın, ödəniş bununla tanınır.</p>
                {bank.sample && <p className="rounded-lg bg-amber-50 p-2.5 text-xs text-amber-800">Nümunə rekvizitlər: real hesab .env faylında BILLING_IBAN ilə təyin olunur.</p>}
                <div className="rounded-xl border border-gray-200 px-4">
                  <CopyRow label="Alıcı" value={bank.recipient} />
                  <CopyRow label="Bank" value={bank.bank} />
                  <CopyRow label="VÖEN" value={bank.voen} />
                  <CopyRow label="IBAN" value={bank.iban} />
                  <CopyRow label="Məbləğ" value={total} />
                  <CopyRow label="Təyinat (kod)" value={reference} />
                </div>
                {bankState?.error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{bankState.error}</p>}
                <button disabled={bankPending} className="mt-1 h-12 rounded-full bg-gray-900 font-semibold text-white hover:bg-gray-800 disabled:opacity-60">
                  {bankPending ? "Göndərilir..." : "Köçürməni etdim"}
                </button>
                <p className="text-center text-xs text-gray-500">Ödəniş hesabımıza daxil olan kimi yoxlanılır və tarifiniz aktivləşdirilir.</p>
              </form>
            )}
          </section>
        </div>

        {/* Xülasə */}
        <aside className="h-fit rounded-2xl border border-gray-200 bg-white p-5 lg:sticky lg:top-6">
          <h2 className="font-semibold">Sifariş</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-gray-500">Tarif</dt><dd className="font-medium">{planName}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Müddət</dt><dd className="font-medium">{months === 1 ? "1 ay" : "12 ay"}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Ödəniş</dt><dd className="font-medium">{method === "card" ? "Bank kartı" : "Bank köçürməsi"}</dd></div>
          </dl>
          <div className="mt-4 flex items-baseline justify-between border-t border-gray-100 pt-4">
            <span className="text-sm text-gray-500">Cəmi</span>
            <span className="text-2xl font-bold tabular-nums">{total}</span>
          </div>
          <p className="mt-3 text-xs text-gray-500">Abunəlik avtomatik yenilənmir: müddət bitəndə tarif Pulsuza qayıdır, məlumatlarınız qalır.</p>
        </aside>
      </div>
    </div>
  );
}
