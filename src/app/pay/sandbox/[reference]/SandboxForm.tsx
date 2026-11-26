"use client";

import { FlaskConical, Lock } from "lucide-react";
import { useActionState, useState } from "react";
import { cancelTestPayment, payWithTestCard } from "./actions";

const input = "h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10";

export function SandboxForm({ reference, amount, plan }: { reference: string; amount: string; plan: string }) {
  const [state, action, pending] = useActionState(payWithTestCard.bind(null, reference), undefined);
  const [number, setNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [holder, setHolder] = useState("");
  return (
    <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
      <p className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900">
        <FlaskConical size={14} aria-hidden /> TEST rejimi: pul çıxılmır. Real kart yazmayın.
      </p>
      <div className="mt-5 flex items-end justify-between">
        <div>
          <p className="text-sm text-gray-500">Karvan · {plan}</p>
          <p className="text-3xl font-bold tabular-nums">{amount}</p>
        </div>
        <p className="tabular-nums text-xs text-gray-400">{reference}</p>
      </div>
      <form action={action} className="mt-5 flex flex-col gap-3">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-gray-600">Kart nömrəsi</span>
          <input name="number" required inputMode="numeric" autoComplete="off" placeholder="4242 4242 4242 4242" value={number} onChange={(e) => setNumber(e.target.value.replace(/\D/g, "").slice(0, 19).replace(/(\d{4})(?=\d)/g, "$1 "))} className={`${input} tabular-nums tracking-wider`} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-600">Bitmə tarixi</span>
            <input name="expiry" required inputMode="numeric" autoComplete="off" placeholder="AA/İİ" value={expiry} onChange={(e) => { const v = e.target.value.replace(/\D/g, "").slice(0, 4); setExpiry(v.length > 2 ? `${v.slice(0, 2)}/${v.slice(2)}` : v); }} className={`${input} tabular-nums`} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-600">CVC</span>
            <input name="cvc" required type="password" inputMode="numeric" autoComplete="off" maxLength={4} placeholder="123" value={cvc} onChange={(e) => setCvc(e.target.value.replace(/\D/g, ""))} className={`${input} tabular-nums`} />
          </label>
        </div>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-gray-600">Kart sahibi</span>
          <input name="name" required autoComplete="off" placeholder="AD SOYAD" value={holder} onChange={(e) => setHolder(e.target.value)} className={`${input} uppercase`} />
        </label>
        {state?.error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.error}</p>}
        <button disabled={pending} className="mt-1 flex h-12 items-center justify-center gap-2 rounded-full bg-gray-900 font-semibold text-white hover:bg-gray-800 disabled:opacity-60">
          <Lock size={15} aria-hidden /> {pending ? "Ödəniş emal olunur..." : `${amount} ödə`}
        </button>
      </form>
      <form action={cancelTestPayment.bind(null, reference)} className="mt-2 text-center">
        <button className="text-sm text-gray-500 underline-offset-2 hover:text-gray-900 hover:underline">Ləğv et və saytına qayıt</button>
      </form>
      <details className="mt-5 rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
        <summary className="cursor-pointer font-medium">Test kartları</summary>
        <ul className="mt-2 space-y-1 tabular-nums">
          <li>4242 4242 4242 4242 · uğurlu</li>
          <li>5555 5555 5555 4444 · uğurlu</li>
          <li>4000 0000 0000 0002 · bank rədd edir</li>
          <li>4000 0000 0000 9995 · vəsait kifayət etmir</li>
          <li>4000 0000 0000 0069 · kartın vaxtı bitib</li>
        </ul>
        <p className="mt-2 font-sans">Bitmə tarixi: gələcək istənilən ay, CVC: istənilən 3 rəqəm.</p>
      </details>
    </div>
  );
}
