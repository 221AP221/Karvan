"use client";

import { useEffect, useRef } from "react";

// Seçim dəyişən kimi formu göndərir ([data-autosubmit] sahələri); boş sahələr URL-ə düşmür
export function AutoSubmit() {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const form = ref.current?.closest("form");
    if (!form) return;
    const clean = () => {
      for (const el of Array.from(form.elements) as HTMLInputElement[]) if (el.name && !el.value) el.disabled = true;
    };
    const onChange = (e: Event) => {
      if ((e.target as HTMLElement).hasAttribute("data-autosubmit")) {
        clean();
        form.submit();
      }
    };
    // "Geri" ilə qayıdanda (bfcache) söndürülmüş sahələr yenidən aktiv olsun
    const restore = () => {
      for (const el of Array.from(form.elements) as HTMLInputElement[]) el.disabled = false;
    };
    form.addEventListener("change", onChange);
    form.addEventListener("submit", clean);
    window.addEventListener("pageshow", restore);
    return () => {
      form.removeEventListener("change", onChange);
      form.removeEventListener("submit", clean);
      window.removeEventListener("pageshow", restore);
    };
  }, []);
  return <span ref={ref} hidden />;
}
