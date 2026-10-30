"use server";

import { redirect } from "next/navigation";
import { logActivity } from "@/lib/activity";
import { requireProfile } from "@/lib/auth";
import { CARD_TEST_MODE, activatePayment, chargeTestCard, isPaidPlan, newReference, priceFor } from "@/lib/billing";
import { db } from "@/lib/db";
import type { FormState } from "@/lib/forms";

function order(form: FormData) {
  const plan = String(form.get("plan") ?? "");
  const months = Number(form.get("months"));
  if (!isPaidPlan(plan) || ![1, 12].includes(months)) return null;
  return { plan, months, amountQepik: priceFor(plan, months) };
}

export async function payByCard(_: FormState, form: FormData): Promise<FormState> {
  const profile = await requireProfile();
  const o = order(form);
  if (!o) return { error: "Tarif seçilməyib" };
  if (!CARD_TEST_MODE) return { error: "Kart ödənişi hazırda əlçatan deyil. Bank köçürməsini seçin." };

  const result = chargeTestCard({
    number: String(form.get("number") ?? ""),
    expiry: String(form.get("expiry") ?? ""),
    cvc: String(form.get("cvc") ?? ""),
    name: String(form.get("name") ?? ""),
  });
  if (!result.ok) {
    await logActivity({ userId: profile.userId, email: profile.user.email, action: "billing_card_failed", details: result.error });
    return { error: result.error };
  }
  // Kart məlumatı saxlanılmır: yalnız son 4 rəqəm
  const payment = await db.subscriptionPayment.create({
    data: { userId: profile.userId, ...o, method: "CARD", status: "PAID", paidAt: new Date(), reference: newReference(), cardLast4: result.last4, externalId: result.externalId },
  });
  await logActivity({ userId: profile.userId, email: profile.user.email, action: "billing_card", details: `${o.plan} · ${o.months} ay · ${payment.reference}` });
  await activatePayment(payment.id);
  redirect(`/dashboard/billing/success?id=${payment.id}`);
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
