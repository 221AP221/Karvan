import type { Prisma } from "@/generated/prisma/client";
import { dayEnd, dayStart } from "@/lib/search-params";

// Admin siyahıları və ixrac eyni filtrləri işlədir (ekranda görünən = Excel-ə düşən)
type P = Record<string, string>;

export function usersWhere(p: P): Prisma.UserWhereInput {
  const q = p.q ?? "";
  return {
    ...(q && {
      OR: [
        { email: { contains: q, mode: "insensitive" } },
        { firstName: { contains: q, mode: "insensitive" } },
        { lastName: { contains: q, mode: "insensitive" } },
        { phone: { contains: q.replace(/\s/g, "") } },
        { profile: { username: { contains: q.toLowerCase() } } },
        { profile: { displayName: { contains: q, mode: "insensitive" } } },
      ],
    }),
    ...(["FREE", "PRO", "PRO_MAX"].includes(p.plan ?? "") && { subscription: { plan: p.plan as "FREE" | "PRO" | "PRO_MAX" } }),
    ...(p.status === "blocked" && { blockedAt: { not: null } }),
    ...(p.status === "active" && { blockedAt: null, role: "USER" }),
    ...(p.status === "admin" && { role: "ADMIN" }),
  };
}

const range = (p: P) => {
  const from = dayStart(p.from ?? "");
  const to = dayEnd(p.to ?? "");
  return from || to ? { createdAt: { ...(from && { gte: from }), ...(to && { lte: to }) } } : {};
};

export function activityWhere(p: P): Prisma.ActivityLogWhereInput {
  return {
    ...(p.q && { OR: [{ email: { contains: p.q, mode: "insensitive" } }, { details: { contains: p.q, mode: "insensitive" } }, { ip: { contains: p.q } }] }),
    ...(p.action && { action: p.action }),
    ...(p.user && { userId: p.user }),
    ...range(p),
  };
}

export function adminLogWhere(p: P): Prisma.AdminLogWhereInput {
  return {
    ...(p.q && { OR: [{ adminEmail: { contains: p.q, mode: "insensitive" } }, { details: { contains: p.q, mode: "insensitive" } }] }),
    ...(p.action && { action: p.action }),
    ...(p.user && { targetId: p.user }),
    ...range(p),
  };
}

export const flat = (sp: Record<string, string | string[] | undefined>): P =>
  Object.fromEntries(Object.entries(sp).flatMap(([k, v]) => (typeof v === "string" && v.trim() ? [[k, v.trim()]] : [])));
