"use server";

import { logActivity } from "@/lib/activity";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireProfile } from "@/lib/auth";
import { db } from "@/lib/db";
import { normalizePhone } from "@/lib/phone";
import { type FormState, firstError, optional } from "@/lib/forms";
import { deleteMediaByUrl, ownedMediaUrl } from "@/lib/media";
import { PLATFORMS, safeUrl } from "@/lib/social";
import { RESERVED_USERNAMES, USERNAME_RE } from "@/lib/username";

function refresh(username: string) {
  revalidatePath("/dashboard", "layout");
  revalidatePath(`/${username}`);
}

// Əsas məlumat və "Haqqımda"

const ProfileInput = z.object({
  displayName: z.string().trim().min(2, "Adınızı yazın").max(80),
  username: z.string().trim().toLowerCase().regex(USERNAME_RE, "İstifadəçi adı 3-30 simvol: a-z, 0-9, _ və ."),
  profession: z.string().trim().max(80).transform((v) => v || null),
  bio: z.string().trim().max(300).transform((v) => v || null),
  about: z.string().trim().max(3000, "Haqqımda mətni 3000 simvoldan çox olmamalıdır").transform((v) => v || null),
  city: optional,
  phone: z
    .string()
    .trim()
    .transform((v) => (v ? normalizePhone(v) : ""))
    .refine((v) => v !== null, "Əlaqə nömrəsi düzgün deyil (məs. +994 50 123 45 67)")
    .transform((v) => v || null),
  avatarUrl: z.string().transform((v) => v || null),
  coverUrl: z.string().transform((v) => v || null),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
});

export async function updateProfile(_: FormState, form: FormData): Promise<FormState> {
  const profile = await requireProfile();
  const parsed = ProfileInput.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const { primaryColor, avatarUrl, coverUrl, ...data } = parsed.data;

  if (data.username !== profile.username) {
    if (RESERVED_USERNAMES.has(data.username)) return { error: "Bu ad istifadə edilə bilməz" };
    if (await db.profile.findUnique({ where: { username: data.username } })) {
      return { error: "Bu istifadəçi adı tutulub" };
    }
  }

  // Şəkillər yalnız bu profilin yüklədiyi fayllar ola bilər
  const avatar = await ownedMediaUrl(profile.id, avatarUrl);
  const cover = await ownedMediaUrl(profile.id, coverUrl);
  if (profile.avatarUrl !== avatar) await deleteMediaByUrl(profile.id, profile.avatarUrl);
  if (profile.coverUrl !== cover) await deleteMediaByUrl(profile.id, profile.coverUrl);

  const theme = { ...((profile.theme as object | null) ?? {}), primary: primaryColor };
  await db.profile.update({
    where: { id: profile.id },
    data: { ...data, avatarUrl: avatar, coverUrl: cover, theme },
  });
  await logActivity({ userId: profile.userId, email: profile.user.email, action: "profile_update", details: data.username !== profile.username ? `ünvan: @${profile.username} → @${data.username}` : null });
  if (data.username !== profile.username) revalidatePath(`/${profile.username}`);
  refresh(data.username);
  return { ok: true };
}

// Sosial şəbəkələr: hamısı bir formada saxlanılır

export async function saveSocials(_: FormState, form: FormData): Promise<FormState> {
  const profile = await requireProfile();
  const links: { platform: (typeof PLATFORMS)[number]["key"]; url: string; position: number }[] = [];

  for (const [position, platform] of PLATFORMS.entries()) {
    const value = String(form.get(platform.key) ?? "").trim();
    if (!value) continue;
    const url = platform.toUrl(value);
    if (!url) return { error: `${platform.label}: "${value}" düzgün deyil` };
    links.push({ platform: platform.key, url, position });
  }

  await db.$transaction([
    db.socialLink.deleteMany({ where: { profileId: profile.id, platform: { not: "CUSTOM" } } }),
    db.socialLink.createMany({ data: links.map((l) => ({ ...l, profileId: profile.id })) }),
  ]);
  refresh(profile.username);
  return { ok: true };
}

// Sərbəst linklər (səhifədə düymə kimi görünür)

const CustomLinkInput = z.object({
  label: z.string().trim().min(1, "Linkin adını yazın").max(60),
  url: z
    .string()
    .trim()
    .transform((v) => safeUrl(v.includes("://") ? v : `https://${v}`))
    .refine((v) => v !== null, "Link düzgün deyil (https:// ilə başlamalıdır)"),
});

export async function addCustomLink(_: FormState, form: FormData): Promise<FormState> {
  const profile = await requireProfile();
  const parsed = CustomLinkInput.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const count = await db.socialLink.count({ where: { profileId: profile.id, platform: "CUSTOM" } });
  if (count >= 20) return { error: "Ən çox 20 link əlavə etmək olar" };
  await db.socialLink.create({
    data: { platform: "CUSTOM", label: parsed.data.label, url: parsed.data.url!, position: 100 + count, profileId: profile.id },
  });
  refresh(profile.username);
  return { ok: true };
}

export async function deleteCustomLink(id: string) {
  const profile = await requireProfile();
  await db.socialLink.deleteMany({ where: { id, profileId: profile.id, platform: "CUSTOM" } });
  refresh(profile.username);
}

// Gördüyüm işlər

const PortfolioInput = z.object({
  title: z.string().trim().min(2, "İşin adını yazın").max(100),
  description: z.string().trim().max(600).transform((v) => v || null),
  imageUrl: z.string().transform((v) => v || null),
  linkUrl: z
    .string()
    .trim()
    .transform((v) => (v ? safeUrl(v.includes("://") ? v : `https://${v}`) : null)),
});

export async function savePortfolioItem(_: FormState, form: FormData): Promise<FormState> {
  const profile = await requireProfile();
  const parsed = PortfolioInput.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const rawLink = String(form.get("linkUrl") ?? "").trim();
  if (rawLink && !parsed.data.linkUrl) return { error: "Link düzgün deyil (https:// ilə başlamalıdır)" };

  const imageUrl = await ownedMediaUrl(profile.id, parsed.data.imageUrl);
  const data = { ...parsed.data, imageUrl };
  const id = String(form.get("id") ?? "");

  if (id) {
    const existing = await db.portfolioItem.findFirst({ where: { id, profileId: profile.id } });
    if (!existing) return { error: "İş tapılmadı" };
    if (existing.imageUrl !== imageUrl) await deleteMediaByUrl(profile.id, existing.imageUrl);
    await db.portfolioItem.update({ where: { id }, data });
  } else {
    const count = await db.portfolioItem.count({ where: { profileId: profile.id } });
    if (count >= 30) return { error: "Ən çox 30 iş əlavə etmək olar" };
    await db.portfolioItem.create({ data: { ...data, profileId: profile.id, position: count } });
  }
  refresh(profile.username);
  return { ok: true };
}

export async function deletePortfolioItem(id: string) {
  const profile = await requireProfile();
  const item = await db.portfolioItem.findFirst({ where: { id, profileId: profile.id } });
  if (!item) return;
  await db.portfolioItem.delete({ where: { id } });
  await deleteMediaByUrl(profile.id, item.imageUrl);
  refresh(profile.username);
}

export async function movePortfolioItem(id: string, direction: -1 | 1) {
  const profile = await requireProfile();
  const items = await db.portfolioItem.findMany({ where: { profileId: profile.id }, orderBy: { position: "asc" } });
  const from = items.findIndex((i) => i.id === id);
  const to = from + direction;
  if (from < 0 || to < 0 || to >= items.length) return;
  [items[from], items[to]] = [items[to], items[from]];
  await db.$transaction(items.map((item, position) => db.portfolioItem.update({ where: { id: item.id }, data: { position } })));
  refresh(profile.username);
}
