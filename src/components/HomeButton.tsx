import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { KarvanMark } from "@/components/Logo";

// İctimai səhifələrin sol yuxarısında: Karvan ana səhifəsinə qayıtmaq üçün
export function HomeButton({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="Karvan ana səhifəsinə qayıt"
      className={`group inline-flex items-center gap-2 rounded-full bg-white/90 py-1.5 pl-2 pr-4 text-sm font-medium text-gray-800 shadow-lg shadow-black/10 ring-1 ring-black/5 backdrop-blur transition hover:bg-white ${className}`}
    >
      <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-0.5" aria-hidden />
      <KarvanMark className="h-6 w-6" />
      <span>Ana səhifə</span>
    </Link>
  );
}
