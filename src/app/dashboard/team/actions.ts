"use server";

import { createHash, randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { TeamRole } from "@/generated/prisma/client";
import { logActivity } from "@/lib/activity";
import { getCurrentProfile, requirePermission, requireProfile } from "@/lib/auth";
import { db } from "@/lib/db";
import type { FormState } from "@/lib/forms";
import { sendEmail } from "@/lib/notify";
import { ROLE_LABELS, teamLimit } from "@/lib/team";

const sha256 = (v: string) => createHash("sha256").update(v).digest("hex");
const INVITE_DAYS = 7;
const ROLES: TeamRole[] = ["MANAGER", "STAFF"];

const inviteUrl = (token: string) => `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/dashboard/team/join?token=${token}`;

/** Sahib komandaya yeni üzv dəvət edir. Limit tarifdən gəlir (Pro Max: cəmi 5). */
export async function inviteMember(_: FormState, form: FormData): Promise<FormState & { inviteLink?: string }> {
  const profile = await requirePermission("team");
  const plan = profile.user.subscription?.plan ?? "FREE";
  const limit = teamLimit(plan);

  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const role = String(form.get("role") ?? "STAFF") as TeamRole;
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { error: "E-poçt düzgün deyil" };
  if (!ROLES.includes(role)) return { error: "Rol düzgün deyil" };
  if (email === profile.user.email) return { error: "Bu, sizin öz hesabınızdır" };

  const existing = await db.membership.findFirst({ where: { profileId: profile.id, invitedEmail: email } });
  if (existing) return { error: "Bu ünvana artıq dəvət göndərilib" };

  // Dəvət olunan hesabı varsa, dərhal bağlanır; yoxsa qeydiyyatdan sonra linki açacaq
  const invitee = await db.user.findUnique({ where: { email }, select: { id: true } });
  const token = randomBytes(24).toString("base64url");

  // Profil sətri kilidlənir ki, iki eyni anlı dəvət say yoxlamasını eyni anda keçib yer limitini aşmasın
  // (createInvoice-dakı eyni nümunə).
  const limitExceeded = await db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "Profile" WHERE id = ${profile.id} FOR UPDATE`;
    const current = await tx.membership.count({ where: { profileId: profile.id, status: { in: ["ACTIVE", "INVITED"] } } });
    if (current >= limit) return true;
    await tx.membership.create({
      data: {
        profileId: profile.id,
        role,
        status: "INVITED",
        invitedEmail: email,
        inviteToken: sha256(token),
        inviteExpiry: new Date(Date.now() + INVITE_DAYS * 86_400_000),
        invitedBy: profile.user.email,
      },
    });
    return false;
  });
  if (limitExceeded) {
    return {
      error:
        limit <= 1
          ? "Komanda üzvü yalnız Pro Max tarifində əlavə olunur"
          : `Tarifinizdə ən çoxu ${limit} nəfər ola bilər (sahib daxil). Əvvəlcə kimisə çıxarın.`,
    };
  }

  const link = inviteUrl(token);
  await sendEmail({
    to: email,
    subject: `Karvan: ${profile.displayName} sizi komandasına dəvət edir`,
    text:
      `Salam!\n\n${profile.displayName} sizi Karvan-da öz səhifəsinin komandasına “${ROLE_LABELS[role]}” rolu ilə dəvət edir.\n\n` +
      `Dəvəti qəbul etmək üçün linkə keçin (${INVITE_DAYS} gün etibarlıdır):\n${link}\n\n` +
      `Hesabınız yoxdursa, əvvəlcə qeydiyyatdan keçin, sonra bu linki açın.`,
  });

  await logActivity({ userId: profile.userId, email: profile.user.email, profileId: profile.id, actor: profile.actor, action: "team_invite", details: `${email} · ${role}` });
  revalidatePath("/dashboard/team");
  // E-poçt provayderi qoşulmayıbsa, sahib linki özü göndərə bilsin deyə ekranda göstərilir
  return { ok: true, inviteLink: link, ...(invitee ? {} : {}) };
}

export async function changeMemberRole(_: FormState, form: FormData): Promise<FormState> {
  const profile = await requirePermission("team");
  const id = String(form.get("id") ?? "");
  const role = String(form.get("role") ?? "") as TeamRole;
  if (!ROLES.includes(role)) return { error: "Rol düzgün deyil" };

  const member = await db.membership.findFirst({ where: { id, profileId: profile.id }, select: { id: true, role: true, invitedEmail: true } });
  if (!member) return { error: "Üzv tapılmadı" };
  if (member.role === "OWNER") return { error: "Sahibin rolu dəyişdirilmir" };

  await db.membership.update({ where: { id }, data: { role } });
  await logActivity({ userId: profile.userId, email: profile.user.email, profileId: profile.id, actor: profile.actor, action: "team_role", details: `${member.invitedEmail} · ${role}` });
  revalidatePath("/dashboard/team");
  return { ok: true };
}

export async function removeMember(_: FormState, form: FormData): Promise<FormState> {
  const profile = await requirePermission("team");
  const id = String(form.get("id") ?? "");
  const member = await db.membership.findFirst({ where: { id, profileId: profile.id }, select: { id: true, role: true, invitedEmail: true, userId: true } });
  if (!member) return { error: "Üzv tapılmadı" };
  if (member.role === "OWNER") return { error: "Sahib komandadan çıxarıla bilməz" };

  await db.membership.delete({ where: { id } });
  // Çıxarılan üzv həmin iş sahəsində qalmasın
  if (member.userId) {
    await db.session.updateMany({ where: { userId: member.userId, activeProfileId: profile.id }, data: { activeProfileId: null } });
  }
  await logActivity({ userId: profile.userId, email: profile.user.email, profileId: profile.id, actor: profile.actor, action: "team_remove", details: member.invitedEmail });
  revalidatePath("/dashboard/team");
  return { ok: true };
}

/** Üzv özü komandadan çıxır. */
export async function leaveTeam(_: FormState, form: FormData): Promise<FormState> {
  const profile = await requireProfile();
  const profileId = String(form.get("profileId") ?? "");
  const membership = await db.membership.findFirst({ where: { profileId, userId: profile.actor.id, role: { not: "OWNER" } } });
  if (!membership) return { error: "Üzvlük tapılmadı" };

  await db.membership.delete({ where: { id: membership.id } });
  await db.session.updateMany({ where: { userId: profile.actor.id, activeProfileId: profileId }, data: { activeProfileId: null } });
  revalidatePath("/dashboard", "layout");
  redirect("/dashboard");
}

/** Dəvətin qəbulu: linkdəki token yoxlanılır və üzvlük aktivləşir. */
export async function acceptInvite(token: string): Promise<{ ok: true; profileId: string } | { error: string }> {
  const me = await getCurrentProfile();
  if (!me) return { error: "Əvvəlcə hesabınıza daxil olun" };

  const membership = await db.membership.findUnique({
    where: { inviteToken: sha256(token) },
    include: { profile: { select: { id: true, displayName: true, userId: true, user: { select: { email: true, subscription: { select: { plan: true } } } } } } },
  });
  if (!membership || membership.status !== "INVITED") return { error: "Dəvət tapılmadı və ya artıq istifadə olunub" };
  if (membership.inviteExpiry && membership.inviteExpiry < new Date()) return { error: "Dəvətin müddəti bitib. Sahibdən yeni dəvət istəyin." };
  if (membership.invitedEmail !== me.actor.email) return { error: `Bu dəvət ${membership.invitedEmail} ünvanı üçündür. Həmin hesabla daxil olun.` };

  const plan = membership.profile.user.subscription?.plan ?? "FREE";
  const active = await db.membership.count({ where: { profileId: membership.profileId, status: "ACTIVE" } });
  if (active >= teamLimit(plan)) return { error: "Komanda doludur: sahibin tarifi daha çox üzvə icazə vermir" };

  await db.membership.update({
    where: { id: membership.id },
    data: { userId: me.actor.id, status: "ACTIVE", acceptedAt: new Date(), inviteToken: null, inviteExpiry: null },
  });
  await logActivity({
    userId: membership.profile.userId,
    email: membership.profile.user.email,
    profileId: membership.profileId,
    actor: { id: me.actor.id, name: me.actor.name },
    action: "team_join",
    details: `${me.actor.email} · ${membership.role}`,
  });
  return { ok: true, profileId: membership.profileId };
}

/** İş sahəsini dəyişir: öz səhifəsi və ya üzvü olduğu komanda. */
export async function switchWorkspace(profileId: string) {
  const me = await requireProfile();
  const own = await db.profile.findFirst({ where: { userId: me.actor.id }, select: { id: true } });

  if (own?.id !== profileId) {
    const membership = await db.membership.findFirst({ where: { profileId, userId: me.actor.id, status: "ACTIVE" }, select: { id: true } });
    if (!membership) return;
  }
  await db.session.update({ where: { id: me.sessionId }, data: { activeProfileId: own?.id === profileId ? null : profileId } });
  // Panelin menyusu və məzmunu yeni iş sahəsinə görə qurulur
  revalidatePath("/dashboard", "layout");
  redirect("/dashboard");
}
