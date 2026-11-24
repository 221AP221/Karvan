import type { PaymentKind, PaymentStatus } from "@/generated/prisma/enums";

/** Beh faizindən məbləğ: yuxarı yuvarlaqlaşdırılmır, qəpiyə kəsilir. */
export function depositAmount(totalQepik: number, percent: number | null | undefined): number | null {
  if (!percent || percent <= 0 || percent >= 100) return null;
  const value = Math.round((totalQepik * percent) / 100);
  return value > 0 && value < totalQepik ? value : null;
}

type PaymentLike = { amountQepik: number; status: PaymentStatus; kind: PaymentKind };

/** Təsdiqlənmiş ödənişlərin cəmi. */
export function paidQepik(payments: PaymentLike[]): number {
  return payments.filter((p) => p.status === "SUCCEEDED").reduce((sum, p) => sum + p.amountQepik, 0);
}

export type DepositState = {
  required: number; // tələb olunan beh
  paid: number; // ödənilmiş cəm
  remaining: number; // qalıq
  depositPaid: boolean; // beh tam ödənilib (slot təsdiqlənir — FR-BEH-03)
  fullyPaid: boolean;
};

/** Fakturanın beh vəziyyəti; beh tələb olunmursa null. */
export function depositState(
  invoice: { totalQepik: number; depositQepik: number | null },
  payments: PaymentLike[],
): DepositState | null {
  if (!invoice.depositQepik) return null;
  const paid = paidQepik(payments);
  return {
    required: invoice.depositQepik,
    paid,
    remaining: Math.max(0, invoice.totalQepik - paid),
    depositPaid: paid >= invoice.depositQepik,
    fullyPaid: paid >= invoice.totalQepik,
  };
}

/** Ləğv pəncərəsi daxilindədirmi — beh qaytarılmır (BRU-32). */
export function insideCancelWindow(scheduledAt: Date | null, cancelWindowHours: number | null, now = new Date()): boolean {
  if (!scheduledAt || !cancelWindowHours) return false;
  return scheduledAt.getTime() - now.getTime() < cancelWindowHours * 3_600_000;
}
