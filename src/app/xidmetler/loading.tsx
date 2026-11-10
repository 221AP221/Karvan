import { SkeletonLine } from "@/components/Skeleton";

// Kataloq: filtrlər və kartlar üçün boş sxem
export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10" aria-busy="true">
      <span className="sr-only">Yüklənir…</span>
      <SkeletonLine className="mb-3 h-8 w-72" />
      <SkeletonLine className="mb-8 w-96" />
      <div className="mb-6 flex flex-wrap gap-2">
        {Array.from({ length: 5 }, (_, i) => (
          <SkeletonLine key={i} className="h-9 w-28 rounded-full" />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.03]">
            <SkeletonLine className="mb-3 h-5 w-2/3" />
            <SkeletonLine className="mb-2 w-full" />
            <SkeletonLine className="w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}
