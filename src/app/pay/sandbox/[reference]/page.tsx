import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { sandboxEnabled } from "@/lib/billing-gateway";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { PLAN_NAMES } from "@/lib/plans";
import { SandboxForm } from "./SandboxForm";

export const metadata: Metadata = { title: "Test ödəniş səhifəsi", robots: { index: false } };

// Real gateway-də bu səhifə bankın/gateway-in öz səhifəsidir. Burada eyni axın test kartları ilə simulyasiya olunur.
export default async function SandboxGateway({ params }: { params: Promise<{ reference: string }> }) {
  if (!sandboxEnabled()) notFound();
  const payment = await db.subscriptionPayment.findUnique({ where: { reference: (await params).reference } });
  if (!payment || payment.method !== "CARD") notFound();
  return (
    <main className="grid min-h-screen place-items-center bg-gray-100 p-4">
      {payment.status === "PENDING" ? (
        <SandboxForm reference={payment.reference} amount={formatMoney(payment.amountQepik, "AZN")} plan={PLAN_NAMES[payment.plan]} />
      ) : (
        <p className="rounded-2xl bg-white p-6 text-sm text-gray-600 shadow">Bu ödəniş artıq bağlanıb.</p>
      )}
    </main>
  );
}
