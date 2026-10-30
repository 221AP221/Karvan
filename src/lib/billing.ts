import { randomBytes } from "node:crypto";
import type { Plan } from "@/generated/prisma/client";
import { logActivity } from "@/lib/activity";
import { db } from "@/lib/db";

// Karvan abunəlik ödənişləri. Qiymətlər qəpiklə; illik ödənişdə 2 ay pulsuz.
export const PAID_PLANS = ["PRO", "PRO_MAX"] as const;
export type PaidPlan = (typeof PAID_PLANS)[number];
export const MONTHLY: Record<PaidPlan, number> = { PRO: 999, PRO_MAX: 2999 };
export const PERIODS = [
  { months: 1, label: "Aylıq", note: "" },
  { months: 12, label: "İllik", note: "2 ay pulsuz" },
] as const;

export const isPaidPlan = (v: unknown): v is PaidPlan => PAID_PLANS.includes(v as PaidPlan);
export const priceFor = (plan: PaidPlan, months: number) => (months === 12 ? MONTHLY[plan] * 10 : MONTHLY[plan] * months);

// Bank köçürməsi üçün Karvan-ın rekvizitləri (.env-dən; təyin edilməyibsə nümunə göstərilir)
export const KARVAN_BANK = {
  recipient: process.env.BILLING_RECIPIENT ?? "Karvan MMC",
  bank: process.env.BILLING_BANK ?? "Kapital Bank ASC",
  iban: process.env.BILLING_IBAN ?? "AZ00 AIIB 0000 0000 0000 0000 0000",
  voen: process.env.BILLING_VOEN ?? "0000000000",
  sample: !process.env.BILLING_IBAN,
};

// Kart: real gateway qoşulmayıbsa (PAYMENT_GATEWAY boşdur) test rejimi işləyir — pul çıxılmır
export const CARD_TEST_MODE = !process.env.PAYMENT_GATEWAY;

export function newReference() {
  return `KRV-${randomBytes(4).toString("hex").toUpperCase().slice(0, 6)}`;
}

function luhn(number: string) {
  let sum = 0;
  for (let i = 0; i < number.length; i++) {
    let d = Number(number[number.length - 1 - i]);
    if (i % 2) d = d * 2 > 9 ? d * 2 - 9 : d * 2;
    sum += d;
  }
  return sum % 10 === 0;
}

export type CardInput = { number: string; expiry: string; cvc: string; name: string };

// Test gateway: kartı yoxlayır; 4000 0000 0000 0002 həmişə rədd olunur (uğursuz ödənişi yoxlamaq üçün)
export function chargeTestCard(card: CardInput): { ok: true; last4: string; externalId: string } | { ok: false; error: string } {
  const number = card.number.replace(/\D/g, "");
  if (number.length < 13 || number.length > 19 || !luhn(number)) return { ok: false, error: "Kart nömrəsi düzgün deyil" };
  const m = /^(\d{2})\s*\/\s*(\d{2})$/.exec(card.expiry.trim());
  if (!m || Number(m[1]) < 1 || Number(m[1]) > 12) return { ok: false, error: "Bitmə tarixi AA/İİ formatında olmalıdır" };
  const exp = new Date(2000 + Number(m[2]), Number(m[1]), 1);
  if (exp <= new Date()) return { ok: false, error: "Kartın vaxtı bitib" };
  if (!/^\d{3,4}$/.test(card.cvc)) return { ok: false, error: "CVC 3 rəqəm olmalıdır" };
  if (card.name.trim().length < 3) return { ok: false, error: "Kart sahibinin adını yazın" };
  if (number === "4000000000000002") return { ok: false, error: "Bank ödənişi rədd etdi (balans kifayət deyil)" };
  return { ok: true, last4: number.slice(-4), externalId: `test_${randomBytes(6).toString("hex")}` };
}

// Tarifi aktivləşdirir: eyni tarif uzadılırsa müddət mövcud bitmə tarixinə əlavə olunur
export async function activatePayment(paymentId: string) {
  const payment = await db.subscriptionPayment.findUnique({ where: { id: paymentId }, include: { user: { select: { email: true, subscription: true } } } });
  if (!payment || payment.status === "ACTIVATED" || payment.status === "REJECTED" || payment.status === "FAILED") return;
  const sub = payment.user.subscription;
  const base = sub?.plan === payment.plan && sub.currentPeriodEnd && sub.currentPeriodEnd > new Date() ? sub.currentPeriodEnd : new Date();
  const end = new Date(base);
  end.setMonth(end.getMonth() + payment.months);
  await db.$transaction([
    db.subscription.upsert({
      where: { userId: payment.userId },
      update: { plan: payment.plan, currentPeriodEnd: end },
      create: { userId: payment.userId, plan: payment.plan, currentPeriodEnd: end },
    }),
    db.subscriptionPayment.update({ where: { id: paymentId }, data: { status: "ACTIVATED", paidAt: payment.paidAt ?? new Date(), activatedAt: new Date() } }),
  ]);
  await logActivity({ userId: payment.userId, email: payment.user.email, action: "plan_activated", details: `${payment.plan} · ${payment.months} ay · ${payment.reference}` });
}

// Müddəti bitmiş ödənişli tarif pulsuza qayıdır (girişdə yoxlanılır)
export async function expireIfNeeded(userId: string, sub: { plan: Plan; currentPeriodEnd: Date | null } | null) {
  if (sub && sub.plan !== "FREE" && sub.currentPeriodEnd && sub.currentPeriodEnd < new Date()) {
    await db.subscription.update({ where: { userId }, data: { plan: "FREE", currentPeriodEnd: null } });
    await logActivity({ userId, action: "plan_expired", details: sub.plan });
    return true;
  }
  return false;
}
