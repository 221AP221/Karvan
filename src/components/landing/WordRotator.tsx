"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { useRef } from "react";

gsap.registerPlugin(useGSAP);

// Sözlər eyni grid xanasında dayanır: genişlik ən uzun sözə bərabərdir, səhifə tərpənmir.
// Köhnə söz tam çıxandan sonra yenisi gəlir, ona görə hərflər heç vaxt üst-üstə düşmür.
export function WordRotator({ words, interval = 2.4, className = "" }: { words: string[]; interval?: number; className?: string }) {
  const root = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const items = gsap.utils.toArray<HTMLElement>("[data-word]");
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.set(items, { yPercent: 110, autoAlpha: 0 });
        gsap.set(items[0], { yPercent: 0, autoAlpha: 1 });
        const tl = gsap.timeline({ repeat: -1 });
        items.forEach((item, i) => {
          const next = items[(i + 1) % items.length];
          tl.to(item, { yPercent: -110, autoAlpha: 0, duration: 0.35, ease: "power3.in" }, `+=${interval}`)
            .fromTo(next, { yPercent: 110, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.55, ease: "power3.out" });
        });
      });
    },
    { scope: root },
  );

  return (
    <span ref={root} className={`relative inline-grid overflow-hidden pb-[0.12em] align-bottom ${className}`}>
      <span className="sr-only">{words[0]}</span>
      {words.map((word, i) => (
        <span
          key={word}
          data-word
          aria-hidden
          className={`col-start-1 row-start-1 whitespace-nowrap bg-gradient-to-r from-violet-600 via-pink-600 to-amber-500 bg-clip-text text-transparent ${i === 0 ? "" : "invisible"}`}
        >
          {word}
        </span>
      ))}
    </span>
  );
}
