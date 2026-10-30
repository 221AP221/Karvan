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
};

export function invoiceUrl(id: string) {
  return `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/i/${id}`;
}

export async function createInvoice(input: NewInvoice) {
  return db.$transaction(async (tx) => {
    // Sətri kilidləyirik ki, paralel sorğular eyni nömrəni və ya limitdən artıq faktura yaratmasın.
    const [profile] = await tx.$queryRaw<{ id: string; userId: string; invoicePrefix: string; invoiceSeq: number }[]>`
      SELECT id, "userId", "invoicePrefix", "invoiceSeq" FROM "Profile" WHERE id = ${input.profileId} FOR UPDATE`;
    if (!profile) throw new Error("Profil tapılmadı");

    const subscription = await tx.subscription.findUnique({ where: { userId: profile.userId } });
    const limits = PLAN_LIMITS[subscription?.plan ?? "FREE"];

    const usedThisMonth = await tx.invoice.count({
      where: { profileId: profile.id, issuedAt: { gte: startOfMonth() } },
    });
    if (usedThisMonth >= limits.invoicesPerMonth) {
      throw new InvoiceLimitError(
        `Pulsuz planda ayda ${limits.invoicesPerMonth} faktura yaratmaq olar. Pro plana keçin.`,
      );
    }

    const paymentMethod = limits.onlinePayments ? (input.paymentMethod ?? "MANUAL") : "MANUAL";
    const seq = profile.invoiceSeq + 1;
    await tx.profile.update({ where: { id: profile.id }, data: { invoiceSeq: seq } });

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
        currency: input.currency ?? "AZN",
        dueAt: input.dueAt,
        note: input.note,
        status: "SENT",
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
    },
  });
}
