import type { DiscountType, Plan } from "@/generated/prisma/client";
import { db } from "@/lib/db";

/**
 * Endirim kuponları (kampaniyalar). Admin kod yaradır, istifadəçi ödəniş səhifəsində tətbiq edir.
 * Qiymət həmişə serverdə yenidən hesablanır: brauzerdən gələn məbləğə etibar edilmir.
 */

export const COUPON_RE = /^[A-Z0-9][A-Z0-9_-]{2,23}$/;

export const normalizeCode = (raw: string) => raw.trim().toUpperCase().replace(/\s+/g, "");

export type CouponError =
  | "notFound"
  | "inactive"
  | "notStarted"
  | "expired"
  | "exhausted"
  | "userLimit"
  | "planMismatch"
  | "monthsMismatch";

export const COUPON_ERRORS: Record<CouponError, string> = {
  notFound: "Belə bir endirim kodu yoxdur",
  inactive: "Bu kod deaktiv edilib",
  notStarted: "Bu kodun istifadə vaxtı hələ başlamayıb",
  expired: "Bu kodun istifadə müddəti bitib",
  exhausted: "Bu kodun istifadə limiti dolub",
  userLimit: "Bu koddan artıq istifadə etmisiniz",
  planMismatch: "Bu kod seçilmiş tarifə aid deyil",
  monthsMismatch: "Bu kod seçilmiş müddətə aid deyil",
};

export function discountFor(coupon: { type: DiscountType; value: number }, amountQepik: number) {
  const raw = coupon.type === "PERCENT" ? Math.round((amountQepik * coupon.value) / 100) : coupon.value;
  // Endirim qiymətdən böyük ola bilməz; ödəniş sıfıra düşməsin deyə ən azı 1 qəpik qalır
  return Math.max(0, Math.min(raw, amountQepik - 1));
}

export type CouponCheck =
  | { ok: true; coupon: { id: string; code: string; type: DiscountType; value: number }; discountQepik: number; total: number }
  | { ok: false; error: CouponError; message: string };

/** Kodun verilmiş istifadəçi, tarif, müddət və məbləğ üçün keçərliliyini yoxlayır. */
export async function checkCoupon(input: {
  code: string;
  userId: string;
  plan: Plan;
  months: number;
  amountQepik: number;
}): Promise<CouponCheck> {
  const code = normalizeCode(input.code);
  const fail = (error: CouponError): CouponCheck => ({ ok: false, error, message: COUPON_ERRORS[error] });
  if (!COUPON_RE.test(code)) return fail("notFound");

  const coupon = await db.coupon.findUnique({ where: { code } });
  if (!coupon) return fail("notFound");
  if (!coupon.isActive) return fail("inactive");

  const now = new Date();
  if (coupon.startsAt && coupon.startsAt > now) return fail("notStarted");
  if (coupon.endsAt && coupon.endsAt < now) return fail("expired");
  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) return fail("exhausted");
  if (coupon.plans.length > 0 && !coupon.plans.includes(input.plan)) return fail("planMismatch");
  if (coupon.months !== null && coupon.months !== input.months) return fail("monthsMismatch");

  if (coupon.maxUsesPerUser !== null) {
    const mine = await db.couponRedemption.count({ where: { couponId: coupon.id, userId: input.userId } });
    if (mine >= coupon.maxUsesPerUser) return fail("userLimit");
  }

  const discountQepik = discountFor(coupon, input.amountQepik);
  return {
    ok: true,
    coupon: { id: coupon.id, code: coupon.code, type: coupon.type, value: coupon.value },
    discountQepik,
    total: input.amountQepik - discountQepik,
  };
}

/**
 * Ödəniş aktivləşəndə kuponun istifadəsi qeydə alınır.
 * Sayğac atomik artırılır; limit dolubsa qeyd yaradılmır (eyni anda iki ödəniş halı).
 */
export async function redeemCoupon(input: { code: string; userId: string; paymentId: string; discountQepik: number }) {
  const code = normalizeCode(input.code);
  const coupon = await db.coupon.findUnique({ where: { code }, select: { id: true, maxUses: true } });
  if (!coupon) return false;

  const claimed = await db.coupon.updateMany({
    where: coupon.maxUses === null ? { id: coupon.id } : { id: coupon.id, usedCount: { lt: coupon.maxUses } },
    data: { usedCount: { increment: 1 } },
  });
  if (claimed.count === 0) return false;

  await db.couponRedemption.create({
    data: { couponId: coupon.id, userId: input.userId, paymentId: input.paymentId, discountQepik: input.discountQepik },
  });
  return true;
}

export const couponLabel = (c: { type: DiscountType; value: number }) =>
  c.type === "PERCENT" ? `${c.value}%` : `${(c.value / 100).toFixed(2)} AZN`;
