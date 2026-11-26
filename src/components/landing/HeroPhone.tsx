"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { BatteryFull, Check, FileText, ShoppingBag, SignalHigh, Wifi } from "lucide-react";
import { useRef } from "react";
import { IconBadge } from "./IconBadge";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export type PhoneText = {
  name: string;
  role: string;
  services: string;
  items: { title: string; price: string }[];
  order: string;
  cards: { order: string; orderValue: string; invoice: string; paid: string };
};

function cards(t: PhoneText) {
  return [
    {
      position: "-left-4 -top-6 sm:-left-28 sm:top-24",
      speed: -60,
      className: "border border-gray-200 bg-white/95",
      icon: <IconBadge icon={ShoppingBag} size="sm" />,
      label: t.cards.order,
      value: t.cards.orderValue,
    },
    {
      position: "-right-28 top-[52%] hidden sm:block",
      speed: -110,
      className: "border border-gray-200 bg-white/95",
      icon: <IconBadge icon={FileText} size="sm" tone="info" />,
      label: t.cards.invoice,
      value: "LEY-2026-0042",
      mono: true,
    },
    {
      position: "-bottom-6 left-4 sm:-left-8",
      speed: -30,
      className: "bg-emerald-600 text-white shadow-emerald-600/30",
      icon: (
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/20 ring-1 ring-white/30">
          <Check size={18} strokeWidth={2.5} aria-hidden />
        </span>
      ),
      label: t.cards.paid,
      labelClass: "text-emerald-100",
      value: "+40,00 AZN",
    },
  ];
}

// Hero telefonu: giriş animasiyası, siçana görə 3D əyilmə, scroll zamanı parallaks.
export function HeroPhone({ t }: { t: PhoneText }) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const phone = root.current!.querySelector<HTMLElement>("[data-phone]")!;
      const cards = gsap.utils.toArray<HTMLElement>("[data-card]");

      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set([phone, ...cards], { autoAlpha: 1 });
      });

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const intro = gsap.timeline({ defaults: { ease: "expo.out" } });
        intro
          .fromTo(
            phone,
            { autoAlpha: 0, y: 120, rotateX: 25, rotateZ: -6, scale: 0.9 },
            { autoAlpha: 1, y: 0, rotateX: 0, rotateZ: 0, scale: 1, duration: 1.1 },
            0,
          )
          .fromTo(
            cards,
            { autoAlpha: 0, scale: 0.6, y: 40 },
            { autoAlpha: 1, scale: 1, y: 0, duration: 0.6, ease: "back.out(1.6)", stagger: 0.18 },
            0.5,
          );

        // Kartlar müstəqil şəkildə yüngülcə üzür
        cards.forEach((card, i) => {
          gsap.to(card.firstElementChild, {
            y: -12,
            duration: 2.4 + i * 0.6,
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1,
            delay: i * 0.4,
          });
        });

        // Scroll parallaksı: telefon və kartlar müxtəlif sürətlə hərəkət edir
        const scroll = { trigger: root.current, start: "top 30%", end: "bottom top", scrub: 1 };
        gsap.to(phone, { yPercent: 18, rotateZ: 4, ease: "none", scrollTrigger: scroll });
        cards.forEach((card) => {
          gsap.to(card, { y: Number(card.dataset.speed), ease: "none", scrollTrigger: scroll });
        });
      });

      // Masaüstündə siçana görə 3D əyilmə
      mm.add("(prefers-reduced-motion: no-preference) and (pointer: fine)", () => {
        const rotX = gsap.quickTo(phone, "rotateX", { duration: 0.8, ease: "power3.out" });
        const rotY = gsap.quickTo(phone, "rotateY", { duration: 0.8, ease: "power3.out" });
        const onMove = (e: PointerEvent) => {
          rotY((e.clientX / window.innerWidth - 0.5) * 16);
          rotX(-(e.clientY / window.innerHeight - 0.5) * 12);
        };
        window.addEventListener("pointermove", onMove);
        return () => window.removeEventListener("pointermove", onMove);
      });
    },
    { scope: root },
  );

  return (
    <div ref={root} className="relative mx-auto w-full max-w-[340px] [perspective:1200px]">
      <div
        aria-hidden
        className="absolute -inset-10 -z-10 rounded-full bg-gradient-to-tr from-violet-400/40 via-pink-300/40 to-amber-200/40 blur-3xl"
      />

      <div
        data-phone
        className="invisible relative rounded-[2.6rem] border-[8px] border-gray-900 bg-gray-900 text-gray-900 shadow-2xl shadow-violet-900/25 [transform-style:preserve-3d] dark:border-gray-700"
      >
        {/* Həcm düymələri: yan tərəflərdəki kiçik çıxıntılar real cihaz çərçivəsi hissi verir */}
        <span className="absolute -left-[10px] top-20 h-6 w-[3px] rounded-l-full bg-gray-800 dark:bg-gray-600" aria-hidden />
        <span className="absolute -left-[10px] top-32 h-10 w-[3px] rounded-l-full bg-gray-800 dark:bg-gray-600" aria-hidden />
        <span className="absolute -right-[10px] top-28 h-14 w-[3px] rounded-r-full bg-gray-800 dark:bg-gray-600" aria-hidden />
        <div className="absolute left-1/2 top-2 z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-gray-900" />
        <div className="overflow-hidden rounded-[2rem] bg-gradient-to-b from-pink-50 to-white px-5 pb-6 text-gray-900">
          {/* Status bar: ekranın real tətbiq olduğunu dərhal göstərir */}
          <div className="flex items-center justify-between pb-1 pt-2.5 text-[11px] font-semibold text-gray-900">
            <span>9:41</span>
            <span className="flex items-center gap-1 text-gray-900">
              <SignalHigh size={13} strokeWidth={2.2} aria-hidden />
              <Wifi size={13} strokeWidth={2.2} aria-hidden />
              <BatteryFull size={15} strokeWidth={2.2} aria-hidden />
            </span>
          </div>
          <div className="pt-4 text-center">
            <div className="mx-auto h-16 w-16 rounded-full bg-gradient-to-br from-pink-500 to-violet-600 p-0.5">
              <div className="grid h-full w-full place-items-center rounded-full bg-white text-xl font-bold text-pink-600">LH</div>
            </div>
            <p className="mt-2 font-semibold">{t.name}</p>
            <p className="text-xs text-gray-500">{t.role}</p>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-medium">
            <span className="rounded-xl border border-gray-200 bg-white py-2 text-center">Instagram</span>
            <span className="rounded-xl border border-gray-200 bg-white py-2 text-center">WhatsApp</span>
          </div>
          <p className="mb-2 mt-5 text-xs font-semibold uppercase text-gray-500">{t.services}</p>
          {t.items.map((s) => (
            <div key={s.title} className="mb-2 rounded-2xl border border-gray-200 bg-white p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{s.title}</span>
                <span className="font-semibold text-gray-700">{s.price}</span>
              </div>
              <span className="mt-2 block rounded-full bg-pink-600 py-1.5 text-center text-xs font-medium text-white">
                {t.order}
              </span>
            </div>
          ))}
        </div>
      </div>

      {cards(t).map((card) => (
        <div key={card.label} data-card data-speed={card.speed} className={`invisible absolute ${card.position}`}>
          <div className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-gray-900 shadow-xl backdrop-blur ${card.className}`}>
            {card.icon}
            <span className="text-left">
              <span className={`block text-xs ${card.labelClass ?? "text-gray-500"}`}>{card.label}</span>
              <span className={`block text-sm font-semibold ${card.mono ? "tabular-nums" : ""}`}>{card.value}</span>
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
