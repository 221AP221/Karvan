import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { KARVAN_BANK, isPaidPlan, newReference, priceFor } from "@/lib/billing";
import { getBillingGateway } from "@/lib/billing-gateway";
import { formatMoney } from "@/lib/money";
import { PLAN_NAMES } from "@/lib/plans";
import { type SearchParams, param } from "@/lib/search-params";
import { CheckoutForm } from "./CheckoutForm";

export const metadata: Metadata = { title: "Ödəniş" };

export default async function Checkout({ searchParams }: { searchParams: SearchParams }) {
  await requireProfile();
  const sp = await searchParams;
  const plan = param(sp, "plan");
  if (!isPaidPlan(plan)) redirect("/dashboard/billing");
  return (
    <CheckoutForm
      plan={plan}
      planName={PLAN_NAMES[plan]}
      prices={{ 1: formatMoney(priceFor(plan, 1), "AZN"), 12: formatMoney(priceFor(plan, 12), "AZN"), monthlyOfYear: formatMoney(Math.round(priceFor(plan, 12) / 12), "AZN") }}
      reference={newReference()}
      bank={KARVAN_BANK}
      cardAvailable={Boolean(getBillingGateway())}
      sandbox={getBillingGateway()?.name === "sandbox"}
    />
  );
}
