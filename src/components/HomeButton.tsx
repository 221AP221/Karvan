import { ArrowLeft } from "lucide-react";
import Link from "next/link";

// İctimai səhifələrin sol yuxarısında: Karvan ana səhifəsinə qayıtmaq üçün.
// `label`/`ariaLabel` könüllüdür: çağıran dilə görə mətn ötürə bilər, verilməsə köhnə defolt qalır.
export function HomeButton({ className = "", label = "Ana səhifə", ariaLabel = "Karvan ana səhifəsinə qayıt" }: { className?: string; label?: string; ariaLabel?: string }) {
  return (
    <Link
      href="/"
      aria-label={ariaLabel}
      className={`group inline-flex items-center gap-2 rounded-full bg-white/90 py-1.5 pl-3 pr-4 text-sm font-medium text-gray-800 shadow-lg shadow-black/10 ring-1 ring-black/5 backdrop-blur transition hover:bg-white ${className}`}
    >
      <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-0.5" aria-hidden />
      <span>{label}</span>
    </Link>
  );
}
