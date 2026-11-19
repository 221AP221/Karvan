"use client";

import { Building2, Check, Copy, CreditCard, Lock, ShieldCheck, Tag, X } from "lucide-react";
import Link from "next/link";
import { startTransition, useActionState, useState } from "react";
import { applyCoupon, payByTransfer, startCardPayment } from "../actions";

type Props = {
  plan: string;
  planName: string;
  prices: { 1: string; 12: string; monthlyOfYear: string };
  amounts: { 1: number; 12: number }; // qəpiklə: endirim hesablaması üçün
  reference: string;
  bank: { recipient: string; bank: string; iban: string; voen: string; sample: boolean };
  cardAvailable: boolean;
  sandbox: boolean;
  carryDays: number;
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

export function CheckoutForm({ plan, planName, prices, amounts, reference, bank, cardAvailable, sandbox, carryDays }: Props) {
  const [months, setMonths] = useState<1 | 12>(1);
  const [method, setMethod] = useState<"card" | "transfer">(cardAvailable ? "card" : "transfer");
  const [cardState, cardAction, cardPending] = useActionState(startCardPayment, undefined);
  const [bankState, bankAction, bankPending] = useActionState(payByTransfer, undefined);
  const [couponState, couponAction, couponPending] = useActionState(applyCoupon, undefined);
  const [coupon, setCoupon] = useState("");

  // Tətbiq olunmuş kod yalnız seçilmiş müddət üçün etibarlıdır: müddət dəyişəndə yenidən yoxlanır
  const applied = couponState?.ok && couponState.appliedMonths === months ? couponState : null;
  const money = (qepik: number) => `${(qepik / 100).toFixed(2).replace(".", ",")} AZN`;
  const total = applied ? money(applied.total) : prices[months];

  const submit = (action: (f: FormData) => void) => (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    data.set("plan", plan);
    data.set("months", String(months));
    if (applied) data.set("coupon", applied.code);
    startTransition(() => action(data));
  };

  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/dashboard/billing" className="text-sm text-gray-500 hover:text-gray-900">
        ← Tariflər
      </Link>
      <h1 className="mt-2 text-2xl font-bold">{planName} tarifinə keçid</h1>
      {carryDays > 0 && (
        <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
          Hazırkı tarifinizdən qalan müddət itmir: yeni tarifə <strong>{carryDays} gün</strong> kimi əlavə olunacaq.
        </p>
      )}

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
                <button key={key} type="button" disabled={key === "card" && !cardAvailable} title={key === "card" && !cardAvailable ? "Kart ödənişi hazırda bağlıdır, bank köçürməsi ilə davam edin" : undefined} onClick={() => setMethod(key)} className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${method === key ? "bg-white shadow-sm" : "text-gray-500 hover:text-gray-800"}`}>
                  <Icon size={16} aria-hidden /> {label}
                </button>
              ))}
            </div>

            {method === "card" ? (
              <form onSubmit={submit(cardAction)} className="flex flex-col gap-3">
                <p className="flex items-start gap-2 rounded-xl bg-gray-50 p-3 text-sm text-gray-700">
                  <ShieldCheck size={18} className="mt-0.5 shrink-0 text-emerald-600" aria-hidden />
                  <span>
                    <strong>{total}</strong> ödəmək üçün bankın təhlükəsiz ödəniş səhifəsinə yönləndiriləcəksiniz. Kart məlumatlarınız Karvan-a daxil edilmir və saxlanılmır. Ödəniş bitəndə bura qayıdacaqsınız.
                  </span>
                </p>
                {sandbox && <p className="rounded-lg border border-sky-200 bg-sky-50 p-3 text-xs text-sky-900">Test rejimi: real ödəniş sistemi qoşulmayıb, simulyasiya səhifəsi açılacaq (pul çıxılmır).</p>}
                {cardState?.error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{cardState.error}</p>}
                <button disabled={cardPending} className="flex h-12 items-center justify-center gap-2 rounded-full bg-[var(--brand)] font-semibold text-white hover:opacity-90 disabled:opacity-60">
                  <Lock size={16} aria-hidden /> {cardPending ? "Yönləndirilir..." : `${total} · Kartla ödə`}
                </button>
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
          {/* Endirim kodu */}
          <div className="mt-4 border-t border-gray-100 pt-4">
            {applied ? (
              <div className="flex items-center justify-between gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 text-sm">
                <span className="flex min-w-0 items-center gap-2 text-emerald-900">
                  <Tag size={15} className="shrink-0" aria-hidden />
                  <span className="truncate font-semibold">{applied.code}</span>
                  <span className="shrink-0 text-emerald-700">−{applied.label}</span>
                </span>
                <button
                  type="button"
                  onClick={() => { setCoupon(""); startTransition(() => couponAction(new FormData())); }}
                  aria-label="Endirim kodunu ləğv et"
                  className="shrink-0 rounded-full p-1 text-emerald-700 hover:bg-emerald-100"
                >
                  <X size={15} aria-hidden />
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const data = new FormData();
                  data.set("plan", plan);
                  data.set("months", String(months));
                  data.set("coupon", coupon);
                  startTransition(() => couponAction(data));
                }}
                className="flex gap-2"
              >
                <input
                  name="coupon"
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                  placeholder="Endirim kodu"
                  maxLength={24}
                  className="h-10 min-w-0 flex-1 rounded-lg border border-gray-300 px-3 text-sm uppercase outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/20"
                />
                <button disabled={couponPending || !coupon.trim()} className="h-10 shrink-0 rounded-lg border border-gray-300 px-3 text-sm font-medium hover:border-gray-500 disabled:opacity-50">
                  {couponPending ? "..." : "Tətbiq et"}
                </button>
              </form>
            )}
            {couponState && !couponState.ok && <p role="alert" className="mt-2 text-xs text-red-600">{couponState.error}</p>}
          </div>

          <div className="mt-4 space-y-2 border-t border-gray-100 pt-4">
            {applied && (
              <>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Tarif qiyməti</span>
                  <span className="tabular-nums line-through">{prices[months]}</span>
                </div>
                <div className="flex justify-between text-sm text-emerald-700">
                  <span>Endirim</span>
                  <span className="tabular-nums">−{money(applied.discountQepik)}</span>
                </div>
              </>
            )}
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-gray-500">Cəmi</span>
              <span className="text-2xl font-bold tabular-nums">{total}</span>
            </div>
          </div>
          <p className="mt-3 text-xs text-gray-500">Abunəlik avtomatik yenilənmir: müddət bitəndə tarif Pulsuza qayıdır, məlumatlarınız qalır.</p>
        </aside>
      </div>
    </div>
  );
}
