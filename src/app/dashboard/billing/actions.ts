"use server";

import { redirect } from "next/navigation";
import { logActivity } from "@/lib/activity";
import { requireProfile } from "@/lib/auth";
import { PLAN_NAMES } from "@/lib/plans";
import { callbackUrl, getBillingGateway, returnUrl } from "@/lib/billing-gateway";
import { isPaidPlan, newReference, priceFor } from "@/lib/billing";
import { db } from "@/lib/db";
import type { FormState } from "@/lib/forms";

function order(form: FormData) {
  const plan = String(form.get("plan") ?? "");
  const months = Number(form.get("months"));
  if (!isPaidPlan(plan) || ![1, 12].includes(months)) return null;
  return { plan, months, amountQepik: priceFor(plan, months) };
}

// Kart: Karvan-da kart sahəsi yoxdur. Ödəniş yaradılır, istifadəçi gateway-in təhlükəsiz səhifəsinə yönləndirilir.
export async function startCardPayment(_: FormState, form: FormData): Promise<FormState> {
  const profile = await requireProfile();
  const o = order(form);
  if (!o) return { error: "Tarif seçilməyib" };
  const gateway = getBillingGateway();
  if (!gateway) return { error: "Kart ödənişi hazırda əlçatan deyil. Bank köçürməsini seçin." };

  const reference = newReference();
  const payment = await db.subscriptionPayment.create({ data: { userId: profile.userId, ...o, method: "CARD", status: "PENDING", provider: gateway.name, reference } });
  let url: string;
  try {
    const checkout = await gateway.createCheckout({
      reference,
      amountQepik: o.amountQepik,
      description: `Karvan ${PLAN_NAMES[o.plan]} · ${o.months} ay`,
      successUrl: returnUrl(payment.id),
      errorUrl: returnUrl(payment.id),
      callbackUrl: callbackUrl(gateway.name),
    });
    url = checkout.url;
    if (checkout.externalId) await db.subscriptionPayment.update({ where: { id: payment.id }, data: { externalId: checkout.externalId } });
  } catch (error) {
    console.error("gateway", error);
    await db.subscriptionPayment.update({ where: { id: payment.id }, data: { status: "FAILED", note: "Gateway sorğusu alınmadı" } });
    return { error: "Ödəniş səhifəsi açılmadı. Bir az sonra yenidən cəhd edin və ya bank köçürməsini seçin." };
  }
  redirect(url);
}

export async function payByTransfer(_: FormState, form: FormData): Promise<FormState> {
  const profile = await requireProfile();
  const o = order(form);
  if (!o) return { error: "Tarif seçilməyib" };
  const reference = String(form.get("reference") ?? "");
  if (!/^KRV-[0-9A-F]{6}$/.test(reference)) return { error: "Ödəniş kodu düzgün deyil, səhifəni yeniləyin" };
  const existing = await db.subscriptionPayment.findUnique({ where: { reference } });
  if (existing) redirect(`/dashboard/billing/success?id=${existing.id}`);
  const payment = await db.subscriptionPayment.create({ data: { userId: profile.userId, ...o, method: "BANK_TRANSFER", status: "PENDING", reference } });
  await logActivity({ userId: profile.userId, email: profile.user.email, action: "billing_transfer", details: `${o.plan} · ${o.months} ay · ${reference}` });
  redirect(`/dashboard/billing/success?id=${payment.id}`);
}
