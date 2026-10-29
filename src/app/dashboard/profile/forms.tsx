"use client";

import { useState } from "react";
import { ActionForm } from "@/components/ActionForm";
import { Card, Field, inputClass, secondaryButtonClass } from "@/components/ui";
import { callAi } from "@/lib/ai-client";
import { addSocialLink, updateProfile } from "../actions";

type ProfileValues = Record<
  | "displayName" | "username" | "bio" | "city" | "avatarUrl" | "primaryColor"
  | "invoicePrefix" | "accountName" | "bankName" | "cardNumber" | "iban",
  string
>;

export function ProfileForm({ profile }: { profile: ProfileValues }) {
  const [color, setColor] = useState(profile.primaryColor);
  const [bio, setBio] = useState(profile.bio);
  const [niche, setNiche] = useState("");
  const [ai, setAi] = useState<{ busy?: boolean; note?: string; error?: string }>({});

  async function suggest() {
    setAi({ busy: true });
    try {
      const theme = await callAi<{ primary: string; rationale: string }>("theme", { bio, niche: niche || "xidmət" });
      setColor(theme.primary);
      setAi({ note: theme.rationale });
    } catch (e) {
      setAi({ error: (e as Error).message });
    }
  }

  return (
    <ActionForm action={updateProfile} submitLabel="Yadda saxla" successMessage="Yadda saxlanıldı">
      <Card title="Əsas məlumat">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Ad və ya brend" name="displayName" defaultValue={profile.displayName} required />
          <Field label="İstifadəçi adı" name="username" defaultValue={profile.username} required />
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-sm font-medium text-gray-700">Bio</span>
            <textarea name="bio" rows={2} maxLength={300} value={bio} onChange={(e) => setBio(e.target.value)} className={inputClass} />
          </label>
          <Field label="Şəhər" name="city" defaultValue={profile.city} />
          <Field label="Avatar linki" name="avatarUrl" type="url" defaultValue={profile.avatarUrl} placeholder="https://..." />
        </div>
      </Card>

      <Card title="Görünüş">
        <div className="flex flex-wrap items-end gap-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Əsas rəng</span>
            <input type="color" name="primaryColor" value={color} onChange={(e) => setColor(e.target.value)} className="h-10 w-16 rounded border" />
          </label>
          <label className="block grow">
            <span className="mb-1 block text-sm font-medium text-gray-700">Sahəniz</span>
            <input value={niche} onChange={(e) => setNiche(e.target.value)} placeholder="məs. makiyaj, ingilis dili, SMM" className={inputClass} />
          </label>
          <button type="button" onClick={suggest} disabled={ai.busy} className={secondaryButtonClass}>
            {ai.busy ? "Düşünür..." : "✨ AI ilə rəng seç"}
          </button>
        </div>
        {ai.note && <p className="mt-3 text-sm text-gray-600">{ai.note}</p>}
        {ai.error && <p className="mt-3 text-sm text-red-600">{ai.error}</p>}
      </Card>

      <Card title="Faktura və ödəniş rekvizitləri">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Faktura prefiksi" name="invoicePrefix" defaultValue={profile.invoicePrefix} hint="Məs. AYG → AYG-2026-0001" required />
          <Field label="Alıcının adı" name="accountName" defaultValue={profile.accountName} />
          <Field label="Bank" name="bankName" defaultValue={profile.bankName} placeholder="Kapital Bank" />
          <Field label="Kart nömrəsi" name="cardNumber" defaultValue={profile.cardNumber} inputMode="numeric" />
          <Field label="IBAN" name="iban" defaultValue={profile.iban} placeholder="AZ00XXXX0000000000000000000" />
        </div>
      </Card>
    </ActionForm>
  );
}

const PLATFORMS = [
  ["INSTAGRAM", "Instagram"],
  ["TIKTOK", "TikTok"],
  ["WHATSAPP", "WhatsApp"],
  ["TELEGRAM", "Telegram"],
  ["YOUTUBE", "YouTube"],
  ["CUSTOM", "Digər"],
] as const;

export function AddLinkForm() {
  return (
    <ActionForm action={addSocialLink} submitLabel="Link əlavə et" resetOnSuccess className="grid gap-3 sm:grid-cols-[140px_1fr_1fr_auto] sm:items-start">
      <select name="platform" className={inputClass}>
        {PLATFORMS.map(([value, label]) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>
      <input name="label" placeholder="Yazı (könüllü)" className={inputClass} />
      <input name="url" type="url" required placeholder="https://instagram.com/..." className={inputClass} />
    </ActionForm>
  );
}
