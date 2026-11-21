"use client";

import { useState } from "react";

// Üzərinə gəlindikdən sonra başlıq/mətn açıq qalır — səhifə yenilənənə qədər geri qapanmır.
// `icon` artıq server tərəfdə render olunmuş element kimi gəlir (server->client sərhədindən
// funksiya (ikon komponenti) keçirilə bilmir, yalnız hazır React node).
export function FeatureCard({ icon, title, text, lead }: { icon: React.ReactNode; title: string; text: string; lead?: boolean }) {
  const [revealed, setRevealed] = useState(false);
  const reveal = () => setRevealed(true);

  return (
    <div
      onMouseEnter={reveal}
      onFocus={reveal}
      onClick={reveal}
      tabIndex={0}
      className={`group flex h-full min-h-[200px] flex-col items-center justify-center rounded-3xl border p-7 text-center transition duration-300 hover:-translate-y-1 hover:shadow-xl ${
        lead
          ? "border-pink-200/70 bg-gradient-to-br from-pink-50 to-white hover:border-pink-300 hover:shadow-pink-500/10 sm:col-span-2 dark:border-pink-400/20 dark:from-pink-500/[0.07] dark:to-transparent"
          : "border-gray-200 bg-white hover:border-violet-200 hover:shadow-violet-500/10 dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-violet-400/30"
      }`}
    >
      <span className="transition-transform duration-300 group-hover:-translate-y-1 group-hover:scale-110">{icon}</span>
      <h3
        className={`mt-5 font-semibold transition-all duration-300 ${revealed ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"} ${lead ? "text-xl" : "text-lg"}`}
      >
        {title}
      </h3>
      <p
        className={`mt-2 text-gray-600 transition-all delay-100 duration-300 dark:text-gray-400 ${revealed ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"} ${lead ? "max-w-md" : ""}`}
      >
        {text}
      </p>
    </div>
  );
}
