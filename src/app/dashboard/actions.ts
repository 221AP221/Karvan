"use server";

import { normalizePhone } from "@/lib/phone";
import { logActivity } from "@/lib/activity";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requirePermission, requireProfile } from "@/lib/auth";
import { db } from "@/lib/db";
import { notify } from "@/lib/notifications";
import { refreshRating } from "@/lib/reviews";
import { deleteMediaByUrl, ownedMediaUrl } from "@/lib/media";
import { PLAN_LIMITS } from "@/lib/plans";
import { InvoiceLimitError, createInvoice, invoiceUrl } from "@/lib/invoices";
import { aznToQepik, formatMoney, isCurrency } from "@/lib/money";
import { sendEmail } from "@/lib/notify";
import { SERVICE_CATEGORIES } from "@/lib/services";

import { type FormState, firstError } from "@/lib/forms";

export type { FormState };

// Xidmətlər

const durationPart = (max: number, label: string) =>
  z
    .string()
    .trim()
    .transform((v) => (v ? Number(v) : null))
    .refine((v) => v === null || (Number.isInteger(v) && v >= 0 && v <= max), `${label} 0-${max} arası tam ədəd olmalıdır`)
    .transform((v) => v || null);

const ServiceInput = z
  .object({
    title: z.string().trim().min(2, "Xidmətin adını yazın").max(100),
    category: z.string().refine((v) => SERVICE_CATEGORIES.some((c) => c.key === v), "Xidmətin növünü seçin"),
    customCategory: z.string().trim().max(40).optional().transform((v) => v || null),
    imageUrl: z.string().optional().transform((v) => v || null),
    description: z.string().trim().max(600).transform((v) => v || null),
    priceType: z.enum(["FIXED", "NEGOTIABLE"]),
    amount: z.string().trim(),
    currency: z.string().refine(isCurrency, "Valyuta düzgün deyil"),
    durationDays: durationPart(31, "Gün"),
    durationWeeks: durationPart(52, "Həftə"),
    durationMonths: durationPart(36, "Ay"),
  })
  .transform(({ amount, ...rest }, ctx) => {
    if (rest.category === "other" && !rest.customCategory) {
      ctx.addIssue({ code: "custom", message: "“Digər” üçün xidmətin növünü yazın" });
      return z.NEVER;
    }
    if (rest.category !== "other") rest.customCategory = null;
    const value = Number(amount.replace(",", "."));
    if (rest.priceType === "FIXED" && !(value > 0)) {
      ctx.addIssue({ code: "custom", message: "Sabit qiymətli xidmət üçün məbləğ yazın" });
      return z.NEVER;
    }
    // Strukturlu müddət yazılanda köhnə sərbəst mətn silinir
    const structured = rest.durationDays || rest.durationWeeks || rest.durationMonths;
    return { ...rest, amountQepik: amount && value > 0 ? aznToQepik(value) : null, ...(structured ? { duration: null } : {}) };
  });

export async function saveService(_: FormState, form: FormData): Promise<FormState> {
  const profile = await requirePermission("services");
  const parsed = ServiceInput.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: firstError(parsed.error) };

  // Şəkil yalnız bu satıcının yüklədiyi fayl ola bilər; dəyişəndə köhnəsi silinir
  const data = { ...parsed.data, imageUrl: await ownedMediaUrl(profile.id, parsed.data.imageUrl) };
  const id = form.get("id");
  if (typeof id === "string" && id) {
    const before = await db.service.findFirst({ where: { id, profileId: profile.id }, select: { imageUrl: true } });
    if (before && before.imageUrl !== data.imageUrl) await deleteMediaByUrl(profile.id, before.imageUrl);
    await db.service.updateMany({ where: { id, profileId: profile.id }, data });
    await logActivity({ userId: profile.userId, email: profile.user.email, profileId: profile.id, actor: profile.actor, action: "service_update", details: parsed.data.title });
  } else {
    const count = await db.service.count({ where: { profileId: profile.id } });
    const limit = PLAN_LIMITS[profile.user.subscription?.plan ?? "FREE"].services;
    if (count >= limit) return { error: `Planınızda ən çox ${limit} xidmət əlavə etmək olar. Daha çoxu üçün yuxarı plana keçin.` };
    await db.service.create({ data: { ...data, profileId: profile.id, position: count } });
    await logActivity({ userId: profile.userId, email: profile.user.email, profileId: profile.id, actor: profile.actor, action: "service_create", details: parsed.data.title });
  }
  revalidatePath(`/${profile.username}`);
  redirect("/dashboard/services");
}

export async function toggleService(id: string) {
  const profile = await requirePermission("services");
  const service = await db.service.findFirst({ where: { id, profileId: profile.id } });
  if (!service) return;
  await db.service.update({ where: { id }, data: { isActive: !service.isActive } });
  await logActivity({ userId: profile.userId, email: profile.user.email, profileId: profile.id, actor: profile.actor, action: "service_toggle", details: `${service.title}: ${service.isActive ? "gizlədildi" : "göstərildi"}` });
  revalidatePath("/dashboard/services");
  revalidatePath(`/${profile.username}`);
}

export async function deleteService(id: string) {
  const profile = await requirePermission("services");
  const removed = await db.service.findFirst({ where: { id, profileId: profile.id }, select: { title: true, imageUrl: true } });
  await db.service.deleteMany({ where: { id, profileId: profile.id } });
  if (removed?.imageUrl) await deleteMediaByUrl(profile.id, removed.imageUrl);
  if (removed) await logActivity({ userId: profile.userId, email: profile.user.email, profileId: profile.id, actor: profile.actor, action: "service_delete", details: removed.title });
  revalidatePath("/dashboard/services");
  revalidatePath(`/${profile.username}`);
}

// Sifarişlər

export async function approveOrder(_: FormState, form: FormData): Promise<FormState> {
  const profile = await requirePermission("orders");
  const order = await db.order.findFirst({
    where: { id: String(form.get("orderId")), profileId: profile.id, status: "PENDING_APPROVAL" },
    include: { service: true },
  });
  if (!order) return { error: "Sifariş tapılmadı" };

  const amount = Number(String(form.get("amount") ?? "").replace(",", "."));
  if (!(amount > 0)) return { error: "Məbləğ yazın" };
  const dueDays = Number(form.get("dueDays") ?? 3);

  let invoiceId: string;
  try {
    const invoice = await createInvoice({
      profileId: profile.id,
      orderId: order.id,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerEmail: order.customerEmail,
      items: [
        { title: order.service?.title ?? "Xidmət", quantity: order.quantity, unitQepik: aznToQepik(amount) },
      ],
      currency: order.service?.currency ?? "AZN",
      dueAt: new Date(Date.now() + dueDays * 86_400_000),
      note: order.note,
    });
    invoiceId = invoice.id;
  } catch (error) {
    if (error instanceof InvoiceLimitError) return { error: error.message };
    throw error;
  }
  await db.order.update({ where: { id: order.id }, data: { status: "APPROVED" } });
  await logActivity({ userId: profile.userId, email: profile.user.email, profileId: profile.id, actor: profile.actor, action: "order_approve", details: `${order.customerName} · ${amount} ${order.service?.currency ?? "AZN"}` });
  redirect(`/dashboard/invoices/${invoiceId}`);
}

export async function rejectOrder(id: string) {
  const profile = await requirePermission("orders");
  await db.order.updateMany({
    where: { id, profileId: profile.id, status: "PENDING_APPROVAL" },
    data: { status: "REJECTED" },
  });
  await logActivity({ userId: profile.userId, email: profile.user.email, profileId: profile.id, actor: profile.actor, action: "order_reject" });
  revalidatePath("/dashboard", "layout");
}

// Fakturalar

const InvoiceInput = z.object({
  customerName: z.string().trim().min(2, "Müştərinin adını yazın").max(100),
  customerPhone: z
    .string()
    .transform((v) => (v.trim() ? normalizePhone(v) : ""))
    .refine((v) => v !== null, "Telefon nömrəsi düzgün deyil")
    .transform((v) => v || null),
  dueDate: z
    .string()
    .transform((v) => (v ? new Date(`${v}T23:59:59`) : null))
    .refine((d) => d === null || !Number.isNaN(d.getTime()), "Tarix düzgün deyil"),
  note: z.string().trim().max(500).transform((v) => v || null),
  currency: z.string().refine(isCurrency, "Valyuta düzgün deyil"),
  items: z
    .string()
    .transform((v) => JSON.parse(v) as unknown)
    .pipe(
      z
        .array(
          z.object({
            title: z.string().trim().min(1, "Hər sətirdə xidmətin adı olmalıdır"),
            quantity: z.coerce.number().int().min(1, "Say ən azı 1 olmalıdır"),
            unitPrice: z.coerce.number().positive("Qiymət 0-dan böyük olmalıdır"),
          }),
        )
        .min(1, "Ən azı bir sətir əlavə edin"),
    ),
});

export async function createInvoiceAction(_: FormState, form: FormData): Promise<FormState> {
  const profile = await requirePermission("invoices");
  const parsed = InvoiceInput.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const { items, dueDate, currency, ...rest } = parsed.data;

  let invoiceId: string;
  try {
    const invoice = await createInvoice({
      ...rest,
      profileId: profile.id,
      dueAt: dueDate,
      currency,
      items: items.map((i) => ({ title: i.title, quantity: i.quantity, unitQepik: aznToQepik(i.unitPrice) })),
    });
    invoiceId = invoice.id;
    await logActivity({ userId: profile.userId, email: profile.user.email, profileId: profile.id, actor: profile.actor, action: "invoice_create", details: `${invoice.number} · ${rest.customerName}` });
  } catch (error) {
    if (error instanceof InvoiceLimitError) return { error: error.message };
    throw error;
  }
  redirect(`/dashboard/invoices/${invoiceId}`);
}

export async function markInvoicePaid(id: string) {
  const profile = await requirePermission("invoices");
  const invoice = await db.invoice.findFirst({ where: { id, profileId: profile.id } });
  if (!invoice || invoice.status === "PAID" || invoice.status === "CANCELLED") return;
  await db.$transaction([
    db.invoice.update({ where: { id }, data: { status: "PAID", paidAt: new Date() } }),
    db.payment.create({
      data: { invoiceId: id, provider: "manual", amountQepik: invoice.totalQepik, status: "SUCCEEDED" },
    }),
  ]);
  await logActivity({ userId: profile.userId, email: profile.user.email, profileId: profile.id, actor: profile.actor, action: "invoice_paid", details: invoice.number });

  // Müştəri e-poçt yazıbsa, ödəniş qəbzi ona da göndərilir (kanal qoşulmayıbsa, sakitcə ötürülür)
  if (invoice.customerEmail) {
    await sendEmail({
      to: invoice.customerEmail,
      subject: `Ödəniş qəbzi: ${invoice.number}`,
      text: `Salam ${invoice.customerName}!\n\n${profile.displayName} tərəfindən ${invoice.number} nömrəli faktura üzrə ${formatMoney(invoice.totalQepik, invoice.currency)} ödənişiniz təsdiqləndi.\n\nFaktura: ${invoiceUrl(invoice.publicId)}`,
    });
  }

  // Ödəniş təsdiqləndi: satıcıya qeyd, müştəriyə isə faktura səhifəsində rəy forması açılır
  await notify({
    profileId: profile.id,
    event: "PAYMENT_CONFIRMED",
    title: `Ödəniş təsdiqləndi: ${invoice.number}`,
    body: `${invoice.customerName} üzrə ${invoice.number} nömrəli faktura ödənilmiş kimi işarələndi. Müştəri indi faktura səhifəsində rəy yaza bilər.`,
    linkPath: "/dashboard/invoices",
    entityId: invoice.id,
  });
  revalidatePath(`/dashboard/invoices/${id}`);
  revalidatePath(`/i/${invoice.publicId}`);
}

export async function cancelInvoice(id: string) {
  const profile = await requirePermission("invoices");
  await db.invoice.updateMany({
    where: { id, profileId: profile.id, status: { notIn: ["PAID", "CANCELLED"] } },
    data: { status: "CANCELLED" },
  });
  await logActivity({ userId: profile.userId, email: profile.user.email, profileId: profile.id, actor: profile.actor, action: "invoice_cancel", details: id });
  revalidatePath(`/dashboard/invoices/${id}`);
}

export async function reopenInvoice(id: string) {
  const profile = await requirePermission("invoices");
  await db.invoice.updateMany({
    where: { id, profileId: profile.id, status: "CLAIMED_PAID" },
    data: { status: "SENT" },
  });
  await logActivity({ userId: profile.userId, email: profile.user.email, profileId: profile.id, actor: profile.actor, action: "invoice_reopen", details: id });
  revalidatePath(`/dashboard/invoices/${id}`);
}

/**
 * Faktura silinir. Sətirləri, ödənişləri, xatırlatmaları və rəyi baza özü silir (cascade).
 * Aylıq limit geri qayıtmır: sayğac ayrıca saxlanılır (src/lib/invoices.ts).
 */
export async function deleteInvoice(id: string) {
  const profile = await requirePermission("invoices");
  const invoice = await db.invoice.findFirst({
    where: { id, profileId: profile.id },
    select: { id: true, number: true, publicId: true, status: true, totalQepik: true, currency: true, review: { select: { id: true } } },
  });
  if (!invoice) return;
  await db.invoice.delete({ where: { id: invoice.id } });
  // Rəy də silindi: satıcının reytinqi yenidən hesablanır
  if (invoice.review) await refreshRating(profile.id);
  // Silinmə (xüsusən ödənilmiş fakturada, bax FR-FAK-11) geri qaytarılmır: məbləğ və rəyin
  // olub-olmaması jurnalda qalır ki, sonradan "niyə gəlir dəyişdi" sualına cavab tapılsın.
  const details = [
    invoice.number,
    invoice.status === "PAID" ? `ÖDƏNİLMİŞ · ${formatMoney(invoice.totalQepik, invoice.currency)}` : null,
    invoice.review ? "rəy də silindi" : null,
  ].filter(Boolean).join(" · ");
  await logActivity({ userId: profile.userId, email: profile.user.email, profileId: profile.id, actor: profile.actor, action: "invoice_delete", details });
  revalidatePath("/dashboard/invoices");
  revalidatePath("/dashboard");
  revalidatePath(`/i/${invoice.publicId}`);
  redirect("/dashboard/invoices");
}
