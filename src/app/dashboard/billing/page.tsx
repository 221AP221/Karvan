import { BadgeCheck, Check, Crown, Rocket } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { requirePageAccess } from "@/lib/auth";
import { MONTHLY } from "@/lib/billing";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { PLAN_NAMES } from "@/lib/plans";

export const metadata: Metadata = { title: "Abunəlik" };

const PLANS = [
  { key: "FREE", icon: Rocket, tagline: "Yeni başlayanlar üçün", features: ["Ayda 25 faktura", "5 xidmət", "Əsas analitika", "AI: ayda 10 sorğu"] },
  { key: "PRO", icon: BadgeCheck, tagline: "Aktiv satanlar üçün", features: ["Təsdiqlənmiş hesab nişanı", "Ayda 300 faktura", "30 xidmət", "Karvan yazısı olmadan", "AI: ayda 200 sorğu"] },
  { key: "PRO_MAX", icon: Crown, tagline: "Studiyalar və komandalar üçün", features: ["Limitsiz faktura və xidmət", "Kataloqda önə çıxma", "5 komanda üzvü (sahib daxil)", "Excel hesabat", "Prioritet dəstək", "AI: ayda 1000 sorğu"] },
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
  const profile = await requirePageAccess("billing");
  const sub = profile.user.subscription;
  const plan = sub?.plan ?? "FREE";
  // Gateway-də yarımçıq qalan kart ödənişləri 1 saatdan sonra bağlanır
  await db.subscriptionPayment.updateMany({ where: { userId: profile.userId, method: "CARD", status: "PENDING", createdAt: { lt: new Date(Date.now() - 3_600_000) } }, data: { status: "FAILED", note: "Vaxt bitdi" } });
  const payments = await db.subscriptionPayment.findMany({ where: { userId: profile.userId }, orderBy: { createdAt: "desc" }, take: 20 });
  const pending = payments.find((p) => p.method === "BANK_TRANSFER" && (p.status === "PENDING" || p.status === "PAID"));
  const last = payments.find((p) => p.status === "ACTIVATED");
  const current = PLANS.find((p) => p.key === plan)!;
  const CurrentIcon = current.icon;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-10">
      <h1 className="text-2xl font-bold">Abunəlik</h1>

      {pending && (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <strong>{pending.reference}</strong> ödənişiniz yoxlanılır. Təsdiqdən sonra 15 dəqiqə ərzində hesabınız {PLAN_NAMES[pending.plan]} tarifinə uyğun formalaşdırılacaq.
        </p>
      )}

      {/* Cari tarif */}
      <section className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex gap-4">
          <CurrentIcon size={36} strokeWidth={1.4} className="mt-0.5 shrink-0 text-gray-900" aria-hidden />
          <div>
            <p className="font-semibold">{PLAN_NAMES[plan]} tarifi</p>
            <p className="text-sm text-gray-500">{last?.months === 12 ? "İllik" : plan === "FREE" ? "Pulsuz" : "Aylıq"}</p>
            <p className="mt-1 text-sm text-gray-500">
              {plan === "FREE"
                ? "Ödəniş tələb olunmur. İstədiyiniz vaxt yuxarı tarifə keçə bilərsiniz."
                : sub?.currentPeriodEnd
                  ? `Abunəliyiniz ${d(sub.currentPeriodEnd)} tarixinədək aktivdir. Avtomatik yenilənmir — müddət bitməzdən əvvəl özünüz uzadırsınız.`
                  : "Abunəlik aktivdir."}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/dashboard/billing/checkout?plan=${plan === "FREE" ? "PRO" : plan}`}
            className="rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm font-medium transition hover:bg-gray-50"
          >
            {plan === "FREE" ? "Ödənişli tarifə keç" : "Müddəti uzat"}
          </Link>
          <Link href="#tariflar" className="rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm font-medium transition hover:bg-gray-50">
            Tarifi dəyiş
          </Link>
        </div>
      </section>

      {/* Ödəniş tarixçəsi */}
      <section>
        <h2 className="font-semibold">Ödəniş tarixçəsi</h2>
        <p className="mt-1 text-sm text-gray-500">
          Kart məlumatlarınız Karvanda saxlanılmır: ödəniş lisenziyalı aqreqatorun səhifəsində aparılır. Bank köçürməsi ilə də ödəyə bilərsiniz.
        </p>
        {payments.length ? (
          <div className="mt-4 overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-500">
                  <th className="px-4 py-2.5 font-medium">Tarix</th>
                  <th className="px-4 py-2.5 text-right font-medium">Məbləğ</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 font-medium">Qeyd</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {payments.map((p) => (
                  <tr key={p.id} className="border-b border-gray-100 last:border-0">
                    <td className="px-4 py-3">{d(p.createdAt)}</td>
                    <td className="px-4 py-3 text-right font-medium">{formatMoney(p.amountQepik, "AZN")}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS[p.status].cls}`}>{STATUS[p.status].label}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {PLAN_NAMES[p.plan]} · {p.months === 12 ? "illik" : "aylıq"} · <span className="font-mono">{p.reference}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-2 text-sm text-gray-500">Hələ ödəniş yoxdur.</p>
        )}
      </section>

      {/* Tariflər */}
      <section id="tariflar" className="scroll-mt-6">
        <h2 className="font-semibold">Tariflər</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {PLANS.map(({ key, icon: Icon, tagline, features }) => {
            const isCurrent = key === plan;
            return (
              <div key={key} className={`flex flex-col rounded-2xl border bg-white p-5 ${isCurrent ? "border-[var(--brand)] ring-2 ring-[var(--brand)]/20" : "border-gray-200"}`}>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 font-semibold">
                    <Icon size={18} className="text-[var(--brand)]" aria-hidden /> {PLAN_NAMES[key]}
                  </span>
                  {isCurrent && <span className="rounded-full bg-[var(--brand)] px-2.5 py-0.5 text-xs font-medium text-white">Hazırkı</span>}
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
                  <Link
                    href={`/dashboard/billing/checkout?plan=${key}`}
                    className={`mt-5 rounded-full py-2.5 text-center text-sm font-semibold ${isCurrent ? "border border-gray-300 hover:bg-gray-50" : "bg-[var(--brand)] text-white hover:opacity-90"}`}
                  >
                    {isCurrent ? "Müddəti uzat" : `${PLAN_NAMES[key]}-a keç`}
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Ləğv */}
      {plan !== "FREE" && (
        <section className="flex flex-wrap items-center justify-between gap-4 border-t border-gray-200 pt-6">
          <div>
            <h2 className="font-semibold">Ləğv</h2>
            <p className="mt-1 text-sm text-gray-500">
              Abunəlik avtomatik yenilənmir: heç nə etməsəniz, müddət bitəndə hesab Pulsuz tarifə qayıdır və məlumatlarınız yerində qalır.
            </p>
          </div>
          <Link href="/dashboard/settings" className="rounded-lg border border-red-200 bg-white px-3.5 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50">
            Hesab parametrləri
          </Link>
        </section>
      )}
    </div>
  );
}
