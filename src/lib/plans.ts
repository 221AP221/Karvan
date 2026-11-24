import type { Plan } from "@/generated/prisma/client";

// Planların imkanları. Qiymətlər AZN/ay; ödəniş qəbulu hələ qoşulmayıb ("Tezliklə").
export const PLAN_LIMITS: Record<
  Plan,
  {
    invoicesPerMonth: number;
    services: number;
    aiRequestsPerMonth: number;
    onlinePayments: boolean;
    branding: boolean; // səhifədə və PDF-də "Karvan ilə yaradılıb"
    verified: boolean; // təsdiqlənmiş nişanı
    featured: boolean; // kataloqda önə çıxma
    reports: boolean; // analitika hesabatının ixracı
    teamMembers: number;
  }
> = {
  // Limit 5-dən 25-ə qaldırılıb (BRD §31 Q-08) — dolduqda faktura silinmir, qaralama kimi qalır (FR-FAK-16)
  FREE: { invoicesPerMonth: 25, services: 5, aiRequestsPerMonth: 10, onlinePayments: false, branding: true, verified: false, featured: false, reports: false, teamMembers: 1 },
  PRO: { invoicesPerMonth: 100, services: 30, aiRequestsPerMonth: 200, onlinePayments: true, branding: false, verified: true, featured: false, reports: false, teamMembers: 1 },
  PRO_MAX: { invoicesPerMonth: Infinity, services: Infinity, aiRequestsPerMonth: 1000, onlinePayments: true, branding: false, verified: true, featured: true, reports: true, teamMembers: 5 },
};

export const PLAN_NAMES: Record<Plan, string> = { FREE: "Pulsuz", PRO: "Pro", PRO_MAX: "Pro Max" };

export const PLAN_PRICES: Record<Plan, string> = { FREE: "0", PRO: "9,99", PRO_MAX: "29,99" };

export function startOfMonth(date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}
