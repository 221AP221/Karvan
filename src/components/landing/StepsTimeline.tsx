"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export type Step = { title: string; text: string; icon: React.ReactNode };

// Scroll etdikcə xətt dolur, hər addım növbə ilə "yanır".
export function StepsTimeline({ steps }: { steps: Step[] }) {
  const root = useRef<HTMLOListElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          "[data-line]",
          { scaleY: 0 },
          {
            scaleY: 1,
            ease: "none",
            scrollTrigger: { trigger: root.current, start: "top 65%", end: "bottom 60%", scrub: 0.6 },
          },
        );

        gsap.utils.toArray<HTMLElement>("[data-step]").forEach((step) => {
          const tl = gsap.timeline({
            scrollTrigger: { trigger: step, start: "top 85%", toggleActions: "play none none reverse" },
          });
          tl.fromTo(step.querySelector("[data-dot]"), { scale: 0.6, backgroundColor: "#ffffff" }, { scale: 1, backgroundColor: "#111827", duration: 0.3, ease: "back.out(2)" })
            .fromTo(step.querySelector("[data-icon]"), { rotate: -20, scale: 0.7, autoAlpha: 0 }, { rotate: 0, scale: 1, autoAlpha: 1, duration: 0.45, ease: "back.out(1.7)" }, 0)
            .fromTo(step.querySelector("[data-body]"), { x: 24, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.5, ease: "power3.out" }, 0.05);
        });
      });
    },
    { scope: root },
  );

  return (
    <ol ref={root} className="relative mx-auto max-w-2xl">
      <span aria-hidden className="absolute bottom-6 left-[27px] top-6 w-0.5 bg-gray-200 dark:bg-white/10" />
      <span
        aria-hidden
        data-line
        className="absolute bottom-6 left-[27px] top-6 w-0.5 origin-top bg-gradient-to-b from-violet-600 via-pink-500 to-amber-400"
      />
      {steps.map((step, i) => (
        <li key={step.title} data-step className="relative flex gap-6 pb-14 last:pb-0">
          <span className="relative z-10 flex flex-col items-center">
            <span data-icon className="grid h-14 w-14 place-items-center">
              {step.icon}
            </span>
            <span data-dot className="absolute -right-1 -top-1 grid h-6 w-6 place-items-center rounded-full bg-gray-900 text-xs font-bold text-white ring-4 ring-white dark:ring-[#111215]">
              {i + 1}
            </span>
          </span>
          <div data-body className="pt-2">
            <h3 className="text-xl font-semibold sm:text-2xl">{step.title}</h3>
            <p className="mt-2 text-gray-600 sm:text-lg dark:text-gray-400">{step.text}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
