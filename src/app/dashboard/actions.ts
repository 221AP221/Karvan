"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireProfile } from "@/lib/auth";
import { db } from "@/lib/db";
import { InvoiceLimitError, createInvoice } from "@/lib/invoices";
import { aznToQepik } from "@/lib/money";

import { type FormState, firstError, optional } from "@/lib/forms";

export type { FormState };

// Xidmətlər

const ServiceInput = z
  .object({
    title: z.string().trim().min(2, "Xidmətin adını yazın").max(100),
    description: z.string().trim().max(600).transform((v) => v || null),
    priceType: z.enum(["FIXED", "NEGOTIABLE"]),
    amount: z.string().trim(),
    duration: optional,
  })
  .transform(({ amount, ...rest }, ctx) => {
    const value = Number(amount.replace(",", "."));
    if (rest.priceType === "FIXED" && !(value > 0)) {
      ctx.addIssue({ code: "custom", message: "Sabit qiymətli xidmət üçün məbləğ yazın" });
      return z.NEVER;
    }
    return { ...rest, amountQepik: amount && value > 0 ? aznToQepik(value) : null };
  });

export async function saveService(_: FormState, form: FormData): Promise<FormState> {
  const profile = await requireProfile();
  const parsed = ServiceInput.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: firstError(parsed.error) };

  const id = form.get("id");
  if (typeof id === "string" && id) {
    await db.service.updateMany({ where: { id, profileId: profile.id }, data: parsed.data });
  } else {
    const count = await db.service.count({ where: { profileId: profile.id } });
    await db.service.create({ data: { ...parsed.data, profileId: profile.id, position: count } });
  }
  revalidatePath(`/${profile.username}`);
  redirect("/dashboard/services");
}

export async function toggleService(id: string) {
  const profile = await requireProfile();
  const service = await db.service.findFirst({ where: { id, profileId: profile.id } });
  if (!service) return;
  await db.service.update({ where: { id }, data: { isActive: !service.isActive } });
  revalidatePath("/dashboard/services");
  revalidatePath(`/${profile.username}`);
}

export async function deleteService(id: string) {
  const profile = await requireProfile();
  await db.service.deleteMany({ where: { id, profileId: profile.id } });
  revalidatePath("/dashboard/services");
  revalidatePath(`/${profile.username}`);
}

// Sifarişlər

export async function approveOrder(_: FormState, form: FormData): Promise<FormState> {
  const profile = await requireProfile();
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
      dueAt: new Date(Date.now() + dueDays * 86_400_000),
      note: order.note,
    });
    invoiceId = invoice.id;
  } catch (error) {
    if (error instanceof InvoiceLimitError) return { error: error.message };
    throw error;
  }
  await db.order.update({ where: { id: order.id }, data: { status: "APPROVED" } });
  redirect(`/dashboard/invoices/${invoiceId}`);
}

export async function rejectOrder(id: string) {
  const profile = await requireProfile();
  await db.order.updateMany({
    where: { id, profileId: profile.id, status: "PENDING_APPROVAL" },
    data: { status: "REJECTED" },
  });
  revalidatePath("/dashboard", "layout");
}

// Fakturalar

const InvoiceInput = z.object({
  customerName: z.string().trim().min(2, "Müştərinin adını yazın").max(100),
  customerPhone: z
    .string()
    .transform((v) => v.replace(/[\s()-]/g, "") || null)
    .refine((v) => v === null || /^(\+994|0)\d{9}$/.test(v), "Telefon nömrəsi düzgün deyil"),
  dueDate: z
    .string()
    .transform((v) => (v ? new Date(`${v}T23:59:59`) : null))
    .refine((d) => d === null || !Number.isNaN(d.getTime()), "Tarix düzgün deyil"),
  note: z.string().trim().max(500).transform((v) => v || null),
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
  const profile = await requireProfile();
  const parsed = InvoiceInput.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const { items, dueDate, ...rest } = parsed.data;

  let invoiceId: string;
  try {
    const invoice = await createInvoice({
      ...rest,
      profileId: profile.id,
      dueAt: dueDate,
      items: items.map((i) => ({ title: i.title, quantity: i.quantity, unitQepik: aznToQepik(i.unitPrice) })),
    });
    invoiceId = invoice.id;
  } catch (error) {
    if (error instanceof InvoiceLimitError) return { error: error.message };
    throw error;
  }
  redirect(`/dashboard/invoices/${invoiceId}`);
}

export async function markInvoicePaid(id: string) {
  const profile = await requireProfile();
  const invoice = await db.invoice.findFirst({ where: { id, profileId: profile.id } });
  if (!invoice || invoice.status === "PAID" || invoice.status === "CANCELLED") return;
  await db.$transaction([
    db.invoice.update({ where: { id }, data: { status: "PAID", paidAt: new Date() } }),
    db.payment.create({
      data: { invoiceId: id, provider: "manual", amountQepik: invoice.totalQepik, status: "SUCCEEDED" },
    }),
  ]);
  revalidatePath(`/dashboard/invoices/${id}`);
}

export async function cancelInvoice(id: string) {
  const profile = await requireProfile();
  await db.invoice.updateMany({
    where: { id, profileId: profile.id, status: { notIn: ["PAID", "CANCELLED"] } },
    data: { status: "CANCELLED" },
  });
  revalidatePath(`/dashboard/invoices/${id}`);
}

export async function reopenInvoice(id: string) {
  const profile = await requireProfile();
  await db.invoice.updateMany({
    where: { id, profileId: profile.id, status: "CLAIMED_PAID" },
    data: { status: "SENT" },
  });
  revalidatePath(`/dashboard/invoices/${id}`);
}
