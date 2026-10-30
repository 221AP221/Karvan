import { Globe, Link2, Mail } from "lucide-react";
import type { SocialPlatform } from "@/generated/prisma/enums";
import { BRAND_ICONS } from "@/lib/brand-icons";

export function SocialIcon({ platform, size = 20, color = false }: { platform: SocialPlatform; size?: number; color?: boolean }) {
  if (platform === "EMAIL") return <Mail size={size} strokeWidth={1.75} aria-hidden />;
  if (platform === "WEBSITE") return <Globe size={size} strokeWidth={1.75} aria-hidden />;
  if (platform === "CUSTOM") return <Link2 size={size} strokeWidth={1.75} aria-hidden />;
  if (platform === "LINKEDIN") {
    return (
      <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden fill={color ? "#0A66C2" : "currentColor"}>
        <rect width="24" height="24" rx="4" />
        <text x="12" y="17.5" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="700" fontSize="14" fill="#fff">in</text>
      </svg>
    );
  }
  const icon = BRAND_ICONS[platform];
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden fill={color ? icon.hex : "currentColor"}>
      <path d={icon.path} />
    </svg>
  );
}
