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

export function newReference() {
  return `KRV-${randomBytes(4).toString("hex").toUpperCase().slice(0, 6)}`;
}

// Gateway nəticəsi (webhook və ya sandbox). Təkrar bildirişlər təhlükəsizdir: yalnız gözləyən ödəniş işlənir.
export async function applyGatewayResult(result: { reference: string; status: "SUCCEEDED" | "FAILED"; externalId?: string; amountQepik?: number }) {
  const payment = await db.subscriptionPayment.findUnique({ where: { reference: result.reference } });
  if (!payment || payment.method !== "CARD") return "unknown" as const;
  // Məbləğ uyğun gəlmirsə, aktivləşdirmə olmur (saxta bildirişdən qorunma)
  if (result.status === "SUCCEEDED" && result.amountQepik !== undefined && result.amountQepik !== payment.amountQepik) {
    await db.subscriptionPayment.updateMany({ where: { id: payment.id, status: "PENDING" }, data: { status: "FAILED", note: `Məbləğ uyğun gəlmir: ${result.amountQepik}` } });
    return "mismatch" as const;
  }
  if (result.status === "FAILED") {
    await db.subscriptionPayment.updateMany({ where: { id: payment.id, status: "PENDING" }, data: { status: "FAILED", externalId: result.externalId ?? payment.externalId } });
    await logActivity({ userId: payment.userId, action: "billing_card_failed", details: payment.reference });
    return "failed" as const;
  }
  // Atomik "tutma": iki eyni vaxtlı bildirişdən yalnız biri aktivləşdirir
  const claimed = await db.subscriptionPayment.updateMany({ where: { id: payment.id, status: "PENDING" }, data: { status: "PAID", paidAt: new Date(), externalId: result.externalId ?? payment.externalId } });
  if (claimed.count === 0) return "duplicate" as const;
  await logActivity({ userId: payment.userId, action: "billing_card", details: `${payment.plan} · ${payment.months} ay · ${payment.reference}` });
  await activatePayment(payment.id);
  return "activated" as const;
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
