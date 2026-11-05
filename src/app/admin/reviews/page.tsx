import { EyeOff, Star } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { FilterBar } from "@/components/FilterBar";
import { Stars } from "@/components/Rating";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { type SearchParams, param } from "@/lib/search-params";
import { Kpi, PageTitle, dateTime } from "../ui";
import { ModerateReview } from "./ui";

export const metadata: Metadata = { title: "Rəylər" };

export default async function AdminReviews({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin();
  const sp = await searchParams;
  const q = param(sp, "q");
  const status = param(sp, "status");

  const where = {
    ...(q && {
      OR: [
        { comment: { contains: q, mode: "insensitive" as const } },
        { customerName: { contains: q, mode: "insensitive" as const } },
        { profile: { username: { contains: q.toLowerCase() } } },
      ],
    }),
    ...(status === "hidden" && { hidden: true }),
    ...(status === "visible" && { hidden: false }),
    ...(status === "low" && { rating: { lte: 2 } }),
  };

  const [total, reviews, hiddenCount, lowCount] = await Promise.all([
    db.review.count({ where }),
    db.review.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { profile: { select: { username: true, displayName: true } }, invoice: { select: { number: true } } },
    }),
    db.review.count({ where: { hidden: true } }),
    db.review.count({ where: { rating: { lte: 2 }, hidden: false } }),
  ]);

  return (
    <div>
      <PageTitle title="Rəylər" text="Qaydalara zidd rəyi gizlədin: gizlədilən rəy satıcının səhifəsindən çıxır və reytinqə təsir etmir" />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Kpi icon={Star} label="Ümumi rəy" value={String(total)} />
        <Kpi icon={EyeOff} label="Gizlədilib" value={String(hiddenCount)} href="/admin/reviews?status=hidden" />
        <Kpi icon={Star} label="Aşağı qiymət (≤2)" value={String(lowCount)} href="/admin/reviews?status=low" hint="Şikayət ehtimalı" />
      </div>

      <FilterBar
        total={total}
        fields={[
          { type: "search", name: "q", placeholder: "Mətn, müştəri adı və ya səhifə ünvanı..." },
          {
            type: "select",
            name: "status",
            label: "Status",
            options: [
              { value: "", label: "Hamısı" },
              { value: "visible", label: "Görünən" },
              { value: "hidden", label: "Gizlədilmiş" },
              { value: "low", label: "Aşağı qiymət" },
            ],
          },
        ]}
      />

      <ul className="mt-4 flex flex-col gap-3">
        {reviews.map((review) => (
          <li key={review.id} className={`rounded-2xl border bg-white p-5 ${review.hidden ? "border-red-200" : "border-gray-200"}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="flex flex-wrap items-center gap-2">
                <Stars value={review.rating} />
                <span className="font-medium">{review.customerName}</span>
                <span className="text-sm text-gray-500">→</span>
                <Link href={`/${review.profile.username}`} target="_blank" className="text-sm font-medium text-[var(--brand)] hover:underline">
                  @{review.profile.username}
                </Link>
              </span>
              <span className="text-xs text-gray-400">
                {review.invoice.number} · {dateTime(review.createdAt)}
              </span>
            </div>
            {review.comment && <p className="mt-2 whitespace-pre-line text-gray-700">{review.comment}</p>}
            {review.reply && <p className="mt-2 rounded-lg bg-gray-50 p-3 text-sm text-gray-600">Satıcının cavabı: {review.reply}</p>}
            {review.hidden && review.hiddenReason && <p className="mt-2 text-sm text-red-700">Gizlətmə səbəbi: {review.hiddenReason}</p>}
            <ModerateReview id={review.id} hidden={review.hidden} />
          </li>
        ))}
      </ul>

      {reviews.length === 0 && <p className="mt-6 rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-500">Rəy tapılmadı.</p>}
    </div>
  );
}
