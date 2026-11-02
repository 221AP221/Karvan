import { FlaskConical } from "lucide-react";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { applyGatewayResult } from "@/lib/billing";
import { getBillingGateway } from "@/lib/billing-gateway";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { PLAN_NAMES } from "@/lib/plans";

export const metadata: Metadata = { title: "Test ödəniş səhifəsi", robots: { index: false } };

async function settle(reference: string, outcome: "SUCCEEDED" | "FAILED") {
  "use server";
  if (getBillingGateway()?.name !== "sandbox") return;
  const payment = await db.subscriptionPayment.findUnique({ where: { reference } });
  if (!payment) return;
  await applyGatewayResult({ reference, status: outcome, externalId: `sandbox_${reference}`, amountQepik: payment.amountQepik });
  redirect(`/dashboard/billing/success?id=${payment.id}`);
}

// Ödəniş sisteminin (gateway) simulyasiyası: real gateway-də bu səhifə bankın/gateway-in öz səhifəsi olur.
// Yalnız lokal işləmədə açılır, kart sahəsi yoxdur.
export default async function SandboxGateway({ params }: { params: Promise<{ reference: string }> }) {
  if (getBillingGateway()?.name !== "sandbox") notFound();
  const payment = await db.subscriptionPayment.findUnique({ where: { reference: (await params).reference } });
  if (!payment || payment.method !== "CARD") notFound();
  const open = payment.status === "PENDING";
  return (
    <main className="grid min-h-screen place-items-center bg-gray-100 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
        <p className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900">
          <FlaskConical size={14} aria-hidden /> Test gateway (simulyasiya): pul çıxılmır
        </p>
        <h1 className="mt-5 text-lg font-semibold">Karvan · {PLAN_NAMES[payment.plan]}</h1>
        <p className="mt-1 text-3xl font-bold tabular-nums">{formatMoney(payment.amountQepik, "AZN")}</p>
        <p className="mt-1 font-mono text-xs text-gray-500">{payment.reference}</p>
        {open ? (
          <div className="mt-6 flex flex-col gap-2">
            <form action={settle.bind(null, payment.reference, "SUCCEEDED")}>
              <button className="h-11 w-full rounded-full bg-emerald-600 font-semibold text-white hover:bg-emerald-700">Ödənişi uğurlu keç</button>
            </form>
            <form action={settle.bind(null, payment.reference, "FAILED")}>
              <button className="h-11 w-full rounded-full border border-gray-300 font-semibold text-gray-700 hover:bg-gray-50">Ödənişi rədd et</button>
            </form>
          </div>
        ) : (
          <p className="mt-6 text-sm text-gray-600">Bu ödəniş artıq bağlanıb.</p>
        )}
      </div>
    </main>
  );
}
