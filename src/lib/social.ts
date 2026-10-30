import type { SocialPlatform } from "@/generated/prisma/enums";

type Platform = {
  key: Exclude<SocialPlatform, "CUSTOM">;
  label: string;
  placeholder: string;
  // İstifadəçinin yazdığından (ad, @ad, nömrə və ya tam link) tam URL qurur; yararsızdırsa null
  toUrl: (input: string) => string | null;
};

const handle = (v: string) => v.trim().replace(/^@+/, "").replace(/\/+$/, "");
const isHandle = (v: string) => /^[A-Za-z0-9._-]{1,60}$/.test(v);

function fromUrlOr(base: (h: string) => string, hosts: string[]) {
  return (input: string) => {
    const v = input.trim();
    if (/^https?:\/\//i.test(v)) {
      try {
        const url = new URL(v);
        return hosts.some((h) => url.hostname === h || url.hostname.endsWith(`.${h}`)) ? url.toString() : null;
      } catch {
        return null;
      }
    }
    const h = handle(v.replace(new RegExp(`^(www\\.)?(${hosts.join("|").replace(/\./g, "\\.")})/`, "i"), ""));
    return isHandle(h) ? base(h) : null;
  };
}

export const PLATFORMS: Platform[] = [
  { key: "INSTAGRAM", label: "Instagram", placeholder: "@istifadeci_adi", toUrl: fromUrlOr((h) => `https://instagram.com/${h}`, ["instagram.com"]) },
  { key: "TIKTOK", label: "TikTok", placeholder: "@istifadeci_adi", toUrl: fromUrlOr((h) => `https://www.tiktok.com/@${h}`, ["tiktok.com"]) },
  {
    key: "WHATSAPP",
    label: "WhatsApp",
    placeholder: "+994 50 123 45 67",
    toUrl: (v) => {
      if (/^https?:\/\/(wa\.me|api\.whatsapp\.com)\//i.test(v.trim())) return v.trim();
      let digits = v.replace(/\D/g, "");
      if (digits.startsWith("0")) digits = "994" + digits.slice(1);
      if (digits.length === 9) digits = "994" + digits;
      return /^994\d{9}$/.test(digits) ? `https://wa.me/${digits}` : null;
    },
  },
  { key: "TELEGRAM", label: "Telegram", placeholder: "@istifadeci_adi", toUrl: fromUrlOr((h) => `https://t.me/${h}`, ["t.me", "telegram.me"]) },
  { key: "YOUTUBE", label: "YouTube", placeholder: "@kanal", toUrl: fromUrlOr((h) => `https://youtube.com/@${h}`, ["youtube.com", "youtu.be"]) },
  { key: "FACEBOOK", label: "Facebook", placeholder: "səhifə adı", toUrl: fromUrlOr((h) => `https://facebook.com/${h}`, ["facebook.com", "fb.com"]) },
  { key: "LINKEDIN", label: "LinkedIn", placeholder: "profil adı", toUrl: fromUrlOr((h) => `https://www.linkedin.com/in/${h}`, ["linkedin.com"]) },
  { key: "BEHANCE", label: "Behance", placeholder: "istifadəçi adı", toUrl: fromUrlOr((h) => `https://www.behance.net/${h}`, ["behance.net"]) },
  { key: "DRIBBBLE", label: "Dribbble", placeholder: "istifadəçi adı", toUrl: fromUrlOr((h) => `https://dribbble.com/${h}`, ["dribbble.com"]) },
  { key: "X", label: "X (Twitter)", placeholder: "@istifadeci_adi", toUrl: fromUrlOr((h) => `https://x.com/${h}`, ["x.com", "twitter.com"]) },
  { key: "THREADS", label: "Threads", placeholder: "@istifadeci_adi", toUrl: fromUrlOr((h) => `https://www.threads.net/@${h}`, ["threads.net", "threads.com"]) },
  { key: "PINTEREST", label: "Pinterest", placeholder: "istifadəçi adı", toUrl: fromUrlOr((h) => `https://pinterest.com/${h}`, ["pinterest.com"]) },
  {
    key: "EMAIL",
    label: "E-poçt",
    placeholder: "ad@nümunə.az",
    toUrl: (v) => {
      const email = v.trim().replace(/^mailto:/i, "");
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? `mailto:${email}` : null;
    },
  },
  { key: "WEBSITE", label: "Sayt", placeholder: "https://saytiniz.az", toUrl: (v) => safeUrl(v.includes("://") ? v : `https://${v}`) },
];

export const PLATFORM_BY_KEY = Object.fromEntries(PLATFORMS.map((p) => [p.key, p])) as Record<Platform["key"], Platform>;

// Yalnız http(s) linklərinə icazə veririk (javascript: və s. bloklanır)
export function safeUrl(input: string): string | null {
  try {
    const url = new URL(input.trim());
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

// Saxlanmış linkdən formada göstəriləcək qısa dəyər
export function displayValue(platform: Platform["key"], url: string): string {
  if (platform === "EMAIL") return url.replace(/^mailto:/, "");
  if (platform === "WHATSAPP") return url.replace(/^https:\/\/wa\.me\/994/, "0");
  if (platform === "WEBSITE") return url;
  try {
    const path = decodeURIComponent(new URL(url).pathname).replace(/^\/(in\/)?@?/, "").replace(/\/$/, "");
    return path ? `@${path}` : url;
  } catch {
    return url;
  }
}
