import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { InvoiceLimitError, createInvoice, invoiceUrl } from "@/lib/invoices";

const OrderInput = z.object({
  serviceId: z.string(),
  customerName: z.string().trim().min(2).max(100),
  customerPhone: z
    .string()
    .transform((v) => v.replace(/[\s()-]/g, ""))
    .pipe(z.string().regex(/^(\+994|0)\d{9}$/, "Telefon nömrəsi düzgün deyil")),
  customerEmail: z.union([z.literal(""), z.email()]).optional(),
  note: z.string().max(1000).optional(),
  quantity: z.coerce.number().int().min(1).max(100).default(1),
});

// TODO(M2): IP üzrə rate limit
export async function POST(request: Request) {
  const parsed = OrderInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Məlumatlar düzgün deyil" }, { status: 400 });
  }
  const input = parsed.data;

  const service = await db.service.findUnique({ where: { id: input.serviceId } });
  if (!service || !service.isActive) {
    return NextResponse.json({ error: "Xidmət tapılmadı" }, { status: 404 });
  }

  const autoInvoice = service.priceType === "FIXED" && service.amountQepik !== null;

  const order = await db.order.create({
    data: {
      profileId: service.profileId,
      serviceId: service.id,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      customerEmail: input.customerEmail || null,
      note: input.note,
      quantity: input.quantity,
      status: autoInvoice ? "APPROVED" : "PENDING_APPROVAL",
    },
  });

  if (!autoInvoice) {
    // TODO(M2): satıcıya bildiriş
    return NextResponse.json({ pending: true });
  }

  try {
    const invoice = await createInvoice({
      profileId: service.profileId,
      orderId: order.id,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerEmail: order.customerEmail,
      items: [{ title: service.title, quantity: order.quantity, unitQepik: service.amountQepik! }],
      dueAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    });
    return NextResponse.json({ invoiceUrl: invoiceUrl(invoice.publicId) });
  } catch (error) {
    if (!(error instanceof InvoiceLimitError)) throw error;
    // Satıcının limiti bitibsə, sifariş itməsin: təsdiq gözləyən sorğuya çevrilir.
    await db.order.update({ where: { id: order.id }, data: { status: "PENDING_APPROVAL" } });
    return NextResponse.json({ pending: true });
  }
}
