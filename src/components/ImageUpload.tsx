"use client";

import { ImagePlus, LoaderCircle, Trash2 } from "lucide-react";
import { useRef, useState } from "react";

// Brauzerdə kiçildib WebP-yə çeviririk: telefon şəkilləri belə bir neçə yüz KB olur.
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

export function ImageUpload({
  name,
  value,
  onChange,
  maxSize = 1200,
  shape = "square",
  label = "Şəkil yüklə",
  hint,
}: {
  name?: string;
  value: string;
  onChange: (url: string) => void;
  maxSize?: number;
  shape?: "square" | "circle" | "wide";
  label?: string;
  hint?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<{ busy?: boolean; error?: string }>({});

  async function upload(file: File) {
    setState({ busy: true });
    try {
      const blob = await resize(file, maxSize);
      const form = new FormData();
      form.append("file", blob, "image.webp");
      const res = await fetch("/api/media", { method: "POST", body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Yükləmə alınmadı");
      onChange(data.url);
      setState({});
    } catch (e) {
      setState({ error: (e as Error).message });
    }
  }

  const frame = {
    square: "h-24 w-24 rounded-2xl",
    circle: "h-24 w-24 rounded-full",
    wide: "aspect-[3/1] w-full rounded-2xl",
  }[shape];

  return (
    <div>
      {name && <input type="hidden" name={name} value={value} />}
      <input
        ref={input}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) upload(file);
        }}
      />
      <div className={`flex gap-4 ${shape === "wide" ? "flex-col" : "items-center"}`}>
        <button
          type="button"
          onClick={() => input.current?.click()}
          className={`group relative grid shrink-0 place-items-center overflow-hidden border border-dashed border-gray-300 bg-gray-50 text-gray-400 transition hover:border-[var(--brand)] hover:text-[var(--brand)] ${frame}`}
          aria-label={label}
        >
          {value ? (
            <img src={value} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <ImagePlus size={26} strokeWidth={1.5} aria-hidden />
          )}
          {state.busy && (
            <span className="absolute inset-0 grid place-items-center bg-white/70">
              <LoaderCircle size={22} className="animate-spin text-[var(--brand)]" aria-hidden />
            </span>
          )}
        </button>
        <div className="flex flex-col gap-1 text-sm">
          <div className="flex gap-3">
            <button type="button" onClick={() => input.current?.click()} className="font-medium text-[var(--brand)] hover:underline">
              {value ? "Dəyiş" : label}
            </button>
            {value && (
              <button type="button" onClick={() => onChange("")} className="inline-flex items-center gap-1 text-gray-500 hover:text-red-600">
                <Trash2 size={14} aria-hidden /> Sil
              </button>
            )}
          </div>
          {hint && <span className="text-xs text-gray-500">{hint}</span>}
          {state.error && <span className="text-xs text-red-600">{state.error}</span>}
        </div>
      </div>
    </div>
  );
}
