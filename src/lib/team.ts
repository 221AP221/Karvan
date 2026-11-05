import type { MemberStatus, TeamRole } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { PLAN_LIMITS } from "@/lib/plans";

/**
 * Komanda üzvlüyü və icazələr (Pro Max).
 *
 * Profil "iş sahəsi"dir: sahib + ən çoxu 4 üzv (cəmi 5) eyni səhifə üzərində işləyir.
 * Pul və identiklik yalnız sahibdədir — üzv faktura göndərə bilər, amma rekvizitləri,
 * abunəliyi və komandanı dəyişə bilmir.
 */

export const ROLE_LABELS: Record<TeamRole, string> = {
  OWNER: "Sahib",
  MANAGER: "Menecer",
  STAFF: "İşçi",
};

export const ROLE_HINTS: Record<TeamRole, string> = {
  OWNER: "Hər şey: abunəlik, rekvizitlər, komanda, hesabın silinməsi",
  MANAGER: "Xidmətlər, sifarişlər, fakturalar, analitika və rəy cavabları",
  STAFF: "Yalnız sifarişlər və fakturalar",
};

export const STATUS_LABELS: Record<MemberStatus, string> = {
  INVITED: "Dəvət göndərilib",
  ACTIVE: "Aktiv",
  SUSPENDED: "Dondurulub",
};

/** İcazə sahələri: hər biri hansı rollara açıqdır. */
export const PERMISSIONS = {
  orders: ["OWNER", "MANAGER", "STAFF"],
  invoices: ["OWNER", "MANAGER", "STAFF"],
  services: ["OWNER", "MANAGER"],
  profile: ["OWNER", "MANAGER"],
  analytics: ["OWNER", "MANAGER"],
  reviews: ["OWNER", "MANAGER"],
  ai: ["OWNER", "MANAGER"],
  notifications: ["OWNER", "MANAGER"],
  payouts: ["OWNER"], //  bank rekvizitləri
  billing: ["OWNER"], //  abunəlik və ödənişlər
  team: ["OWNER"], //     komanda idarəsi
  account: ["OWNER"], //  e-poçt, şifrə, hesabın silinməsi
} as const satisfies Record<string, readonly TeamRole[]>;

export type Permission = keyof typeof PERMISSIONS;

export const can = (role: TeamRole, permission: Permission) =>
  (PERMISSIONS[permission] as readonly TeamRole[]).includes(role);

/** Paneldəki bölmələr: üzvün rolu görə bilmədiyi bölməni gizlədirik. */
export const NAV_PERMISSION: Record<string, Permission> = {
  "/dashboard/services": "services",
  "/dashboard/analytics": "analytics",
  "/dashboard/reviews": "reviews",
  "/dashboard/notifications": "notifications",
  "/dashboard/profile": "profile",
  "/dashboard/billing": "billing",
  "/dashboard/settings": "account",
  "/dashboard/team": "team",
};

export class PermissionError extends Error {
  constructor(message = "Bu əməliyyat üçün icazəniz yoxdur") {
    super(message);
  }
}

/** Tarifə görə icazə verilən üzv sayı (sahib daxil). */
export const teamLimit = (plan: "FREE" | "PRO" | "PRO_MAX") => PLAN_LIMITS[plan].teamMembers;

/** İstifadəçinin daxil ola biləcəyi iş sahələri: öz səhifəsi + aktiv üzvlükləri. */
export async function workspacesFor(userId: string) {
  const memberships = await db.membership.findMany({
    where: { userId, status: { in: ["ACTIVE", "SUSPENDED"] } },
    include: {
      profile: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          user: { select: { subscription: { select: { plan: true, currentPeriodEnd: true } } } },
        },
      },
    },
    orderBy: [{ role: "asc" }, { invitedAt: "asc" }],
  });
  return memberships.map((m) => ({
    profileId: m.profileId,
    username: m.profile.username,
    displayName: m.profile.displayName,
    avatarUrl: m.profile.avatarUrl,
    role: m.role,
    status: m.status,
    plan: m.profile.user.subscription?.plan ?? "FREE",
  }));
}

/**
 * Tarif Pro Max-dan düşəndə üzvlər dondurulur (məlumat qalır),
 * Pro Max-a qayıdanda bərpa olunur. Sahib heç vaxt dondurulmur.
 */
export async function syncTeamWithPlan(profileId: string, plan: "FREE" | "PRO" | "PRO_MAX") {
  const allowed = teamLimit(plan) > 1;
  if (allowed) {
    await db.membership.updateMany({ where: { profileId, status: "SUSPENDED" }, data: { status: "ACTIVE" } });
  } else {
    await db.membership.updateMany({
      where: { profileId, role: { not: "OWNER" }, status: "ACTIVE" },
      data: { status: "SUSPENDED" },
    });
  }
}
