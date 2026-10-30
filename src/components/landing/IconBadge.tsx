import type { LucideIcon } from "lucide-react";

const SIZES = {
  sm: { box: "h-9 w-9 rounded-xl", icon: 18 },
  md: { box: "h-12 w-12 rounded-2xl", icon: 22 },
  lg: { box: "h-14 w-14 rounded-2xl", icon: 26 },
};

// Premium ikon nişanı: incə qradiyent çərçivə, daxili parıltı, vahid xətt qalınlığı.
export function IconBadge({
  icon: Icon,
  size = "md",
  tone = "brand",
}: {
  icon: LucideIcon;
  size?: keyof typeof SIZES;
  tone?: "brand" | "solid" | "success" | "dark" | "info";
}) {
  const s = SIZES[size];
  const tones = {
    brand:
      "bg-gradient-to-b from-white to-violet-50 text-violet-600 ring-1 ring-violet-200/70 shadow-[0_1px_0_0_rgba(255,255,255,0.9)_inset,0_8px_20px_-8px_rgba(109,40,217,0.35)]",
    solid:
      "bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white ring-1 ring-white/20 shadow-[0_1px_0_0_rgba(255,255,255,0.35)_inset,0_10px_24px_-8px_rgba(147,51,234,0.6)]",
    success:
      "bg-gradient-to-b from-white to-emerald-50 text-emerald-600 ring-1 ring-emerald-200/70 shadow-[0_8px_20px_-10px_rgba(5,150,105,0.45)]",
    info: "bg-gradient-to-b from-white to-sky-50 text-sky-600 ring-1 ring-sky-200/70 shadow-[0_8px_20px_-10px_rgba(2,132,199,0.45)]",
    dark: "bg-gradient-to-b from-white/15 to-white/5 text-violet-200 ring-1 ring-white/15 shadow-[0_1px_0_0_rgba(255,255,255,0.15)_inset]",
  };
  return (
    <span className={`grid shrink-0 place-items-center ${s.box} ${tones[tone]}`}>
      <Icon size={s.icon} strokeWidth={1.75} aria-hidden />
    </span>
  );
}
