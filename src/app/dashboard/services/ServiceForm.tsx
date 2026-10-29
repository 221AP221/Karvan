"use client";

import { useState } from "react";
import { ActionForm } from "@/components/ActionForm";
import { Card, Field, inputClass, secondaryButtonClass } from "@/components/ui";
import { callAi } from "@/lib/ai-client";
import { saveService } from "../actions";

export type ServiceValues = {
  id?: string;
  title: string;
  description: string;
  priceType: "FIXED" | "NEGOTIABLE";
  amount: string;
  duration: string;
};

export function ServiceForm({ service }: { service: ServiceValues }) {
  const [title, setTitle] = useState(service.title);
  const [description, setDescription] = useState(service.description);
  const [priceType, setPriceType] = useState(service.priceType);
  const [variants, setVariants] = useState<string[]>([]);
  const [ai, setAi] = useState<{ busy?: boolean; error?: string }>({});

  async function generate() {
    if (title.trim().length < 2) return setAi({ error: "Əvvəlcə xidmətin adını yazın" });
    setAi({ busy: true });
    try {
      const res = await callAi<{ variants: string[] }>("describe-service", { title, keywords: description });
      setVariants(res.variants);
      setAi({});
    } catch (e) {
      setAi({ error: (e as Error).message });
    }
  }

  return (
    <ActionForm action={saveService} submitLabel="Yadda saxla">
      <Card>
        <div className="flex flex-col gap-4">
          {service.id && <input type="hidden" name="id" value={service.id} />}
          <Field label="Xidmətin adı" name="title" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Fərdi ingilis dili dərsi" />

          <div>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Təsvir</span>
              <button type="button" onClick={generate} disabled={ai.busy} className={`${secondaryButtonClass} !px-3 !py-1 text-xs`}>
                {ai.busy ? "Yazır..." : "✨ AI ilə yaz"}
              </button>
            </div>
            <textarea
              name="description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Bir neçə açar söz yazın, AI tam mətnə çevirsin"
              className={inputClass}
            />
            {ai.error && <p className="mt-1 text-sm text-red-600">{ai.error}</p>}
            {variants.length > 0 && (
              <div className="mt-2 flex flex-col gap-2">
                {variants.map((v, i) => (
                  <button key={i} type="button" onClick={() => setDescription(v)} className="rounded-lg border border-dashed border-[var(--brand)] bg-[var(--brand)]/5 p-3 text-left text-sm hover:bg-[var(--brand)]/10">
                    {v}
                  </button>
                ))}
              </div>
            )}
          </div>

          <fieldset>
            <legend className="mb-1 text-sm font-medium text-gray-700">Qiymət</legend>
            <div className="flex gap-4 text-sm">
              {(["FIXED", "NEGOTIABLE"] as const).map((type) => (
                <label key={type} className="flex items-center gap-2">
                  <input type="radio" name="priceType" value={type} checked={priceType === type} onChange={() => setPriceType(type)} />
                  {type === "FIXED" ? "Sabit qiymət" : "Razılaşma ilə"}
                </label>
              ))}
            </div>
            <p className="mt-1 text-xs text-gray-500">
              {priceType === "FIXED"
                ? "Müştəri sifariş edən kimi faktura avtomatik yaranır."
                : "Müştəri sorğu göndərir, siz qiyməti təsdiqləyəndə faktura yaranır."}
            </p>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Məbləğ (AZN)" name="amount" inputMode="decimal" defaultValue={service.amount} required={priceType === "FIXED"} placeholder={priceType === "FIXED" ? "50" : "Könüllü"} />
            <Field label="Müddət / həcm" name="duration" defaultValue={service.duration} placeholder="60 dəq, 8 həftə..." />
          </div>
        </div>
      </Card>
    </ActionForm>
  );
}
