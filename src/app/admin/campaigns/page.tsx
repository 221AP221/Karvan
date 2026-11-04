import { Ticket, TrendingDown, Users2 } from "lucide-react";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { type SearchParams, param } from "@/lib/search-params";
import { Kpi, PageTitle } from "../ui";
import { CouponForm, CouponRow } from "./ui";

export const metadata: Metadata = { title: "Kampaniyalar" };

export default async function Campaigns({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin();
  const sp = await searchParams;
  const editId = param(sp, "edit");

  const [coupons, redemptions, discountSum] = await Promise.all([
    db.coupon.findMany({ orderBy: { createdAt: "desc" }, take: 200, include: { _count: { select: { redemptions: true } } } }),
    db.couponRedemption.count(),
    db.couponRedemption.aggregate({ _sum: { discountQepik: true } }),
  ]);
  const found = editId ? coupons.find((c) => c.id === editId) : undefined;
  const editing = found
    ? {
        id: found.id,
        code: found.code,
        type: found.type,
        value: found.value,
        plans: found.plans,
        months: found.months,
        maxUses: found.maxUses,
        maxUsesPerUser: found.maxUsesPerUser,
        usedCount: found.usedCount,
        startsAt: found.startsAt?.toISOString() ?? null,
        endsAt: found.endsAt?.toISOString() ?? null,
        isActive: found.isActive,
        note: found.note,
        redemptions: found._count.redemptions,
      }
    : null;
  const active = coupons.filter((c) => c.isActive).length;

  return (
    <div>
      <PageTitle
        title="Kampaniyalar"
        text="Endirim kodları yaradın: müddət, istifadə sayı və tarif məhdudiyyəti ilə. Ödəniş səhifəsində qiymət avtomatik yenidən hesablanır."
      />

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Kpi icon={Ticket} label="Aktiv kod" value={String(active)} hint={`Ümumi: ${coupons.length}`} />
        <Kpi icon={Users2} label="İstifadə" value={String(redemptions)} hint="Aktivləşmiş ödənişlər" />
        <Kpi icon={TrendingDown} label="Verilmiş endirim" value={formatMoney(discountSum._sum.discountQepik ?? 0, "AZN")} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
        <CouponForm key={editing?.id ?? "new"} editing={editing} />

        <section className="rounded-2xl border border-gray-200 bg-white">
          <h2 className="border-b border-gray-100 px-5 py-4 font-semibold">Kodlar</h2>
          {coupons.length ? (
            <ul className="divide-y divide-gray-100">
              {coupons.map((c) => (
                <CouponRow
                  key={c.id}
                  coupon={{
                    id: c.id,
                    code: c.code,
                    type: c.type,
                    value: c.value,
                    plans: c.plans,
                    months: c.months,
                    maxUses: c.maxUses,
                    maxUsesPerUser: c.maxUsesPerUser,
                    usedCount: c.usedCount,
                    startsAt: c.startsAt?.toISOString() ?? null,
                    endsAt: c.endsAt?.toISOString() ?? null,
                    isActive: c.isActive,
                    note: c.note,
                    redemptions: c._count.redemptions,
                  }}
                />
              ))}
            </ul>
          ) : (
            <p className="px-5 py-8 text-center text-sm text-gray-500">Hələ kod yaradılmayıb.</p>
          )}
        </section>
      </div>
    </div>
  );
}
