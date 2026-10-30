import { redirect } from "next/navigation";
import { PlanBanner } from "@/components/auth/PlanBanner";
import { getDictionary, getLocale } from "@/i18n/server";
import { getCurrentProfile } from "@/lib/auth";
import { isPaidPlan } from "@/lib/billing";
import { checkoutPath } from "@/lib/plan-intent";
import { type SearchParams, param } from "@/lib/search-params";
import { SignupForm } from "./SignupForm";

export default async function SignupPage({ searchParams }: { searchParams: SearchParams }) {
  const plan = param(await searchParams, "plan");
  // Artıq daxil olubsa, paket seçimi birbaşa ödənişə aparır
  if (checkoutPath(plan) && (await getCurrentProfile())) redirect(checkoutPath(plan)!);
  const a = getDictionary(await getLocale()).auth;
  return (
    <>
      <h1 className="text-3xl font-bold">{a.signup.title}</h1>
      <p className="mt-2 text-gray-500 dark:text-gray-400">{a.signup.text}</p>
      {isPaidPlan(plan) && <PlanBanner plan={plan} title={a.planChosen} text={a.planNext} />}
      <SignupForm t={a.signup} password={a.password} plan={isPaidPlan(plan) ? plan : undefined} />
    </>
  );
}
