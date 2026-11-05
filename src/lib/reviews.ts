import { db } from "@/lib/db";

/**
 * Müştəri rəyləri (FR-KAT-09).
 *
 * Rəy yalnız ödənilmiş fakturaya görə yazıla bilər və hər fakturaya bir dəfə —
 * bu, saxta rəylərin qarşısını alır, çünki faktura linkini yalnız real müştəri bilir.
 */

export const RATING_MIN = 1;
export const RATING_MAX = 5;
export const COMMENT_MAX = 600;

/** Ad səhifədə tam göstərilmir: "Nərmin Əliyeva" → "Nərmin Ə." */
export function maskName(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1].charAt(0).toUpperCase()}.`;
}

/** Satıcının reytinq xülasəsini yenidən hesablayır (gizlədilmiş rəylər sayılmır). */
export async function refreshRating(profileId: string) {
  const stats = await db.review.aggregate({
    where: { profileId, hidden: false },
    _avg: { rating: true },
    _count: true,
  });
  await db.profile.update({
    where: { id: profileId },
    data: {
      ratingCount: stats._count,
      ratingAvg: stats._count > 0 && stats._avg.rating !== null ? Math.round(stats._avg.rating * 10) / 10 : null,
    },
  });
}

export type ReviewableInvoice = {
  id: string;
  profileId: string;
  customerName: string;
  serviceId: string | null;
};

/** Faktura rəy üçün açıqdırmı: ödənilib və hələ rəy yazılmayıb. */
export async function reviewableInvoice(publicId: string): Promise<{ invoice: ReviewableInvoice | null; existing: { rating: number; comment: string | null } | null }> {
  const invoice = await db.invoice.findUnique({
    where: { publicId },
    select: {
      id: true,
      profileId: true,
      customerName: true,
      status: true,
      order: { select: { serviceId: true } },
      review: { select: { rating: true, comment: true } },
    },
  });
  if (!invoice) return { invoice: null, existing: null };
  if (invoice.review) return { invoice: null, existing: invoice.review };
  if (invoice.status !== "PAID") return { invoice: null, existing: null };
  return {
    invoice: { id: invoice.id, profileId: invoice.profileId, customerName: invoice.customerName, serviceId: invoice.order?.serviceId ?? null },
    existing: null,
  };
}

/** Ulduzların mətn forması: 4.6 → "4,6" */
export const formatRating = (value: number) => value.toFixed(1).replace(".", ",");
