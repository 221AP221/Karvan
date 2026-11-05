"use server";

import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/activity";
import { db } from "@/lib/db";
import type { FormState } from "@/lib/forms";
import { notify } from "@/lib/notifications";
import { LIMITS, limitByIp } from "@/lib/rate-limit";
import { COMMENT_MAX, RATING_MAX, RATING_MIN, maskName, refreshRating, reviewableInvoice } from "@/lib/reviews";

/**
 * Müştərinin rəyi. Qeydiyyat tələb olunmur: faktura linki özü sübutdur —
 * yalnız ödənilmiş fakturaya və hər fakturaya bir dəfə yazıla bilər.
 */
export async function submitReview(_: FormState, form: FormData): Promise<FormState> {
  if (!(await limitByIp("review", LIMITS.review.max, LIMITS.review.windowMs)).ok) {
    return { error: "Çox sayda cəhd oldu. Bir az sonra yenidən yoxlayın." };
  }

  const publicId = String(form.get("publicId") ?? "");
  const rating = Number(form.get("rating"));
  const comment = String(form.get("comment") ?? "").trim().slice(0, COMMENT_MAX);

  if (!Number.isInteger(rating) || rating < RATING_MIN || rating > RATING_MAX) {
    return { error: "Qiyməti seçin (1-5 ulduz)" };
  }

  const { invoice, existing } = await reviewableInvoice(publicId);
  if (existing) return { error: "Bu faktura üçün rəy artıq yazılıb" };
  if (!invoice) return { error: "Rəy yalnız ödənişi təsdiqlənmiş faktura üçün yazıla bilər" };

  await db.review.create({
    data: {
      profileId: invoice.profileId,
      invoiceId: invoice.id,
      serviceId: invoice.serviceId,
      rating,
      comment: comment || null,
      customerName: invoice.customerName,
    },
  });
  await refreshRating(invoice.profileId);

  const seller = await db.profile.findUnique({ where: { id: invoice.profileId }, select: { userId: true, username: true, user: { select: { email: true } } } });
  await logActivity({ userId: seller?.userId, email: seller?.user.email, action: "review_received", details: `${rating}★ · ${invoice.customerName}` });
  await notify({
    profileId: invoice.profileId,
    event: "REVIEW_NEW",
    title: `Yeni rəy: ${rating} ulduz`,
    body: `${maskName(invoice.customerName)} sizə ${rating} ulduz verdi.${comment ? `\n“${comment}”` : ""}`,
    linkPath: "/dashboard/reviews",
  });

  if (seller) revalidatePath(`/${seller.username}`);
  return { ok: true };
}
