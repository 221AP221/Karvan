"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireProfile } from "@/lib/auth";
import { db } from "@/lib/db";
import { InvoiceLimitError, createInvoice } from "@/lib/invoices";
import { aznToQepik } from "@/lib/money";
import { RESERVED_USERNAMES, USERNAME_RE } from "@/lib/username";

export type FormState = { error?: string; ok?: boolean } | undefined;

const optional = z
  .string()
  .trim()
  .max(200)
  .transform((v) => v || null);

function firstError(error: z.ZodError) {
  return error.issues[0]?.message ?? "Məlumatlar düzgün deyil";
}

// Profil

const ProfileInput = z.object({
  displayName: z.string().trim().min(2, "Adınızı yazın").max(80),
  username: z.string().trim().toLowerCase().regex(USERNAME_RE, "İstifadəçi adı 3-30 simvol: a-z, 0-9, _ və ."),
  bio: z.string().trim().max(300).transform((v) => v || null),
  city: optional,
  avatarUrl: z.union([z.literal(""), z.url("Şəkil linki düzgün deyil")]).transform((v) => v || null),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  invoicePrefix: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{2,6}$/, "Prefiks 2-6 hərf/rəqəm olmalıdır"),
  accountName: optional,
  bankName: optional,
  cardNumber: optional,
  iban: z
    .string()
    .trim()
    .toUpperCase()
    .transform((v) => v.replace(/\s/g, "") || null)
    .refine((v) => v === null || /^AZ\d{2}[A-Z0-9]{24}$/.test(v), "IBAN AZ ilə başlamalı və 28 simvol olmalıdır"),
});

export async function updateProfile(_: FormState, form: FormData): Promise<FormState> {
  const profile = await requireProfile();
  const parsed = ProfileInput.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const { primaryColor, ...data } = parsed.data;

  if (data.username !== profile.username) {
    if (RESERVED_USERNAMES.has(data.username)) return { error: "Bu ad istifadə edilə bilməz" };
    if (await db.profile.findUnique({ where: { username: data.username } })) {
      return { error: "Bu istifadəçi adı tutulub" };
    }
  }

  const theme = { ...((profile.theme as object | null) ?? {}), primary: primaryColor };
  await db.profile.update({ where: { id: profile.id }, data: { ...data, theme } });
  revalidatePath("/dashboard", "layout");
  revalidatePath(`/${data.username}`);
  return { ok: true };
}

const LinkInput = z.object({
  platform: z.enum(["INSTAGRAM", "TIKTOK", "WHATSAPP", "TELEGRAM", "YOUTUBE", "CUSTOM"]),
  label: optional,
  url: z.url("Link düzgün deyil"),
});

export async function addSocialLink(_: FormState, form: FormData): Promise<FormState> {
  const profile = await requireProfile();
  const parsed = LinkInput.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const count = await db.socialLink.count({ where: { profileId: profile.id } });
  await db.socialLink.create({ data: { ...parsed.data, profileId: profile.id, position: count } });
  revalidatePath("/dashboard/profile");
  return { ok: true };
}

export async function deleteSocialLink(id: string) {
  const profile = await requireProfile();
  await db.socialLink.deleteMany({ where: { id, profileId: profile.id } });
  revalidatePath("/dashboard/profile");
}

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
