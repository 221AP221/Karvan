"use client";

import { ActionForm } from "@/components/ActionForm";
import { SocialIcon } from "@/components/SocialIcon";
import { Card, inputClass } from "@/components/ui";
import { PLATFORMS } from "@/lib/social";
import { addCustomLink, saveSocials } from "../actions";

export function SocialsForm({ values }: { values: Record<string, string> }) {
  return (
    <ActionForm action={saveSocials} submitLabel="Yadda saxla" successMessage="Sosial hesablar yadda saxlanıldı">
      <Card title="Sosial şəbəkələr">
        <p className="-mt-2 mb-5 text-sm text-gray-500">
          İstifadəçi adınızı (məs. <span className="tabular-nums">@leyla.makeup</span>) və ya tam linki yazın. Boş qalanlar səhifədə görünmür.
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          {PLATFORMS.map((p) => (
            <label key={p.key} className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-2 pl-3 focus-within:border-[var(--brand)] focus-within:ring-2 focus-within:ring-[var(--brand)]/15">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gray-50 ring-1 ring-gray-100">
                <SocialIcon platform={p.key} size={18} color />
              </span>
              <span className="w-24 shrink-0 text-sm font-medium text-gray-700">{p.label}</span>
              <input
                name={p.key}
                defaultValue={values[p.key]}
                placeholder={p.placeholder}
                autoComplete="off"
                className="min-w-0 flex-1 bg-transparent px-1 py-1.5 text-sm outline-none placeholder:text-gray-400"
              />
            </label>
          ))}
        </div>
      </Card>
    </ActionForm>
  );
}

export function AddLinkForm() {
  return (
    <ActionForm action={addCustomLink} submitLabel="Link əlavə et" resetOnSuccess className="grid gap-3 sm:grid-cols-[1fr_1.4fr_auto] sm:items-start">
      <input name="label" required maxLength={60} placeholder="Düymə yazısı, məs. Portfoliom" className={inputClass} />
      <input name="url" required placeholder="https://..." className={inputClass} />
    </ActionForm>
  );
}
