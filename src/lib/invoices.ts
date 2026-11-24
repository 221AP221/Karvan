import { customAlphabet } from "nanoid";
import { db } from "@/lib/db";
import { PLAN_LIMITS, startOfMonth } from "@/lib/plans";
import type { PaymentMethod } from "@/generated/prisma/client";

// Təxmin edilə bilməyən ictimai ID: /i/<publicId>
const publicId = customAlphabet("23456789abcdefghjkmnpqrstuvwxyz", 12);

export class InvoiceLimitError extends Error {}

export type NewInvoice = {
  profileId: string;
  orderId?: string;
  customerName: string;
  customerPhone?: string | null;
  customerEmail?: string | null;
  items: { title: string; quantity: number; unitQepik: number }[];
  currency?: string;
  paymentMethod?: PaymentMethod;
  dueAt?: Date | null;
  note?: string | null;
  /** Rezervasiyanı tutmaq üçün tələb olunan beh və onun ləğv pəncərəsi (FR-BEH-03/05) */
  depositQepik?: number | null;
  cancelWindowHours?: number | null;
  /**
   * Limit dolubsa nə baş versin (FR-FAK-16, BRU-28). "throw" (defolt) — sifariş axını üçün:
   * sabit qiymətli sifariş sorğuya çevrilsin (FR-SIF-06), müştəriyə göndərilə bilməyən DRAFT
   * faktura göstərilməsin (/i/ səhifəsi DRAFT-ı 404 verir). "draft" — panelin özündə əl ilə
   * yaradılan faktura üçün: iş itmir, qaralama kimi saxlanılır və limit sayğacına daxil edilmir.
   */
  onLimit?: "throw" | "draft";
};

export function invoiceUrl(id: string) {
  return `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/i/${id}`;
}

export async function createInvoice(input: NewInvoice) {
  return db.$transaction(async (tx) => {
    // Sətri kilidləyirik ki, paralel sorğular eyni nömrəni və ya limitdən artıq faktura yaratmasın.
    const [profile] = await tx.$queryRaw<{ id: string; userId: string; invoicePrefix: string; invoiceSeq: number; invoiceQuotaMonth: Date | null; invoiceQuotaUsed: number }[]>`
      SELECT id, "userId", "invoicePrefix", "invoiceSeq", "invoiceQuotaMonth", "invoiceQuotaUsed" FROM "Profile" WHERE id = ${input.profileId} FOR UPDATE`;
    if (!profile) throw new Error("Profil tapılmadı");

    const subscription = await tx.subscription.findUnique({ where: { userId: profile.userId } });
    const limits = PLAN_LIMITS[subscription?.plan ?? "FREE"];

    // Limit yalnız göndərilmiş fakturaların sayğacına baxır (BRU-01): qaralama sayılmır,
    // silinmiş faktura isə limiti geri qaytarmır.
    const month = startOfMonth();
    const sameMonth = profile.invoiceQuotaMonth !== null && new Date(profile.invoiceQuotaMonth).getTime() === month.getTime();
    const usedThisMonth = sameMonth ? profile.invoiceQuotaUsed : 0;
    const overLimit = usedThisMonth >= limits.invoicesPerMonth;
    if (overLimit && input.onLimit !== "draft") {
      throw new InvoiceLimitError(
        `Planınızda ayda ${limits.invoicesPerMonth} faktura yaratmaq olar. Daha çoxu üçün yuxarı plana keçin.`,
      );
    }

    const paymentMethod = limits.onlinePayments ? (input.paymentMethod ?? "MANUAL") : "MANUAL";
    const seq = profile.invoiceSeq + 1;
    await tx.profile.update({
      where: { id: profile.id },
      data: overLimit ? { invoiceSeq: seq } : { invoiceSeq: seq, invoiceQuotaMonth: month, invoiceQuotaUsed: usedThisMonth + 1 },
    });

    return tx.invoice.create({
      data: {
        publicId: publicId(),
        number: `${profile.invoicePrefix}-${new Date().getFullYear()}-${String(seq).padStart(4, "0")}`,
        profileId: profile.id,
        orderId: input.orderId,
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        customerEmail: input.customerEmail,
        paymentMethod,
        totalQepik: input.items.reduce((sum, i) => sum + i.quantity * i.unitQepik, 0),
        depositQepik: input.depositQepik ?? null,
        cancelWindowHours: input.cancelWindowHours ?? null,
        currency: input.currency ?? "AZN",
        dueAt: input.dueAt,
        note: input.note,
        // Limit dolubsa qaralama kimi qalır (FR-FAK-16); göndərmək üçün bax sendDraftInvoice
        status: overLimit ? "DRAFT" : "SENT",
        items: { create: input.items.map((item, position) => ({ ...item, position })) },
      },
    });
  });
}

export function getPublicInvoice(publicId: string) {
  return db.invoice.findUnique({
    where: { publicId },
    include: {
      items: { orderBy: { position: "asc" } },
      profile: { include: { user: { select: { subscription: { select: { plan: true } } } } } },
      // Beh vəziyyəti üçün ödənişlər (FR-BEH-03)
      payments: { select: { amountQepik: true, status: true, kind: true } },
      // Rəy forması eyni səhifədədir: ikinci dəfə soruşmamaq üçün buradaca gətirilir
      order: { select: { serviceId: true, scheduledAt: true } },
      review: { select: { rating: true, comment: true } },
    },
  });
}

/** Bu ay istifadə olunmuş faktura sayı (sayğacdan — silinən faktura limiti geri qaytarmır). */
export async function invoicesUsedThisMonth(profileId: string) {
  const p = await db.profile.findUnique({ where: { id: profileId }, select: { invoiceQuotaMonth: true, invoiceQuotaUsed: true } });
  if (!p?.invoiceQuotaMonth) return 0;
  return p.invoiceQuotaMonth.getTime() === startOfMonth().getTime() ? p.invoiceQuotaUsed : 0;
}

/**
 * Limit dolduğu üçün qaralama qalmış fakturanı göndərməyə çalışır (FR-FAK-17): usta ödənişli
 * tarifə keçib və ya yeni ay başlayıbsa limitə uyğun gəlir və faktura SENT olur; əks halda
 * InvoiceLimitError atılır.
 */
export async function sendDraftInvoice(profileId: string, invoiceId: string) {
  return db.$transaction(async (tx) => {
    const invoice = await tx.invoice.findFirst({ where: { id: invoiceId, profileId, status: "DRAFT" } });
    if (!invoice) throw new Error("Qaralama faktura tapılmadı");

    const [profile] = await tx.$queryRaw<{ id: string; userId: string; invoiceQuotaMonth: Date | null; invoiceQuotaUsed: number }[]>`
      SELECT id, "userId", "invoiceQuotaMonth", "invoiceQuotaUsed" FROM "Profile" WHERE id = ${profileId} FOR UPDATE`;
    if (!profile) throw new Error("Profil tapılmadı");

    const subscription = await tx.subscription.findUnique({ where: { userId: profile.userId } });
    const limits = PLAN_LIMITS[subscription?.plan ?? "FREE"];

    const month = startOfMonth();
    const sameMonth = profile.invoiceQuotaMonth !== null && new Date(profile.invoiceQuotaMonth).getTime() === month.getTime();
    const usedThisMonth = sameMonth ? profile.invoiceQuotaUsed : 0;
    if (usedThisMonth >= limits.invoicesPerMonth) {
      throw new InvoiceLimitError(
        `Planınızda ayda ${limits.invoicesPerMonth} faktura yaratmaq olar. Daha çoxu üçün yuxarı plana keçin.`,
      );
    }

    await tx.profile.update({ where: { id: profile.id }, data: { invoiceQuotaMonth: month, invoiceQuotaUsed: usedThisMonth + 1 } });
    return tx.invoice.update({ where: { id: invoice.id }, data: { status: "SENT" } });
  });
}
