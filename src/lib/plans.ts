import type { Plan } from "@/generated/prisma/client";

export const PLAN_LIMITS: Record<
  Plan,
  { invoicesPerMonth: number; aiRequestsPerMonth: number; onlinePayments: boolean; branding: boolean }
> = {
  FREE: { invoicesPerMonth: 5, aiRequestsPerMonth: 10, onlinePayments: false, branding: true },
  PRO: { invoicesPerMonth: Infinity, aiRequestsPerMonth: 500, onlinePayments: true, branding: false },
};

export function startOfMonth(date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}
