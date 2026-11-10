import { SkeletonCard, SkeletonLine } from "@/components/Skeleton";

// Satıcı səhifəsi: kataloqdan keçid dərhal görünsün
export default function Loading() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10" aria-busy="true">
      <span className="sr-only">Yüklənir…</span>
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="h-24 w-24 animate-pulse rounded-full bg-gray-200 dark:bg-white/10" />
        <SkeletonLine className="h-6 w-48" />
        <SkeletonLine className="w-64" />
      </div>
      <div className="flex flex-col gap-4">
        <SkeletonCard lines={2} />
        <SkeletonCard lines={2} />
        <SkeletonCard lines={2} />
      </div>
    </div>
  );
}
