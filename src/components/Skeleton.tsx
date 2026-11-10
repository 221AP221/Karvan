// Səhifə açılana qədər göstərilən boş sxem. Keçid dərhal görünsün deyə loading.tsx fayllarında işlənir.
// Yüngül olmalıdır: heç bir sorğu, heç bir müştəri komponenti.

export function SkeletonLine({ className = "" }: { className?: string }) {
  return <div className={`h-4 animate-pulse rounded bg-gray-200 dark:bg-white/10 ${className}`} />;
}

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.03]">
      <SkeletonLine className="mb-4 w-40" />
      <div className="flex flex-col gap-2.5">
        {Array.from({ length: lines }, (_, i) => (
          <SkeletonLine key={i} className={i === lines - 1 ? "w-2/3" : "w-full"} />
        ))}
      </div>
    </section>
  );
}

/** Başlıq + statistika zolağı + siyahı: panelin əksər səhifələrinin ümumi görünüşü. */
export function PageSkeleton({ stats = 4, rows = 6 }: { stats?: number; rows?: number }) {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">Yüklənir…</span>
      <SkeletonLine className="mb-2 h-7 w-48" />
      <SkeletonLine className="mb-6 w-72" />

      {stats > 0 && (
        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: stats }, (_, i) => (
            <div key={i} className="rounded-2xl border border-gray-200 bg-white p-4">
              <SkeletonLine className="mb-3 w-24" />
              <SkeletonLine className="h-7 w-16" />
            </div>
          ))}
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex items-center justify-between gap-4 border-b border-gray-100 px-5 py-4 last:border-0">
            <div className="min-w-0 flex-1">
              <SkeletonLine className="mb-2 w-1/3" />
              <SkeletonLine className="h-3 w-1/4" />
            </div>
            <SkeletonLine className="h-6 w-20 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
