import { CreditCard } from "lucide-react";
import { PLAN_NAMES } from "@/lib/plans";

export function PlanBanner({ plan, title, text }: { plan: "PRO" | "PRO_MAX"; title: string; text: string }) {
  return (
    <div className="mt-6 flex items-start gap-3 rounded-xl border border-violet-200 bg-violet-50 p-3 text-sm text-violet-900 dark:border-violet-400/30 dark:bg-violet-500/10 dark:text-violet-100">
      <CreditCard size={18} className="mt-0.5 shrink-0" aria-hidden />
      <p>
        {title}: <strong>{PLAN_NAMES[plan]}</strong>. {text}
      </p>
    </div>
  );
}
