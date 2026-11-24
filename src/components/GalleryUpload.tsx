"use client";

import { ImagePlus, LoaderCircle, Trash2 } from "lucide-react";
import { useRef, useState } from "react";

// Brauzerdə kiçildib WebP-yə çeviririk (ImageUpload ilə eyni qayda).
async function resize(file: File, maxSize: number): Promise<Blob> {
  if (!/^image\/(png|jpeg|webp)$/.test(file.type)) throw new Error("Yalnız JPG, PNG və ya WebP şəkil yükləyin");
  const bitmap = await createImageBitmap(file).catch(() => {
    throw new Error("Bu fayl şəkil deyil və ya zədələnib");
  });
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Şəkil emal olunmadı"))), "image/webp", 0.86),
  );
}

/** Xidmətin qalereyası: bir neçə şəkil, sıra ilə. Dəyər gizli sahədə JSON kimi gedir. */
export function GalleryUpload({ name, value, onChange, max = 8 }: { name: string; value: string[]; onChange: (urls: string[]) => void; max?: number }) {
  const input = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<{ busy?: number; error?: string }>({});

  async function uploadAll(files: File[]) {
    const room = max - value.length;
    if (room <= 0) return setState({ error: `Ən çox ${max} şəkil əlavə etmək olar` });
    const picked = files.slice(0, room);
    setState({ busy: picked.length });
    const uploaded: string[] = [];
    try {
      for (const file of picked) {
        const blob = await resize(file, 1600);
        const form = new FormData();
        form.append("file", blob, "image.webp");
        const res = await fetch("/api/media", { method: "POST", body: form });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error ?? "Yükləmə alınmadı");
        uploaded.push(data.url);
      }
      onChange([...value, ...uploaded]);
      setState(files.length > room ? { error: `Yalnız ${room} şəkil əlavə olundu: limit ${max}-dir` } : {});
    } catch (e) {
      // Uğurlu olanlar itməsin: xətadan əvvəl yüklənənlər siyahıya düşür
      if (uploaded.length) onChange([...value, ...uploaded]);
      setState({ error: (e as Error).message });
    }
  }

  function move(from: number, to: number) {
    if (to < 0 || to >= value.length) return;
    const next = [...value];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  }

  return (
    <div>
      <input type="hidden" name={name} value={JSON.stringify(value)} />
      <input
        ref={input}
        type="file"
        multiple
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          const files = [...(e.target.files ?? [])];
          e.target.value = "";
          if (files.length) uploadAll(files);
        }}
      />

      <div className="flex flex-wrap gap-3">
        {value.map((url, i) => (
          <div key={url} className="group relative h-24 w-24 overflow-hidden rounded-2xl border border-gray-200">
            {/* eslint-disable-next-line @next/next/no-img-element -- yüklənmiş şəkil, /api/media-dan gəlir */}
            <img src={url} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/55 px-1 py-0.5 opacity-0 transition group-hover:opacity-100">
              <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0} className="px-1 text-xs text-white disabled:opacity-30" aria-label="Geri apar">
                ←
              </button>
              <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} className="px-1 text-white" aria-label="Şəkli sil">
                <Trash2 size={13} aria-hidden />
              </button>
              <button type="button" onClick={() => move(i, i + 1)} disabled={i === value.length - 1} className="px-1 text-xs text-white disabled:opacity-30" aria-label="İrəli apar">
                →
              </button>
            </div>
          </div>
        ))}

        {value.length < max && (
          <button
            type="button"
            onClick={() => input.current?.click()}
            className="grid h-24 w-24 shrink-0 place-items-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 text-gray-400 transition hover:border-[var(--brand)] hover:text-[var(--brand)]"
            aria-label="Şəkil əlavə et"
          >
            {state.busy ? <LoaderCircle size={22} className="animate-spin text-[var(--brand)]" aria-hidden /> : <ImagePlus size={24} strokeWidth={1.5} aria-hidden />}
          </button>
        )}
      </div>

      <p className="mt-2 text-xs text-gray-500">
        {value.length} / {max} şəkil. Bir neçəsini birdən seçə bilərsiniz; sıranı oxlarla dəyişin.
      </p>
      {state.error && <p className="mt-1 text-xs text-red-600">{state.error}</p>}
    </div>
  );
}
