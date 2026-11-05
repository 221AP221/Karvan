import { Star } from "lucide-react";
import { formatRating } from "@/lib/reviews";

/** Ulduz sırası: yarım ulduz üçün doldurulmuş hissə maska ilə göstərilir. */
export function Stars({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-0.5" aria-hidden>
      {[1, 2, 3, 4, 5].map((n) => {
        const fill = Math.max(0, Math.min(1, value - (n - 1)));
        return (
          <span key={n} className="relative inline-block" style={{ width: size, height: size }}>
            <Star size={size} strokeWidth={1.75} className="absolute inset-0 text-gray-300" />
            {fill > 0 && (
              <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                <Star size={size} strokeWidth={1.75} className="fill-amber-400 text-amber-400" />
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
}

export function RatingBadge({
  value,
  count,
  size = 16,
  label,
  className = "",
}: {
  value: number;
  count: number;
  size?: number;
  label: string;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-sm ${className}`} title={`${formatRating(value)} / 5 · ${count} ${label}`}>
      <Stars value={value} size={size} />
      <span className="font-semibold tabular-nums">{formatRating(value)}</span>
      <span className="text-gray-500">
        ({count} {label})
      </span>
    </span>
  );
}
