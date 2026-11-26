"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

type Shot = { src: string; alt: string };

/**
 * Səhifədəki şəkilləri tam ekranda açır. Şəkillər serverdə render olunur, bu komponent
 * yalnız kliki tutur: `data-lightbox` olan şəkil açılır, `data-lightbox-group` isə
 * hansı şəkillərin bir dəstə sayıldığını (oxlarla gəzilən) bildirir.
 */
export function Lightbox() {
  const [shots, setShots] = useState<Shot[]>([]);
  const [index, setIndex] = useState(0);
  const touchX = useRef<number | null>(null);

  const close = useCallback(() => setShots([]), []);
  const go = useCallback((step: number) => setIndex((i) => (i + step + shots.length) % shots.length), [shots.length]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const img = (e.target as HTMLElement | null)?.closest<HTMLImageElement>("img[data-lightbox]");
      if (!img) return;
      e.preventDefault();
      const scope = img.closest("[data-lightbox-group]") ?? document;
      const all = Array.from(scope.querySelectorAll<HTMLImageElement>("img[data-lightbox]"));
      setShots(all.map((el) => ({ src: el.currentSrc || el.src, alt: el.alt })));
      setIndex(Math.max(0, all.indexOf(img)));
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  useEffect(() => {
    if (!shots.length) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    document.addEventListener("keydown", onKey);
    // Arxa fon sürüşməsin
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [shots.length, close, go]);

  if (!shots.length) return null;
  const shot = shots[index];
  const many = shots.length > 1;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={shot.alt || "Şəkil"}
      onClick={close}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        const start = touchX.current;
        touchX.current = null;
        if (start === null || !many) return;
        const dx = e.changedTouches[0].clientX - start;
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
      }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
    >
      <button
        type="button"
        onClick={close}
        aria-label="Bağla"
        className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
      >
        <X size={20} aria-hidden />
      </button>

      {many && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              go(-1);
            }}
            aria-label="Əvvəlki şəkil"
            className="absolute left-3 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20 sm:left-6"
          >
            <ChevronLeft size={22} aria-hidden />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              go(1);
            }}
            aria-label="Növbəti şəkil"
            className="absolute right-3 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20 sm:right-6"
          >
            <ChevronRight size={22} aria-hidden />
          </button>
        </>
      )}

      {/* eslint-disable-next-line @next/next/no-img-element -- /api/media-dan gələn şəkil */}
      <img
        key={shot.src}
        src={shot.src}
        alt={shot.alt}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[85vh] max-w-full rounded-xl object-contain shadow-2xl"
      />

      {many && (
        <div className="absolute bottom-5 flex gap-2">
          {shots.map((s, i) => (
            <button
              key={s.src + i}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIndex(i);
              }}
              aria-label={`${i + 1}-ci şəkil`}
              aria-current={i === index}
              className={`h-2 rounded-full transition-all ${i === index ? "w-6 bg-white" : "w-2 bg-white/40 hover:bg-white/70"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
