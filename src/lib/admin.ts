import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

// Admin bölməsi: daxil olmayan girişə, admin olmayan istifadəçi 404-ə yönləndirilir (bölmənin varlığı gizli qalır).
// Hər səhifə və hər server action bunu ayrıca çağırır.
export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") notFound();
  return user;
}

export async function logAdmin(admin: { email: string | null }, action: string, targetType: "user" | "service", targetId: string, details?: string) {
  await db.adminLog.create({ data: { adminEmail: admin.email ?? "?", action, targetType, targetId, details } });
}

// FİN və pasport tam göstərilmir: yalnız son 3 simvol
export const maskDocument = (v: string | null) => (v ? `${"•".repeat(Math.max(0, v.length - 3))}${v.slice(-3)}` : "—");
