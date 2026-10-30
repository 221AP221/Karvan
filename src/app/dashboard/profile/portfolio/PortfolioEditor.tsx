"use client";

import { ArrowDown, ArrowUp, ExternalLink, ImageIcon, Pencil, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { ActionForm } from "@/components/ActionForm";
import { ImageUpload } from "@/components/ImageUpload";
import { Card, Field, buttonClass, inputClass } from "@/components/ui";
import { deletePortfolioItem, movePortfolioItem, savePortfolioItem } from "../actions";

type Item = { id: string; title: string; description: string; imageUrl: string; linkUrl: string };
const empty: Item = { id: "", title: "", description: "", imageUrl: "", linkUrl: "" };

function ItemForm({ item, onDone }: { item: Item; onDone: () => void }) {
  const [image, setImage] = useState(item.imageUrl);
  return (
    <ActionForm
      action={async (state, form) => {
        const result = await savePortfolioItem(state, form);
        if (result?.ok) onDone();
        return result;
      }}
      submitLabel={item.id ? "Yadda saxla" : "İşi əlavə et"}
    >
      {item.id && <input type="hidden" name="id" value={item.id} />}
      <div className="grid gap-5 md:grid-cols-[280px_1fr]">
        <ImageUpload name="imageUrl" value={image} onChange={setImage} maxSize={1400} shape="wide" label="Şəkil yüklə" hint="İşin nəticəsi, əvvəl/sonra, layihə" />
        <div className="flex flex-col gap-4">
          <Field label="İşin adı" name="title" defaultValue={item.title} required placeholder="Gəlin makiyajı — Aysel" />
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Təsvir</span>
            <textarea name="description" rows={3} maxLength={600} defaultValue={item.description} placeholder="Nə etdiniz, nəticə nə oldu" className={inputClass} />
          </label>
          <Field label="Link (könüllü)" name="linkUrl" defaultValue={item.linkUrl} placeholder="https://instagram.com/p/..." />
        </div>
      </div>
    </ActionForm>
  );
}

export function PortfolioEditor({ items }: { items: Item[] }) {
  const [editing, setEditing] = useState<Item | null>(null);

  return (
    <div className="flex flex-col gap-6">
      {editing ? (
        <Card
          title={editing.id ? "İşi redaktə et" : "Yeni iş"}
          actions={
            <button type="button" onClick={() => setEditing(null)} className="grid h-8 w-8 place-items-center rounded-full text-gray-500 hover:bg-gray-100" aria-label="Bağla">
              <X size={18} aria-hidden />
            </button>
          }
        >
          <ItemForm key={editing.id || "new"} item={editing} onDone={() => setEditing(null)} />
        </Card>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-gray-500">Ən yaxşı işlərinizi göstərin: müştərilər qərarı şəkillərə baxıb verir.</p>
          <button type="button" onClick={() => setEditing(empty)} className={`${buttonClass} shrink-0 gap-2`}>
            <Plus size={16} aria-hidden /> İş əlavə et
          </button>
        </div>
      )}

      {items.length === 0 && !editing && (
        <div className="grid place-items-center gap-3 rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-violet-50 text-violet-600 ring-1 ring-violet-100">
            <ImageIcon size={26} strokeWidth={1.5} aria-hidden />
          </span>
          <p className="font-medium">Hələ iş əlavə etməmisiniz</p>
          <p className="max-w-sm text-sm text-gray-500">Şəkil, qısa təsvir və istəsəniz link əlavə edin. Səhifənizdə qalereya kimi görünəcək.</p>
        </div>
      )}

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, i) => (
          <li key={item.id} className="group overflow-hidden rounded-2xl border border-gray-200 bg-white">
            <div className="relative aspect-[4/3] bg-gray-100">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="grid h-full place-items-center text-gray-300">
                  <ImageIcon size={32} strokeWidth={1.5} aria-hidden />
                </span>
              )}
              <div className="absolute right-2 top-2 flex gap-1 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
                {[
                  { icon: ArrowUp, label: "Yuxarı", disabled: i === 0, run: () => movePortfolioItem(item.id, -1) },
                  { icon: ArrowDown, label: "Aşağı", disabled: i === items.length - 1, run: () => movePortfolioItem(item.id, 1) },
                  { icon: Pencil, label: "Redaktə", run: () => setEditing(item) },
                  { icon: Trash2, label: "Sil", danger: true, run: () => confirm(`"${item.title}" silinsin?`) && deletePortfolioItem(item.id) },
                ].map(({ icon: Icon, label, disabled, danger, run }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={run}
                    disabled={disabled}
                    aria-label={label}
                    className={`grid h-8 w-8 place-items-center rounded-full bg-white/90 shadow-sm backdrop-blur transition disabled:opacity-40 ${danger ? "text-red-600 hover:bg-red-50" : "text-gray-700 hover:bg-white"}`}
                  >
                    <Icon size={15} strokeWidth={1.75} aria-hidden />
                  </button>
                ))}
              </div>
            </div>
            <div className="p-4">
              <p className="font-semibold">{item.title}</p>
              {item.description && <p className="mt-1 line-clamp-2 text-sm text-gray-600">{item.description}</p>}
              {item.linkUrl && (
                <a href={item.linkUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm text-[var(--brand)] hover:underline">
                  Linkə bax <ExternalLink size={13} aria-hidden />
                </a>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
