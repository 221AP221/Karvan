import { Ban, Bell, CircleDollarSign, Eye, Receipt, ScrollText, ShoppingBag, Sparkles, UserPlus, Users, UsersRound, Wallet } from "lucide-react";
import Link from "next/link";
import { BarChart } from "@/app/dashboard/analytics/charts";
import { niceTop } from "@/lib/analytics-report";
import { ACTIVITY_LABELS } from "@/lib/activity";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { PLAN_NAMES, PLAN_PRICES, startOfMonth } from "@/lib/plans";
import { Kpi, PageTitle, PlanBadge, card, date, dateTime, td, th } from "./ui";

const DAY = 86_400_000;
const PLANS = ["FREE", "PRO", "PRO_MAX"] as const;

function totals(rows: { currency: string; _sum: { totalQepik: number | null } }[]) {
  const parts = rows.filter((r) => r._sum.totalQepik).map((r) => formatMoney(r._sum.totalQepik!, r.currency));
  return parts.length ? parts.join(" + ") : formatMoney(0, "AZN");
}

const pct = (cur: number, prev: number) => (prev ? `${cur >= prev ? "+" : ""}${Math.round(((cur - prev) / prev) * 100)}% əvvəlki 30 günə görə` : "əvvəlki dövrdə məlumat yoxdur");

export default async function AdminOverview() {
  await requireAdmin();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const d30 = new Date(today.getTime() - 29 * DAY);
  const d60 = new Date(d30.getTime() - 30 * DAY);

  const [users, newUsers, prevUsers, blocked, activeSellers, plans, gmv, orders30, invoices30, views30, blockedServices, claimed, signups, top, recent, teamSellers, notifFailed7d, aiRequests30] = await Promise.all([
    db.user.count({ where: { role: "USER" } }),
    db.user.count({ where: { role: "USER", createdAt: { gte: d30 } } }),
    db.user.count({ where: { role: "USER", createdAt: { gte: d60, lt: d30 } } }),
    db.user.count({ where: { blockedAt: { not: null } } }),
    db.profile.count({ where: { user: { blockedAt: null }, services: { some: { isActive: true, blocked: false } } } }),
    db.subscription.groupBy({ by: ["plan"], where: { user: { role: "USER" } }, _count: true }),
    db.invoice.groupBy({ by: ["currency"], where: { status: "PAID", paidAt: { gte: d30 } }, _sum: { totalQepik: true } }),
    db.order.count({ where: { createdAt: { gte: d30 } } }),
    db.invoice.count({ where: { issuedAt: { gte: d30 } } }),
    db.profileEvent.count({ where: { type: "VIEW", createdAt: { gte: d30 } } }),
    db.service.count({ where: { blocked: true } }),
    db.invoice.count({ where: { status: "CLAIMED_PAID" } }),
    db.user.findMany({ where: { role: "USER", createdAt: { gte: d30 } }, select: { createdAt: true } }),
    db.invoice.groupBy({ by: ["profileId"], where: { status: "PAID", currency: "AZN", paidAt: { gte: d30 } }, _sum: { totalQepik: true }, orderBy: { _sum: { totalQepik: "desc" } }, take: 5 }),
    db.user.findMany({
      where: { role: "USER" },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { id: true, firstName: true, lastName: true, email: true, createdAt: true, subscription: { select: { plan: true } }, profile: { select: { username: true, displayName: true } } },
    }),
    db.membership.groupBy({ by: ["profileId"], where: { role: { not: "OWNER" } } }),
    db.notification.count({ where: { status: "FAILED", createdAt: { gte: new Date(now.getTime() - 7 * DAY) } } }),
    db.activityLog.count({ where: { action: "ai_request", createdAt: { gte: startOfMonth() } } }),
  ]);

  const planCount = Object.fromEntries(PLANS.map((p) => [p, plans.find((x) => x.plan === p)?._count ?? 0])) as Record<(typeof PLANS)[number], number>;
  const paid = planCount.PRO + planCount.PRO_MAX;
  const mrr = Math.round(planCount.PRO * 999 + planCount.PRO_MAX * 2999);

  // Günlük qeydiyyatlar
  const buckets = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(d30.getTime() + i * DAY);
    return { key: d.toDateString(), label: `${d.getDate()}.${String(d.getMonth() + 1).padStart(2, "0")}`, value: 0 };
  });
  const byKey = new Map(buckets.map((b) => [b.key, b]));
  for (const s of signups) {
    const b = byKey.get(new Date(s.createdAt.getFullYear(), s.createdAt.getMonth(), s.createdAt.getDate()).toDateString());
    if (b) b.value++;
  }
  const signupTop = niceTop(Math.max(1, ...buckets.map((b) => b.value)));

  const [feed, failed24] = await Promise.all([
    db.activityLog.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
    db.activityLog.count({ where: { action: "login_failed", createdAt: { gte: new Date(Date.now() - DAY) } } }),
  ]);

  const topProfiles = await db.profile.findMany({ where: { id: { in: top.map((t) => t.profileId) } }, select: { id: true, username: true, displayName: true, userId: true } });
  const topRows = top.map((t) => ({ ...t, profile: topProfiles.find((p) => p.id === t.profileId) }));

  return (
    <div>
      <PageTitle title="İcmal" text="Platformanın son 30 günü" />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi icon={Users} label="İstifadəçilər" value={String(users)} hint={`${activeSellers} aktiv satıcı (xidməti var)`} href="/admin/users" tone="info" />
        <Kpi icon={UserPlus} label="Yeni qeydiyyat" value={String(newUsers)} trend={prevUsers ? ((newUsers - prevUsers) / prevUsers) * 100 : undefined} hint={newUsers && !prevUsers ? "əvvəlki dövrdə məlumat yoxdur" : undefined} tone="violet" />
        <Kpi icon={CircleDollarSign} label="Təxmini MRR" value={formatMoney(mrr, "AZN")} hint={`${paid} ödənişli abunə (ödəniş qəbulu qoşulandan sonra)`} tone="money" />
        <Kpi icon={Wallet} label="Ödənilmiş dövriyyə" value={totals(gmv)} hint="Satıcıların müştərilərdən aldığı" tone="money" />
        <Kpi icon={ShoppingBag} label="Sifarişlər" value={String(orders30)} tone="brand" />
        <Kpi icon={Receipt} label="Fakturalar" value={String(invoices30)} hint={claimed ? `${claimed} “Ödədim” təsdiq gözləyir` : undefined} href="/admin/invoices" tone={claimed ? "warn" : "neutral"} />
        <Kpi icon={Eye} label="Səhifə baxışları" value={String(views30)} tone="info" />
        <Kpi icon={Ban} label="Moderasiya" value={`${blocked} hesab · ${blockedServices} xidmət`} hint="Bloklanmış" href="/admin/users?status=blocked" tone={blocked || blockedServices ? "danger" : "neutral"} />
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Kpi icon={UsersRound} label="Komandalı satıcı" value={String(teamSellers.length)} hint="Pro Max-da əlavə üzvlər" href="/admin/team" tone="violet" />
        <Kpi
          icon={Bell}
          label="Bildiriş uğursuzluğu (7 gün)"
          value={String(notifFailed7d)}
          hint={notifFailed7d ? "Bildirişlər bölməsinə baxın" : "Problem yoxdur"}
          href="/admin/notifications"
          tone={notifFailed7d ? "danger" : "money"}
        />
        <Kpi icon={Sparkles} label="AI sorğuları (bu ay)" value={String(aiRequests30)} href="/admin/ai" tone="brand" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.6fr_1fr] [&>*]:min-w-0">
        <section className={`${card} p-5`}>
          <h2 className="mb-4 font-semibold">Günlük qeydiyyatlar</h2>
          <BarChart
            ariaLabel="Günlük qeydiyyatlar"
            data={buckets.map((b) => ({ label: b.label, value: b.value, display: `${b.value} qeydiyyat` }))}
            top={signupTop}
            ticks={[String(signupTop), signupTop >= 2 ? String(signupTop / 2) : "", "0"]}
          />
        </section>

        <section className={`${card} p-5`}>
          <h2 className="mb-4 font-semibold">Planlar</h2>
          <ul className="flex flex-col gap-3">
            {PLANS.map((p) => (
              <li key={p}>
                <div className="mb-1 flex items-baseline justify-between text-sm">
                  <span className="font-medium">
                    {PLAN_NAMES[p]} <span className="text-xs font-normal text-gray-400">{PLAN_PRICES[p]} AZN</span>
                  </span>
                  <span className="tabular-nums">
                    {planCount[p]} <span className="text-xs text-gray-400">{users ? Math.round((planCount[p] / users) * 100) : 0}%</span>
                  </span>
                </div>
                <div className="h-2 rounded-full bg-gray-100">
                  <div className="h-2 rounded-full bg-gray-900" style={{ width: `${users ? (planCount[p] / users) * 100 : 0}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2 [&>*]:min-w-0">
        <section className={card}>
          <div className="flex items-center justify-between px-5 pt-5">
            <h2 className="font-semibold">Son qeydiyyatlar</h2>
            <Link href="/admin/users" className="text-sm text-gray-500 hover:text-gray-900">
              Hamısı →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="mt-3 w-full text-sm">
              <tbody>
                {recent.map((u) => (
                  <tr key={u.id} className="border-t border-gray-100">
                    <td className={td}>
                      <Link href={`/admin/users/${u.id}`} prefetch={false} className="font-medium hover:underline">
                        {u.profile?.displayName || [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email}
                      </Link>
                      <span className="block text-xs text-gray-500">{u.email}</span>
                    </td>
                    <td className={td}>
                      <PlanBadge plan={u.subscription?.plan ?? "FREE"} />
                    </td>
                    <td className={`${td} text-right text-xs text-gray-500`}>{date(u.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className={card}>
          <h2 className="px-5 pt-5 font-semibold">Ən çox satan (30 gün, AZN)</h2>
          {topRows.length ? (
            <table className="mt-3 w-full text-sm">
              <thead>
                <tr className="border-t border-gray-100">
                  <th className={th}>Satıcı</th>
                  <th className={`${th} text-right`}>Ödənilib</th>
                </tr>
              </thead>
              <tbody>
                {topRows.map((r) => (
                  <tr key={r.profileId} className="border-t border-gray-100">
                    <td className={td}>
                      <Link href={`/admin/users/${r.profile?.userId}`} prefetch={false} className="font-medium hover:underline">
                        {r.profile?.displayName}
                      </Link>
                      <span className="block text-xs text-gray-500">@{r.profile?.username}</span>
                    </td>
                    <td className={`${td} text-right font-semibold tabular-nums`}>{formatMoney(r._sum.totalQepik ?? 0, "AZN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="p-5 text-sm text-gray-500">Bu dövrdə ödəniş yoxdur.</p>
          )}
        </section>
      </div>

      <section className={`${card} mt-4`}>
        <div className="flex items-center justify-between px-5 pt-5">
          <h2 className="font-semibold">
            Son fəaliyyət
            {failed24 > 0 && (
              <Link href="/admin/logs?action=login_failed" className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                24 saatda {failed24} uğursuz giriş
              </Link>
            )}
          </h2>
          <Link href="/admin/logs" className="text-sm text-gray-500 hover:text-gray-900">
            Jurnal →
          </Link>
        </div>
        <ul className="mt-3">
          {feed.map((a) => (
            <li key={a.id} className="flex flex-wrap items-baseline justify-between gap-x-4 border-t border-gray-100 px-5 py-2.5 text-sm">
              <span>
                <span className="font-medium">{ACTIVITY_LABELS[a.action] ?? a.action}</span>
                <span className="text-gray-500"> · {a.email ?? "—"}</span>
                {a.details && <span className="text-gray-400"> · {a.details}</span>}
              </span>
              <span className="text-xs tabular-nums text-gray-400">{dateTime(a.createdAt)}</span>
            </li>
          ))}
          {!feed.length && <li className="border-t border-gray-100 px-5 py-4 text-sm text-gray-500">Hələ fəaliyyət yoxdur.</li>}
        </ul>
      </section>

      <p className="mt-6 flex items-center gap-2 text-xs text-gray-400">
        <ScrollText size={13} aria-hidden /> Admin əməliyyatlarının hamısı Jurnal bölməsində qeyd olunur.
      </p>
    </div>
  );
}
