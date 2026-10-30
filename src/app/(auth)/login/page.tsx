import { CheckCircle2 } from "lucide-react";
import { redirect } from "next/navigation";
import { PlanBanner } from "@/components/auth/PlanBanner";
import { getCurrentProfile } from "@/lib/auth";
import { isPaidPlan } from "@/lib/billing";
import { checkoutPath } from "@/lib/plan-intent";
import { getDictionary, getLocale } from "@/i18n/server";
import { type SearchParams, param } from "@/lib/search-params";
import { LoginForm } from "./LoginForm";

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const reset = param(sp, "reset") === "1";
  const plan = param(sp, "plan");
  if (checkoutPath(plan) && (await getCurrentProfile())) redirect(checkoutPath(plan)!);
  const a = getDictionary(await getLocale()).auth;
  return (
    <>
      <h1 className="text-3xl font-bold">{a.login.title}</h1>
      <p className="mt-2 text-gray-500 dark:text-gray-400">{a.login.text}</p>
      {reset && (
        <p className="mt-6 flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200">
          <CheckCircle2 size={17} aria-hidden /> {a.login.resetDone}
        </p>
      )}
      {isPaidPlan(plan) && <PlanBanner plan={plan} title={a.planChosen} text={a.planNext} />}
      <LoginForm t={a.login} password={a.password} plan={isPaidPlan(plan) ? plan : undefined} />
    </>
  );
}
