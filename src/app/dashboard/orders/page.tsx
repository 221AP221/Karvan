import Link from "next/link";
import { Card } from "@/components/ui";
import { requireProfile } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatAzn } from "@/lib/money";
import { whatsappShareLink } from "@/lib/notify";
import { rejectOrder } from "../actions";
import { ApproveForm } from "./ApproveForm";

const dateTime = (d: Date) =>
  d.toLocaleString("az-AZ", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

export default async function Orders() {
  const profile = await requireProfile();
  const [pending, recent] = await Promise.all([
    db.order.findMany({
      where: { profileId: profile.id, status: "PENDING_APPROVAL" },
      include: { service: true },
      orderBy: { createdAt: "desc" },
    }),
    db.order.findMany({
      where: { profileId: profile.id, status: { not: "PENDING_APPROVAL" } },
      include: { service: true, invoice: true },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Sifarişlər</h1>

      <section>
        <h2 className="mb-3 font-semibold">Təsdiq gözləyir ({pending.length})</h2>
        {pending.length === 0 && <p className="text-sm text-gray-500">Yeni sorğu yoxdur.</p>}
        <div className="flex flex-col gap-3">
          {pending.map((order) => (
            <Card key={order.id}>
              <div className="flex flex-wrap justify-between gap-2">
                <div>
                  <p className="font-medium">{order.service?.title ?? "Xidmət"}{order.quantity > 1 && ` × ${order.quantity}`}</p>
                  <p className="text-sm text-gray-600">
                    {order.customerName} ·{" "}
                    <a href={whatsappShareLink(order.customerPhone, `Salam, ${order.customerName}!`)} target="_blank" rel="noopener noreferrer" className="text-[var(--brand)] hover:underline">
                      {order.customerPhone}
                    </a>
                  </p>
                  {order.note && <p className="mt-2 rounded-lg bg-gray-50 p-2 text-sm">“{order.note}”</p>}
                </div>
                <p className="text-xs text-gray-400">{dateTime(order.createdAt)}</p>
              </div>
              <div className="mt-4 flex flex-wrap items-start gap-3">
                <ApproveForm
                  orderId={order.id}
                  suggestedAmount={order.service?.amountQepik ? String(order.service.amountQepik / 100) : ""}
                />
                <form action={rejectOrder.bind(null, order.id)}>
                  <button className="rounded-full px-4 py-2 text-sm text-red-600 hover:bg-red-50">İmtina et</button>
                </form>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {recent.length > 0 && (
        <Card title="Son sifarişlər">
          <ul className="divide-y divide-gray-100 text-sm">
            {recent.map((order) => (
              <li key={order.id} className="flex items-center justify-between gap-3 py-2">
                <span>
                  {order.customerName} · {order.service?.title ?? "Xidmət"}
                </span>
                {order.invoice ? (
                  <Link href={`/dashboard/invoices/${order.invoice.id}`} className="text-[var(--brand)] hover:underline">
                    {order.invoice.number} · {formatAzn(order.invoice.totalQepik)}
                  </Link>
                ) : (
                  <span className="text-gray-400">{order.status === "REJECTED" ? "İmtina edilib" : "Faktura yoxdur"}</span>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
