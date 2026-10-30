"use client";

import { Sparkles } from "lucide-react";
import { useState } from "react";
import { ActionForm } from "@/components/ActionForm";
import { ImageUpload } from "@/components/ImageUpload";
import { Card, Field, inputClass, secondaryButtonClass } from "@/components/ui";
import { callAi } from "@/lib/ai-client";
import { updateProfile } from "./actions";

type Values = Record<
  "displayName" | "username" | "profession" | "bio" | "about" | "city" | "phone" | "avatarUrl" | "coverUrl" | "primaryColor",
  string
>;

const SWATCHES = ["#D6127E", "#7c3aed", "#e11d48", "#ea580c", "#059669", "#0284c7", "#111827"];

export function BasicsForm({ profile }: { profile: Values }) {
  const [avatar, setAvatar] = useState(profile.avatarUrl);
  const [cover, setCover] = useState(profile.coverUrl);
  const [color, setColor] = useState(profile.primaryColor);
  const [bio, setBio] = useState(profile.bio);
  const [about, setAbout] = useState(profile.about);
  const [ai, setAi] = useState<{ busy?: boolean; note?: string; error?: string }>({});

  async function suggestColor() {
    setAi({ busy: true });
    try {
      const theme = await callAi<{ primary: string; rationale: string }>("theme", { bio, niche: profile.profession || "xidmət" });
      setColor(theme.primary);
      setAi({ note: theme.rationale });
    } catch (e) {
      setAi({ error: (e as Error).message });
    }
  }

  return (
    <ActionForm action={updateProfile} submitLabel="Yadda saxla" successMessage="Yadda saxlanıldı">
      <Card title="Şəkillər">
        <div className="grid gap-6 md:grid-cols-[auto_1fr]">
          <div>
            <p className="mb-2 text-sm font-medium text-gray-700">Profil şəkli və ya loqo</p>
            <ImageUpload name="avatarUrl" value={avatar} onChange={setAvatar} maxSize={512} shape="circle" hint="Kvadrat şəkil ən yaxşı görünür" />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-gray-700">Üz qabığı şəkli</p>
            <ImageUpload name="coverUrl" value={cover} onChange={setCover} maxSize={1600} shape="wide" label="Üz qabığı yüklə" hint="Tövsiyə: 1500×500 px. JPG, PNG və ya WebP" />
          </div>
        </div>
      </Card>

      <Card title="Əsas məlumat">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Ad və ya brend" name="displayName" defaultValue={profile.displayName} required />
          <Field label="İstifadəçi adı" name="username" defaultValue={profile.username} required hint="Səhifə ünvanınız: karvan.az/istifadeci_adi" />
          <Field label="Peşə" name="profession" defaultValue={profile.profession} placeholder="Makiyaj ustası, SMM mütəxəssisi..." />
          <Field label="Şəhər" name="city" defaultValue={profile.city} placeholder="Bakı" />
          <Field
            label="Əlaqə nömrəsi"
            name="phone"
            type="tel"
            defaultValue={profile.phone}
            placeholder="+994 50 123 45 67"
            hint="Səhifədə “Zəng et” düyməsi kimi görünür. Boş qoysanız, gizlənir."
          />
          <label className="block sm:col-span-2">
            <span className="mb-1 flex justify-between text-sm font-medium text-gray-700">
              Qısa bio <span className="font-normal text-gray-400">{bio.length}/300</span>
            </span>
            <textarea name="bio" rows={2} maxLength={300} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Bir-iki cümlə ilə kim olduğunuzu yazın" className={inputClass} />
          </label>
        </div>
      </Card>

      <Card title="Haqqımda">
        <label className="block">
          <span className="mb-1 flex justify-between text-sm text-gray-500">
            Təcrübəniz, işləmə üslubunuz, sertifikatlarınız. Abzaslar olduğu kimi göstərilir.
            <span className="text-gray-400">{about.length}/3000</span>
          </span>
          <textarea
            name="about"
            rows={7}
            maxLength={3000}
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            placeholder={"Məs: 6 ildir makiyaj ustası kimi işləyirəm. 500-dən çox gəlin makiyajı...\n\nİstifadə etdiyim brendlər: ..."}
            className={inputClass}
          />
        </label>
      </Card>

      <Card title="Görünüş">
        <input type="hidden" name="primaryColor" value={color} />
        <div className="flex flex-wrap items-center gap-3">
          {SWATCHES.map((swatch) => (
            <button
              key={swatch}
              type="button"
              onClick={() => setColor(swatch)}
              aria-label={`Rəng ${swatch}`}
              className={`h-9 w-9 rounded-full ring-offset-2 transition ${color === swatch ? "ring-2 ring-gray-900" : "hover:scale-110"}`}
              style={{ background: swatch }}
            />
          ))}
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-9 w-12 cursor-pointer rounded border border-gray-300" />
            Öz rənginiz
          </label>
          <button type="button" onClick={suggestColor} disabled={ai.busy} className={`${secondaryButtonClass} gap-2`}>
            <Sparkles size={16} strokeWidth={1.75} aria-hidden />
            {ai.busy ? "Düşünür..." : "AI ilə seç"}
          </button>
        </div>
        {ai.note && <p className="mt-3 text-sm text-gray-600">{ai.note}</p>}
        {ai.error && <p className="mt-3 text-sm text-red-600">{ai.error}</p>}
      </Card>
    </ActionForm>
  );
}
