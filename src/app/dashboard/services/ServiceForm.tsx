"use client";

import { ChevronDown, LoaderCircle, MapPin, Sparkles } from "lucide-react";
import { useState } from "react";
import { ActionForm } from "@/components/ActionForm";
import { GalleryUpload } from "@/components/GalleryUpload";
import { ImageUpload } from "@/components/ImageUpload";
import { Card, Field, inputClass } from "@/components/ui";
import { callAi } from "@/lib/ai-client";
import { CURRENCIES } from "@/lib/money";
import { SERVICE_CATEGORIES } from "@/lib/services";
import { saveService } from "../actions";

export type ServiceValues = {
  id?: string;
  title: string;
  category: string;
  customCategory: string;
  imageUrl: string;
  description: string;
  priceType: "FIXED" | "NEGOTIABLE";
  amount: string;
  currency: string;
  durationDays: string;
  durationWeeks: string;
  durationMonths: string;
  legacyDuration?: string;
  durationMin: string;
  location: "SELLER" | "CUSTOMER" | "ONLINE";
  depositPercent: string;
  cancelWindowHours: string;
  address: string;
  mapUrl: string;
  gallery: string[];
};

const LOCATIONS = [
  { value: "SELLER", label: "Mənim məkanımda" },
  { value: "CUSTOMER", label: "Müştərinin ünvanında" },
  { value: "ONLINE", label: "Onlayn" },
] as const;

const selectClass = `${inputClass} appearance-none pr-10`;

function Select({ children, ...props }: React.ComponentProps<"select">) {
  return (
    <div className="relative">
      <select {...props} className={`${selectClass} ${props.className ?? ""}`}>
        {children}
      </select>
      <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden />
    </div>
  );
}

export function ServiceForm({ service }: { service: ServiceValues }) {
  const [title, setTitle] = useState(service.title);
  const [category, setCategory] = useState(service.category);
  const [customCategory, setCustomCategory] = useState(service.customCategory);
  const [image, setImage] = useState(service.imageUrl);
  const [gallery, setGallery] = useState(service.gallery);
  const [description, setDescription] = useState(service.description);
  const [priceType, setPriceType] = useState(service.priceType);
  const [location, setLocation] = useState(service.location);
  const [address, setAddress] = useState(service.address);
  const [variants, setVariants] = useState<string[]>([]);
  const [ai, setAi] = useState<{ busy?: boolean; error?: string }>({});

  async function generate() {
    if (title.trim().length < 2) return setAi({ error: "Əvvəlcə xidmətin adını yazın" });
    setAi({ busy: true });
    try {
      const niche = category === "other" ? customCategory || undefined : SERVICE_CATEGORIES.find((c) => c.key === category)?.label;
      const res = await callAi<{ variants: string[] }>("describe-service", { title, keywords: description, niche });
      setVariants(res.variants);
      setAi({});
    } catch (e) {
      setAi({ error: (e as Error).message });
    }
  }

  return (
    <ActionForm action={saveService} submitLabel="Yadda saxla">
      <Card>
        <div className="flex flex-col gap-5">
          {service.id && <input type="hidden" name="id" value={service.id} />}

          <div className="grid gap-4 sm:grid-cols-[1.4fr_1fr]">
            <Field label="Xidmətin adı" name="title" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Fərdi ingilis dili dərsi" />
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700">Xidmətin növü</span>
              <Select name="category" value={category} onChange={(e) => setCategory(e.target.value)} required>
                <option value="" disabled>
                  Seçin...
                </option>
                {SERVICE_CATEGORIES.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </Select>
              {/* "Digər" seçiləndə növü satıcı özü yazır */}
              {category === "other" && (
                <input
                  name="customCategory"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  required
                  maxLength={40}
                  placeholder="Növü yazın, məs. Tort sifarişi"
                  aria-label="Xidmətin növü (sərbəst)"
                  className={`${inputClass} mt-2`}
                />
              )}
            </label>
          </div>

          <div>
            <p className="mb-1.5 text-sm font-medium text-gray-700">
              Şəkil <span className="font-normal text-gray-400">(könüllü)</span>
            </p>
            <ImageUpload name="imageUrl" value={image} onChange={setImage} maxSize={1200} shape="wide" label="Xidmət şəkli yüklə" hint="İşinizdən nümunə: kataloqda və səhifənizdə kartın üstündə görünür" />
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-gray-700">Təsvir</span>
              <button
                type="button"
                onClick={generate}
                disabled={ai.busy}
                className="group relative inline-flex items-center gap-1.5 overflow-hidden rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-md shadow-violet-500/25 transition hover:shadow-lg hover:shadow-violet-500/40 disabled:opacity-70"
              >
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" aria-hidden />
                {ai.busy ? <LoaderCircle size={14} className="animate-spin" aria-hidden /> : <Sparkles size={14} strokeWidth={2} aria-hidden />}
                {ai.busy ? "Yazır..." : "AI ilə yaz"}
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
                <p className="text-xs text-gray-500">Birini seçin, sonra istədiyiniz kimi düzəldin:</p>
                {variants.map((v, i) => (
                  <button key={i} type="button" onClick={() => setDescription(v)} className="rounded-xl border border-violet-200 bg-violet-50/60 p-3 text-left text-sm transition hover:border-violet-400 hover:bg-violet-50">
                    {v}
                  </button>
                ))}
              </div>
            )}
          </div>

          <fieldset>
            <legend className="mb-1.5 text-sm font-medium text-gray-700">Qiymət</legend>
            <div className="inline-flex rounded-xl border border-gray-200 bg-gray-50 p-1 text-sm">
              {(["FIXED", "NEGOTIABLE"] as const).map((type) => (
                <label
                  key={type}
                  className={`cursor-pointer rounded-lg px-4 py-1.5 font-medium transition ${priceType === type ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-800"}`}
                >
                  <input type="radio" name="priceType" value={type} checked={priceType === type} onChange={() => setPriceType(type)} className="sr-only" />
                  {type === "FIXED" ? "Sabit qiymət" : "Razılaşma ilə"}
                </label>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-gray-500">
              {priceType === "FIXED"
                ? "Müştəri sifariş edən kimi faktura avtomatik yaranır."
                : "Müştəri sorğu göndərir, siz qiyməti təsdiqləyəndə faktura yaranır."}
            </p>
          </fieldset>

          <div className="grid gap-5 lg:grid-cols-2">
            <div>
              <span className="mb-1 block text-sm font-medium text-gray-700">Məbləğ</span>
              <div className="flex rounded-lg border border-gray-300 bg-white focus-within:border-[var(--brand)] focus-within:ring-2 focus-within:ring-[var(--brand)]/20">
                <input
                  name="amount"
                  inputMode="decimal"
                  aria-label="Məbləğ"
                  defaultValue={service.amount}
                  required={priceType === "FIXED"}
                  placeholder={priceType === "FIXED" ? "50" : "Könüllü"}
                  className="min-w-0 flex-1 rounded-l-lg bg-transparent px-3 py-2 text-sm outline-none"
                />
                <div className="relative border-l border-gray-200">
                  <select name="currency" aria-label="Valyuta" defaultValue={service.currency} className="h-full appearance-none rounded-r-lg bg-gray-50 py-2 pl-3 pr-8 text-sm font-medium outline-none">
                    {CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden />
                </div>
              </div>
            </div>

            <div>
              <span className="mb-1 block text-sm font-medium text-gray-700">Müddət</span>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    ["durationDays", "Gün", 31],
                    ["durationWeeks", "Həftə", 52],
                    ["durationMonths", "Ay", 36],
                  ] as const
                ).map(([name, label, max]) => (
                  <label key={name} className="flex rounded-lg border border-gray-300 bg-white focus-within:border-[var(--brand)] focus-within:ring-2 focus-within:ring-[var(--brand)]/20">
                    <input
                      name={name}
                      type="number"
                      min={0}
                      max={max}
                      inputMode="numeric"
                      defaultValue={service[name]}
                      placeholder="0"
                      className="w-full min-w-0 rounded-l-lg bg-transparent px-3 py-2 text-sm outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="grid place-items-center rounded-r-lg border-l border-gray-200 bg-gray-50 px-2.5 text-xs font-medium text-gray-500">{label}</span>
                  </label>
                ))}
              </div>
              {service.legacyDuration && (
                <p className="mt-1.5 text-xs text-gray-500">Hazırkı: “{service.legacyDuration}”. Sahələri doldursanız, bu əvəz olunacaq.</p>
              )}
            </div>
          </div>

          <div className="grid gap-5 border-t border-gray-100 pt-5 lg:grid-cols-2">
            <div>
              <span className="mb-1 block text-sm font-medium text-gray-700">
                Seans müddəti <span className="font-normal text-gray-400">(rezervasiya üçün)</span>
              </span>
              <label className="flex rounded-lg border border-gray-300 bg-white focus-within:border-[var(--brand)] focus-within:ring-2 focus-within:ring-[var(--brand)]/20">
                <input
                  name="durationMin"
                  type="number"
                  min={5}
                  max={600}
                  step={5}
                  inputMode="numeric"
                  defaultValue={service.durationMin}
                  placeholder="60"
                  className="w-full min-w-0 rounded-l-lg bg-transparent px-3 py-2 text-sm outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="grid place-items-center rounded-r-lg border-l border-gray-200 bg-gray-50 px-2.5 text-xs font-medium text-gray-500">dəq</span>
              </label>
              <p className="mt-1.5 text-xs text-gray-500">Təqvimdə bu qədər vaxt tutulur. Boş qalsa, 60 dəqiqə sayılır.</p>
            </div>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700">Xidmətin məkanı</span>
              <Select name="location" value={location} onChange={(e) => setLocation(e.target.value as ServiceValues["location"])}>
                {LOCATIONS.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </Select>
              <p className="mt-1.5 text-xs text-gray-500">“Müştərinin ünvanında” seçsəniz, sifarişdə ünvan soruşulur və yol buferi tətbiq olunur.</p>
            </label>
          </div>

          {/* Ünvan yalnız xidmət ustanın məkanında göstəriləndə mənalıdır */}
          {location === "SELLER" && (
            <div className="grid gap-4 lg:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-gray-700">Ünvan</span>
                <input
                  name="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  maxLength={200}
                  placeholder="Nizami küç. 12, Bakı"
                  className={inputClass}
                />
                <span className="mt-1 block text-xs text-gray-500">Müştəri səhifənizdə bu ünvanı görəcək.</span>
              </label>

              <label className="block">
                <span className="mb-1 flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-gray-700">Xəritə linki</span>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address || "Bakı")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium text-[var(--brand)] hover:underline"
                  >
                    <MapPin size={13} aria-hidden /> Xəritədə seç
                  </a>
                </span>
                <input name="mapUrl" type="url" defaultValue={service.mapUrl} placeholder="https://maps.app.goo.gl/..." className={inputClass} />
                <span className="mt-1 block text-xs text-gray-500">Xəritədə yeri tapıb linki kopyalayın — müştəri birbaşa naviqasiyaya keçsin.</span>
              </label>
            </div>
          )}

          <div className="border-t border-gray-100 pt-5">
            <p className="mb-1.5 text-sm font-medium text-gray-700">
              Qalereya <span className="font-normal text-gray-400">(könüllü)</span>
            </p>
            <p className="mb-3 text-xs text-gray-500">İşinizdən bir neçə nümunə: xidmətin səhifəsində slayd kimi göstərilir.</p>
            <GalleryUpload name="gallery" value={gallery} onChange={setGallery} />
          </div>

          <fieldset className="border-t border-gray-100 pt-5">
            <legend className="mb-1.5 text-sm font-medium text-gray-700">
              Beh <span className="font-normal text-gray-400">(könüllü)</span>
            </legend>
            <p className="mb-3 text-xs text-gray-500">
              Beh yazsanız, faktura üzərində ilkin ödəniş kimi göstərilir və rezervasiya beh ödənildikdən sonra təsdiqlənmiş sayılır.
            </p>
            <div className="grid gap-4 lg:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-gray-600">Beh faizi</span>
                <span className="flex rounded-lg border border-gray-300 bg-white focus-within:border-[var(--brand)] focus-within:ring-2 focus-within:ring-[var(--brand)]/20">
                  <input
                    name="depositPercent"
                    type="number"
                    min={1}
                    max={99}
                    inputMode="numeric"
                    defaultValue={service.depositPercent}
                    placeholder="Beh yoxdur"
                    className="w-full min-w-0 rounded-l-lg bg-transparent px-3 py-2 text-sm outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="grid place-items-center rounded-r-lg border-l border-gray-200 bg-gray-50 px-2.5 text-xs font-medium text-gray-500">%</span>
                </span>
                <span className="mt-1 block text-xs text-gray-500">Boş qalsa, beh tələb olunmur. Bazar standartı 20-30%-dir.</span>
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-medium text-gray-600">Ləğv pəncərəsi</span>
                <span className="flex rounded-lg border border-gray-300 bg-white focus-within:border-[var(--brand)] focus-within:ring-2 focus-within:ring-[var(--brand)]/20">
                  <input
                    name="cancelWindowHours"
                    type="number"
                    min={0}
                    max={720}
                    inputMode="numeric"
                    defaultValue={service.cancelWindowHours}
                    placeholder="24"
                    className="w-full min-w-0 rounded-l-lg bg-transparent px-3 py-2 text-sm outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="grid place-items-center rounded-r-lg border-l border-gray-200 bg-gray-50 px-2.5 text-xs font-medium text-gray-500">saat</span>
                </span>
                <span className="mt-1 block text-xs text-gray-500">Bu müddətdən az qalmış ləğvdə beh qaytarılmır.</span>
              </label>
            </div>
          </fieldset>
        </div>
      </Card>
    </ActionForm>
  );
}
