import { MessageSquareQuote, Star, TrendingUp } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Stars } from "@/components/Rating";
import { requireProfile } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatRating, maskName } from "@/lib/reviews";
import { ReplyForm } from "./ui";

export const metadata: Metadata = { title: "Rəylər" };

export default async function ReviewsPage() {
  const profile = await requireProfile();
  const reviews = await db.review.findMany({
    where: { profileId: profile.id },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { service: { select: { title: true } }, invoice: { select: { number: true } } },
  });

  const visible = reviews.filter((r) => !r.hidden);
  // Ulduz bölgüsü: 5-dən 1-ə
  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: visible.filter((r) => r.rating === star).length,
  }));
  const max = Math.max(1, ...distribution.map((d) => d.count));
  const unanswered = visible.filter((r) => !r.reply).length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Rəylər</h1>
        <p className="text-sm text-gray-500">
          Rəyi yalnız ödənişi təsdiqlənmiş müştəri yaza bilər. Rəylər{" "}
          <Link href={`/${profile.username}`} target="_blank" className="underline">
            səhifənizdə
          </Link>{" "}
          və kataloqda göstərilir.
        </p>
      </div>

      {visible.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-500">
          Hələ rəy yoxdur. Müştəri fakturanı ödəyib siz təsdiqlədikdən sonra ona rəy yazmaq təklif olunur.
        </p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-[220px_1fr]">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 text-center">
              <p className="text-4xl font-bold tabular-nums">{profile.ratingAvg !== null ? formatRating(profile.ratingAvg) : "—"}</p>
              <div className="mt-2 flex justify-center">
                <Stars value={profile.ratingAvg ?? 0} size={18} />
              </div>
              <p className="mt-2 text-sm text-gray-500">{profile.ratingCount} rəy</p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <ul className="space-y-2">
                {distribution.map((d) => (
                  <li key={d.star} className="flex items-center gap-3 text-sm">
                    <span className="flex w-10 shrink-0 items-center gap-1 tabular-nums">
                      {d.star} <Star size={13} className="fill-amber-400 text-amber-400" aria-hidden />
                    </span>
                    <span className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                      <span className="block h-full rounded-full bg-amber-400" style={{ width: `${(d.count / max) * 100}%` }} />
                    </span>
                    <span className="w-8 shrink-0 text-right tabular-nums text-gray-500">{d.count}</span>
                  </li>
                ))}
              </ul>
              {unanswered > 0 && (
                <p className="mt-4 flex items-center gap-2 text-sm text-gray-600">
                  <MessageSquareQuote size={15} className="text-[var(--brand)]" aria-hidden />
                  {unanswered} rəy cavabsızdır — cavab yazmaq etibarı artırır.
                </p>
              )}
            </div>
          </div>

          <ul className="flex flex-col gap-3">
            {reviews.map((review) => (
              <li key={review.id} className={`rounded-2xl border bg-white p-5 ${review.hidden ? "border-red-200 bg-red-50/40" : "border-gray-200"}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="flex items-center gap-2">
                    <Stars value={review.rating} />
                    <span className="font-medium">{maskName(review.customerName)}</span>
                    {review.service && <span className="text-sm text-gray-500">· {review.service.title}</span>}
                  </span>
                  <span className="text-xs text-gray-400">
                    {review.invoice.number} ·{" "}
                    {new Intl.DateTimeFormat("az-AZ", { day: "2-digit", month: "short", year: "numeric" }).format(review.createdAt)}
                  </span>
                </div>

                {review.hidden && (
                  <p className="mt-2 rounded-lg bg-red-100 px-3 py-2 text-sm text-red-800">
                    Bu rəy moderasiya tərəfindən gizlədilib{review.hiddenReason ? `: ${review.hiddenReason}` : ""}. Səhifənizdə görünmür.
                  </p>
                )}
                {review.comment && <p className="mt-2 whitespace-pre-line text-gray-700">{review.comment}</p>}

                <ReplyForm id={review.id} reply={review.reply} />
              </li>
            ))}
          </ul>
        </>
      )}

      <p className="flex items-start gap-2 text-xs text-gray-500">
        <TrendingUp size={14} className="mt-0.5 shrink-0" aria-hidden />
        Reytinq kataloqda sıralamaya təsir edir və axtarış nəticəsində ulduz kimi görünə bilər.
      </p>
    </div>
  );
}
