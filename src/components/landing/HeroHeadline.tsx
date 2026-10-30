"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { useRef } from "react";

gsap.registerPlugin(useGSAP);

const HOLD = 2.4;

// Hero başlığı. Hər sətir ayrıca blokdur və aralarında həqiqi boşluq var, ona görə hansı şrift və
// ekran eni olursa olsun yapışmırlar. DOM-da hər an yalnız aktiv söz durur: brauzer, Google və
// ekran oxuyucuları "Profil linkiniz satış edir" oxuyur.
export function HeroHeadline({ lead, words, className = "" }: { lead: string[]; words: string[]; className?: string }) {
  const root = useRef<HTMLHeadingElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // 1-ci sətir: sözlər maskanın altından qalxır
        gsap.from("[data-lead]", { yPercent: 105, duration: 0.8, ease: "power4.out", stagger: 0.08 });

        // 2-ci sətir: iki yuva növbə ilə işləyir; yeni söz köhnəsi tam çıxandan sonra gəlir
        const slots = gsap.utils.toArray<HTMLElement>("[data-slot]");
        // Gözləyən yuva tam gizlidir ki, kənarı cari sözün altında görünməsin
        gsap.set(slots[1], { yPercent: 125, autoAlpha: 0 });
        gsap.from(slots[0], { yPercent: 125, duration: 0.8, ease: "power4.out", delay: 0.18 });

        let index = 0;
        let current = 0;
        let timer: gsap.core.Tween | undefined;
        const cycle = () => {
          const out = slots[current];
          const next = slots[1 - current];
          index = (index + 1) % words.length;
          next.textContent = words[index];
          gsap
            .timeline({
              onComplete: () => {
                out.textContent = "";
                current = 1 - current;
                timer = gsap.delayedCall(HOLD, cycle);
              },
            })
            .to(out, { yPercent: -125, autoAlpha: 0, duration: 0.4, ease: "power3.in" })
            .fromTo(next, { yPercent: 125, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.6, ease: "power3.out" });
        };
        timer = gsap.delayedCall(HOLD + 0.8, cycle);
        return () => timer?.kill();
      });
    },
    { scope: root, dependencies: [words] },
  );

  return (
    <h1 ref={root} className={`font-display font-extrabold tracking-[-0.022em] ${className}`}>
      <span className="block">
        {lead.map((word, i) => (
          <span key={word}>
            <span className="inline-block overflow-hidden pb-[0.08em] align-bottom">
              <span data-lead className="inline-block">
                {word}
              </span>
            </span>
            {i < lead.length - 1 && " "}
          </span>
        ))}
      </span>{" "}
      <span className="grid justify-items-center overflow-hidden pb-[0.14em] lg:justify-items-start">
        {[words[0], ""].map((word, i) => (
          <span
            key={i}
            data-slot
            className="col-start-1 row-start-1 whitespace-nowrap bg-gradient-to-r from-violet-600 via-fuchsia-600 to-amber-500 bg-clip-text dark:from-violet-400 dark:via-fuchsia-400 dark:to-amber-300 text-transparent"
          >
            {word}
          </span>
        ))}
      </span>
    </h1>
  );
}
