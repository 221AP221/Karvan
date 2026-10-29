import { getCurrentProfile } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatAzn } from "@/lib/money";
import { PLAN_LIMITS, startOfMonth } from "@/lib/plans";

export const dynamic = "force-dynamic";

const STATUS_STYLE: Record<string, string> = {
  PAID: "bg-green-100 text-green-800",
  CLAIMED_PAID: "bg-blue-100 text-blue-800",
  OVERDUE: "bg-red-100 text-red-800",
  CANCELLED: "bg-gray-100 text-gray-500",
};

export default async function Dashboard() {
  const profile = await getCurrentProfile();
  if (!profile) {
    return <main className="p-10 text-center">Daxil olun (M1: autentifikasiya).</main>;
  }

  const plan = profile.user.subscription?.plan ?? "FREE";
  const [invoices, pendingOrders, usedThisMonth, paidThisMonth] = await Promise.all([
    db.invoice.findMany({ where: { profileId: profile.id }, orderBy: { issuedAt: "desc" }, take: 50 }),
    db.order.count({ where: { profileId: profile.id, status: "PENDING_APPROVAL" } }),
    db.invoice.count({ where: { profileId: profile.id, issuedAt: { gte: startOfMonth() } } }),
    db.invoice.aggregate({
      where: { profileId: profile.id, status: "PAID", paidAt: { gte: startOfMonth() } },
      _sum: { totalQepik: true },
    }),
  ]);
  const outstanding = invoices
    .filter((i) => ["SENT", "VIEWED", "CLAIMED_PAID", "OVERDUE"].includes(i.status))
    .reduce((sum, i) => sum + i.totalQepik, 0);
  const limit = PLAN_LIMITS[plan].invoicesPerMonth;

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-bold">Salam, {profile.displayName}</h1>

      <section className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Bu ay ödənilib" value={formatAzn(paidThisMonth._sum.totalQepik ?? 0)} />
        <Stat label="Gözləyən məbləğ" value={formatAzn(outstanding)} />
        <Stat label="Təsdiq gözləyən sorğu" value={String(pendingOrders)} />
        <Stat label="Faktura limiti" value={limit === Infinity ? "Limitsiz" : `${usedThisMonth} / ${limit}`} />
      </section>

      <section className="mt-8 overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="p-3">№</th>
              <th className="p-3">Müştəri</th>
              <th className="p-3">Məbləğ</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => (
              <tr key={invoice.id} className="border-t">
                <td className="p-3 font-mono">{invoice.number}</td>
                <td className="p-3">{invoice.customerName}</td>
                <td className="p-3">{formatAzn(invoice.totalQepik)}</td>
                <td className="p-3">
                  <span className={`rounded-full px-2 py-1 text-xs ${STATUS_STYLE[invoice.status] ?? "bg-yellow-100 text-yellow-800"}`}>
                    {invoice.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {invoices.length === 0 && <p className="p-6 text-center text-gray-500">Hələ faktura yoxdur.</p>}
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}
