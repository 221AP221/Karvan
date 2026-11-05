import { NextResponse } from "next/server";
import { normalizePhone } from "@/lib/phone";
import { z } from "zod";
import { logActivity } from "@/lib/activity";
import { db } from "@/lib/db";
import { InvoiceLimitError, createInvoice, invoiceUrl } from "@/lib/invoices";
import { notify } from "@/lib/notifications";
import { LIMITS, clientIp, limitByIp, rateLimit, tooMany } from "@/lib/rate-limit";

const OrderInput = z.object({
  serviceId: z.string(),
  customerName: z.string().trim().min(2).max(100),
  customerPhone: z
    .string()
    .transform((v) => normalizePhone(v))
    .refine((v): v is string => v !== null, "Telefon nömrəsi düzgün deyil"),
  customerEmail: z.union([z.literal(""), z.email()]).optional(),
  note: z.string().max(1000).optional(),
  quantity: z.coerce.number().int().min(1).max(100).default(1),
  visitorId: z.string().regex(/^[A-Za-z0-9_-]{8,64}$/).optional().catch(undefined),
});

export async function POST(request: Request) {
  // Formanın sui-istifadəsinə qarşı IP üzrə limit (NFR-SEC-10)
  const limit = await limitByIp("order", LIMITS.order.max, LIMITS.order.windowMs);
  if (!limit.ok) return tooMany(limit, "Çox sayda sifariş göndərildi. Bir az sonra yenidən cəhd edin.");

  const parsed = OrderInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Məlumatlar düzgün deyil" }, { status: 400 });
  }
  const input = parsed.data;

  // Eyni xidmətə eyni IP-dən təkrar sifariş: spamın əsas forması
  const perService = rateLimit(`order:${await clientIp()}:${input.serviceId}`, LIMITS.orderPerService.max, LIMITS.orderPerService.windowMs);
  if (!perService.ok) return tooMany(perService, "Bu xidmət üçün sifariş artıq göndərilib. Satıcı tezliklə əlaqə saxlayacaq.");

  const service = await db.service.findUnique({ where: { id: input.serviceId }, include: { profile: { select: { user: { select: { blockedAt: true } } } } } });
  if (!service || !service.isActive || service.blocked || service.profile.user.blockedAt) {
    return NextResponse.json({ error: "Xidmət tapılmadı" }, { status: 404 });
  }

  // Sifarişi gətirən mənbə: bu ziyarətçinin səhifəyə son girişi
  const lastView = input.visitorId
    ? await db.profileEvent.findFirst({
        where: { profileId: service.profileId, visitorId: input.visitorId, type: "VIEW" },
        orderBy: { createdAt: "desc" },
        select: { source: true },
      })
    : null;

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
      source: lastView?.source ?? null,
      visitorId: input.visitorId ?? null,
      status: autoInvoice ? "APPROVED" : "PENDING_APPROVAL",
    },
  });

  const seller = await db.profile.findUnique({ where: { id: service.profileId }, select: { userId: true, user: { select: { email: true } } } });
  await logActivity({ userId: seller?.userId, email: seller?.user.email, action: "order_received", details: `${service.title} · ${input.customerName}` });

  // Satıcıya bildiriş: ayarına görə dərhal gedir və ya növbəyə düşür (FR-BLD-03)
  await notify({
    profileId: service.profileId,
    event: "ORDER_NEW",
    title: `Yeni sifariş: ${service.title}`,
    body: `${input.customerName} (${input.customerPhone}) “${service.title}” xidmətini sifariş etdi.${input.note ? `\nQeyd: ${input.note}` : ""}`,
    linkPath: "/dashboard/orders",
    entityId: order.id,
  });

  if (!autoInvoice) {
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
      currency: service.currency,
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
