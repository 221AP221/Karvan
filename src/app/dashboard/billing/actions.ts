"use server";

import { redirect } from "next/navigation";
import { logActivity } from "@/lib/activity";
import { requireProfile } from "@/lib/auth";
import { PLAN_NAMES } from "@/lib/plans";
import { callbackUrl, getBillingGateway, returnUrl } from "@/lib/billing-gateway";
import { isPaidPlan, newReference, priceFor } from "@/lib/billing";
import { db } from "@/lib/db";
import { checkCoupon, couponLabel } from "@/lib/coupons";
import type { FormState } from "@/lib/forms";

function order(form: FormData) {
  const plan = String(form.get("plan") ?? "");
  const months = Number(form.get("months"));
  if (!isPaidPlan(plan) || ![1, 12].includes(months)) return null;
  return { plan, months, amountQepik: priceFor(plan, months) };
}

/**
 * Endirim kodu serverdə yenidən yoxlanılır və qiymət burada hesablanır:
 * brauzerdən gələn məbləğ heç vaxt istifadə olunmur.
 */
async function withCoupon(form: FormData, userId: string, o: { plan: "PRO" | "PRO_MAX"; months: number; amountQepik: number }) {
  const raw = String(form.get("coupon") ?? "").trim();
  if (!raw) return { amountQepik: o.amountQepik, couponCode: null as string | null, discountQepik: 0 };
  const check = await checkCoupon({ code: raw, userId, plan: o.plan, months: o.months, amountQepik: o.amountQepik });
  if (!check.ok) return { error: check.message };
  return { amountQepik: check.total, couponCode: check.coupon.code, discountQepik: check.discountQepik };
}

// Yoxlama nəticəsində xəta varsa ödəniş yaradılmır
const couponError = (r: { error?: string }) => (r.error ? { error: r.error } : null);

// Kart: Karvan-da kart sahəsi yoxdur. Ödəniş yaradılır, istifadəçi gateway-in təhlükəsiz səhifəsinə yönləndirilir.
export async function startCardPayment(_: FormState, form: FormData): Promise<FormState> {
  const profile = await requireProfile();
  const o = order(form);
  if (!o) return { error: "Tarif seçilməyib" };
  const gateway = getBillingGateway();
  if (!gateway) return { error: "Kart ödənişi hazırda əlçatan deyil. Bank köçürməsini seçin." };

  const priced = await withCoupon(form, profile.userId, o);
  const bad = couponError(priced);
  if (bad) return bad;

  const reference = newReference();
  const payment = await db.subscriptionPayment.create({
    data: {
      userId: profile.userId,
      plan: o.plan,
      months: o.months,
      amountQepik: priced.amountQepik!,
      couponCode: priced.couponCode ?? null,
      discountQepik: priced.discountQepik ?? 0,
      method: "CARD",
      status: "PENDING",
      provider: gateway.name,
      reference,
    },
  });
  let url: string;
  try {
    const checkout = await gateway.createCheckout({
      reference,
      amountQepik: priced.amountQepik!,
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
  const priced = await withCoupon(form, profile.userId, o);
  const bad = couponError(priced);
  if (bad) return bad;
  const payment = await db.subscriptionPayment.create({
    data: {
      userId: profile.userId,
      plan: o.plan,
      months: o.months,
      amountQepik: priced.amountQepik!,
      couponCode: priced.couponCode ?? null,
      discountQepik: priced.discountQepik ?? 0,
      method: "BANK_TRANSFER",
      status: "PENDING",
      reference,
    },
  });
  await logActivity({ userId: profile.userId, email: profile.user.email, action: "billing_transfer", details: `${o.plan} · ${o.months} ay · ${reference}` });
  redirect(`/dashboard/billing/success?id=${payment.id}`);
}

export type CouponState =
  | { ok: true; code: string; discountQepik: number; total: number; label: string; appliedMonths: number }
  | { ok: false; error: string }
  | undefined;

/** Ödəniş səhifəsində "Tətbiq et": kodu yoxlayır və yeni qiyməti qaytarır. */
export async function applyCoupon(_: CouponState, form: FormData): Promise<CouponState> {
  const profile = await requireProfile();
  const o = order(form);
  if (!o) return { ok: false, error: "Tarif seçilməyib" };
  const code = String(form.get("coupon") ?? "").trim();
  if (!code) return undefined;
  const check = await checkCoupon({ code, userId: profile.userId, plan: o.plan, months: o.months, amountQepik: o.amountQepik });
  if (!check.ok) return { ok: false, error: check.message };
  return {
    ok: true,
    code: check.coupon.code,
    discountQepik: check.discountQepik,
    total: check.total,
    label: couponLabel(check.coupon),
    appliedMonths: o.months,
  };
}
