// Karvan loqosu (SVG): "KARV" qrafit, "AN" və K/R ayaqları çəhrayı. Hər ölçüdə kəskin qalır.

export const BRAND = { charcoal: "#3D3F46", pink: "#EC1C8C" };

export function KarvanWordmark({ tone = "light", className = "h-6 w-auto" }: { tone?: "light" | "dark"; className?: string }) {
  const ink = tone === "dark" ? "#FFFFFF" : BRAND.charcoal;
  return (
    <svg viewBox="0 0 498 100" className={className} role="img" aria-label="Karvan">
      <g fill={ink}>
        <rect x="0" y="0" width="20" height="100" />
        <polygon points="20,46 54,0 79,0 20,79" />
        <polygon points="68,100 107,0 130,0 91,100" />
        <path fillRule="evenodd" d="M140 0H188A30 30 0 0 1 188 60H160V100H140ZM160 19V41H187A11 11 0 0 0 187 19Z" />
        <polygon points="222,0 246,0 268,68 290,0 314,0 280,100 256,100" />
      </g>
      <g fill={BRAND.pink}>
        <polygon points="36,56 50,39 86,100 61,100" opacity=".95" />
        <polygon points="170,60 194,60 222,100 197,100" opacity=".95" />
        <path fillRule="evenodd" d="M320 100L352 0H377L409 100H385L378 79H351L344 100ZM357 60H372L364.5 35Z" />
        <polygon points="422,0 444,0 477,60 477,0 498,0 498,100 476,100 443,40 443,100 422,100" />
      </g>
    </svg>
  );
}

export function KarvanMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <rect width="64" height="64" rx="16" fill={BRAND.charcoal} />
      <g transform="translate(17 15) scale(0.34)">
        <rect x="0" y="0" width="20" height="100" fill="#fff" />
        <polygon points="20,46 54,0 79,0 20,79" fill="#fff" />
        <polygon points="36,56 50,39 86,100 61,100" fill={BRAND.pink} />
      </g>
    </svg>
  );
}

// Saytdakı bütün loqolar: yalnız KARVAN yazısı (K ikonu yoxdur). KarvanMark yalnız brauzer ikonu (favicon) üçün qalır.
export function Logo({ tone = "light", size = "md" }: { tone?: "light" | "dark"; size?: "sm" | "md" | "lg" }) {
  const h = { sm: "h-4", md: "h-6", lg: "h-8" }[size];
  return (
    <span className="inline-flex items-center">
      <KarvanWordmark tone={tone} className={`${h} w-auto`} />
    </span>
  );
}
