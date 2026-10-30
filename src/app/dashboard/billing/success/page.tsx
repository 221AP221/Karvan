import { CheckCircle2, Clock } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { PLAN_NAMES } from "@/lib/plans";
import { type SearchParams, param } from "@/lib/search-params";

export const metadata: Metadata = { title: "Ödəniş qəbul edildi" };

export default async function Success({ searchParams }: { searchParams: SearchParams }) {
  const profile = await requireProfile();
  const payment = await db.subscriptionPayment.findFirst({ where: { id: param(await searchParams, "id"), userId: profile.userId } });
  if (!payment) notFound();
  const transfer = payment.method === "BANK_TRANSFER";
  const active = payment.status === "ACTIVATED";

  return (
    <div className="mx-auto max-w-lg py-6 text-center">
      <span className={`mx-auto grid h-20 w-20 place-items-center rounded-full ${transfer && !active ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"}`}>
        {transfer && !active ? <Clock size={40} strokeWidth={1.75} aria-hidden /> : <CheckCircle2 size={40} strokeWidth={1.75} aria-hidden />}
      </span>
      <h1 className="mt-6 text-2xl font-bold">{transfer && !active ? "Ödənişiniz qeydə alındı" : "Ödənişiniz qəbul edildi"}</h1>
      <p className="mt-3 text-gray-600">
        {transfer && !active
          ? "Köçürmə hesabımıza daxil olan kimi yoxlanılacaq. Təsdiqdən sonra 15 dəqiqə ərzində hesabınız abunəliyinizə uyğun formalaşdırılacaq."
          : "15 dəqiqə ərzində hesabınız abunəliyinizə uyğun formalaşdırılacaq."}
      </p>
      <dl className="mx-auto mt-6 max-w-sm rounded-2xl border border-gray-200 bg-white p-4 text-left text-sm">
        <div className="flex justify-between py-1"><dt className="text-gray-500">Ödəniş kodu</dt><dd className="font-mono font-medium">{payment.reference}</dd></div>
        <div className="flex justify-between py-1"><dt className="text-gray-500">Tarif</dt><dd className="font-medium">{PLAN_NAMES[payment.plan]} · {payment.months === 12 ? "illik" : "aylıq"}</dd></div>
        <div className="flex justify-between py-1"><dt className="text-gray-500">Məbləğ</dt><dd className="font-medium">{formatMoney(payment.amountQepik, "AZN")}</dd></div>
        <div className="flex justify-between py-1"><dt className="text-gray-500">Status</dt><dd className="font-medium">{active ? "Aktivləşdirildi" : transfer ? "Yoxlanılır" : "Emal olunur"}</dd></div>
      </dl>
      <div className="mt-6 flex justify-center gap-3">
        <Link href="/dashboard" className="rounded-full bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-white">Panelə qayıt</Link>
        <Link href="/dashboard/billing" className="rounded-full border border-gray-300 px-5 py-2.5 text-sm font-semibold">Abunəlik</Link>
      </div>
    </div>
  );
}
