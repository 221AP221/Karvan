import type { LucideIcon } from "lucide-react";
import type { ComponentProps } from "react";

export const authInputClass =
  "h-12 w-full rounded-xl border border-gray-200 bg-white text-[15px] outline-none transition placeholder:text-gray-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10";

export function AuthField({ label, icon: Icon, hint, ...props }: ComponentProps<"input"> & { label: string; icon?: LucideIcon; hint?: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-gray-700">{label}</span>
      <span className="relative block">
        {Icon && <Icon size={16} strokeWidth={1.75} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden />}
        <input {...props} className={`${authInputClass} ${Icon ? "pl-10" : "pl-3.5"} pr-3.5 ${props.className ?? ""}`} />
      </span>
      {hint && <span className="mt-1 block text-xs text-gray-500">{hint}</span>}
    </label>
  );
}
