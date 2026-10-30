import { isPaidPlan } from "@/lib/billing";

// Ana səhifədə seçilmiş ödənişli paket: girişdən sonra birbaşa həmin paketin ödəniş səhifəsi açılır
export function checkoutPath(plan: unknown): string | null {
  return isPaidPlan(plan) ? `/dashboard/billing/checkout?plan=${plan}` : null;
}
