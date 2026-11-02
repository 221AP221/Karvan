import { BadgeCheck, Check, Crown, Rocket } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { MONTHLY } from "@/lib/billing";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { PLAN_NAMES } from "@/lib/plans";

export const metadata: Metadata = { title: "Abunəlik" };

const PLANS = [
  { key: "FREE", icon: Rocket, tagline: "Yeni başlayanlar üçün", features: ["Ayda 5 faktura", "5 xidmət", "Əsas analitika", "AI: ayda 10 sorğu"] },
  { key: "PRO", icon: BadgeCheck, tagline: "Aktiv satanlar üçün", features: ["Təsdiqlənmiş hesab nişanı", "Ayda 100 faktura", "30 xidmət", "Karvan yazısı olmadan", "AI: ayda 200 sorğu"] },
  { key: "PRO_MAX", icon: Crown, tagline: "Studiyalar və komandalar üçün", features: ["Limitsiz faktura və xidmət", "Kataloqda önə çıxma", "Excel hesabat", "Prioritet dəstək", "AI: ayda 1000 sorğu"] },
] as const;

const STATUS: Record<string, { label: string; cls: string }> = {
  PENDING: { label: "Yoxlanılır", cls: "bg-amber-100 text-amber-800" },
  PAID: { label: "Ödənilib", cls: "bg-sky-100 text-sky-800" },
  ACTIVATED: { label: "Aktivdir", cls: "bg-emerald-100 text-emerald-800" },
  REJECTED: { label: "Rədd edildi", cls: "bg-red-100 text-red-800" },
  FAILED: { label: "Alınmadı", cls: "bg-gray-100 text-gray-600" },
};

const d = (x: Date) => `${String(x.getDate()).padStart(2, "0")}.${String(x.getMonth() + 1).padStart(2, "0")}.${x.getFullYear()}`;

export default async function Billing() {
  const profile = await requireProfile();
  const sub = profile.user.subscription;
  const plan = sub?.plan ?? "FREE";
  // Gateway-də yarımçıq qalan kart ödənişləri 1 saatdan sonra bağlanır
  await db.subscriptionPayment.updateMany({ where: { userId: profile.userId, method: "CARD", status: "PENDING", createdAt: { lt: new Date(Date.now() - 3_600_000) } }, data: { status: "FAILED", note: "Vaxt bitdi" } });
  const payments = await db.subscriptionPayment.findMany({ where: { userId: profile.userId }, orderBy: { createdAt: "desc" }, take: 20 });
  const pending = payments.find((p) => p.method === "BANK_TRANSFER" && (p.status === "PENDING" || p.status === "PAID"));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Abunəlik</h1>
        <p className="text-sm text-gray-500">
          Hazırkı tarif: <strong className="text-gray-900">{PLAN_NAMES[plan]}</strong>
          {sub?.currentPeriodEnd && plan !== "FREE" && <> · {d(sub.currentPeriodEnd)} tarixinədək aktivdir</>}
        </p>
      </div>

      {pending && (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <strong>{pending.reference}</strong> ödənişiniz yoxlanılır. Təsdiqdən sonra 15 dəqiqə ərzində hesabınız {PLAN_NAMES[pending.plan]} tarifinə uyğun formalaşdırılacaq.
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {PLANS.map(({ key, icon: Icon, tagline, features }) => {
          const current = key === plan;
          return (
            <div key={key} className={`flex flex-col rounded-2xl border bg-white p-5 ${current ? "border-[var(--brand)] ring-2 ring-[var(--brand)]/20" : "border-gray-200"}`}>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 font-semibold">
                  <Icon size={18} className="text-[var(--brand)]" aria-hidden /> {PLAN_NAMES[key]}
                </span>
                {current && <span className="rounded-full bg-[var(--brand)] px-2.5 py-0.5 text-xs font-medium text-white">Hazırkı</span>}
              </div>
              <p className="mt-3 text-3xl font-bold tabular-nums">
                {key === "FREE" ? "0" : formatMoney(MONTHLY[key], "AZN").replace(" AZN", "")}
                <span className="ml-1 text-sm font-normal text-gray-500">AZN / ay</span>
              </p>
              <p className="text-sm text-gray-500">{tagline}</p>
              <ul className="mt-4 flex-1 space-y-2 text-sm">
                {features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <Check size={16} className="mt-0.5 shrink-0 text-[var(--brand)]" aria-hidden /> {f}
                  </li>
                ))}
              </ul>
              {key !== "FREE" && (
                <Link href={`/dashboard/billing/checkout?plan=${key}`} className={`mt-5 rounded-full py-2.5 text-center text-sm font-semibold ${current ? "border border-gray-300 hover:bg-gray-50" : "bg-[var(--brand)] text-white hover:opacity-90"}`}>
                  {current ? "Planı idarə et" : `${PLAN_NAMES[key]}-a keç`}
                </Link>
              )}
            </div>
          );
        })}
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white">
        <h2 className="px-5 pt-5 font-semibold">Ödəniş tarixçəsi</h2>
        {payments.length ? (
          <div className="overflow-x-auto">
            <table className="mt-3 w-full min-w-[560px] text-sm">
              <tbody className="tabular-nums">
                {payments.map((p) => (
                  <tr key={p.id} className="border-t border-gray-100">
                    <td className="px-5 py-3 font-mono text-xs">{p.reference}</td>
                    <td className="px-3 py-3">
                      {PLAN_NAMES[p.plan]} · {p.months === 12 ? "illik" : "aylıq"}
                    </td>
                    <td className="px-3 py-3">{p.method === "CARD" ? "Bank kartı" : "Bank köçürməsi"}</td>
                    <td className="px-3 py-3 text-right font-medium">{formatMoney(p.amountQepik, "AZN")}</td>
                    <td className="px-3 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS[p.status].cls}`}>{STATUS[p.status].label}</span>
                    </td>
                    <td className="px-5 py-3 text-right text-xs text-gray-500">{d(p.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="p-5 text-sm text-gray-500">Hələ ödəniş yoxdur.</p>
        )}
      </section>
    </div>
  );
}
