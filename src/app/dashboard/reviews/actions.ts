"use server";

import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/activity";
import { requirePermission, requireProfile } from "@/lib/auth";
import { db } from "@/lib/db";
import type { FormState } from "@/lib/forms";

const REPLY_MAX = 600;

/** Satıcı rəyə bir dəfə cavab yazır; cavab səhifədə rəyin altında görünür. */
export async function replyToReview(_: FormState, form: FormData): Promise<FormState> {
  const profile = await requirePermission("reviews");
  const id = String(form.get("id") ?? "");
  const reply = String(form.get("reply") ?? "").trim().slice(0, REPLY_MAX);

  const review = await db.review.findFirst({ where: { id, profileId: profile.id }, select: { id: true } });
  if (!review) return { error: "Rəy tapılmadı" };

  await db.review.update({
    where: { id: review.id },
    data: reply ? { reply, repliedAt: new Date() } : { reply: null, repliedAt: null },
  });
  await logActivity({ userId: profile.userId, email: profile.user.email, profileId: profile.id, actor: profile.actor, action: "review_reply", details: id });
  revalidatePath("/dashboard/reviews");
  revalidatePath(`/${profile.username}`);
  return { ok: true };
}
