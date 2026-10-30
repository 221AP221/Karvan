// Səhifə analitikası: trafik mənbəyi və cihazın təyini (server tərəfdə)

export const SOURCES = ["instagram", "tiktok", "whatsapp", "facebook", "telegram", "search", "direct", "other"] as const;
export type Source = (typeof SOURCES)[number];

export const SOURCE_LABELS: Record<Source, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  whatsapp: "WhatsApp",
  facebook: "Facebook",
  telegram: "Telegram",
  search: "Google / axtarış",
  direct: "Birbaşa",
  other: "Digər saytlar",
};

// Bio linkinə əlavə olunan qısa etiketlər: karvan.az/demo?s=ig
export const SOURCE_TAGS: Record<string, Source> = {
  ig: "instagram",
  instagram: "instagram",
  tt: "tiktok",
  tiktok: "tiktok",
  wa: "whatsapp",
  whatsapp: "whatsapp",
  fb: "facebook",
  facebook: "facebook",
  tg: "telegram",
  telegram: "telegram",
};

const HOSTS: [RegExp, Source][] = [
  [/(^|\.)instagram\.com$/, "instagram"],
  [/(^|\.)tiktok\.com$/, "tiktok"],
  [/(^|\.)(whatsapp\.com|wa\.me)$/, "whatsapp"],
  [/(^|\.)(facebook\.com|fb\.com|fb\.me|messenger\.com)$/, "facebook"],
  [/(^|\.)(t\.me|telegram\.org|telegram\.me)$/, "telegram"],
  [/(^|\.)(google\.[a-z.]+|bing\.com|yandex\.[a-z.]+|duckduckgo\.com)$/, "search"],
];

export function detectSource({ tag, referrer, userAgent, ownHost }: { tag?: string; referrer?: string; userAgent: string; ownHost?: string }): Source {
  const fromTag = tag ? SOURCE_TAGS[tag.toLowerCase()] : undefined;
  if (fromTag) return fromTag;

  let host = "";
  try {
    host = referrer ? new URL(referrer).hostname.toLowerCase() : "";
  } catch {}
  if (host && host !== ownHost) {
    for (const [re, source] of HOSTS) if (re.test(host)) return source;
    return "other";
  }
  // Tətbiq daxili brauzerlər çox vaxt referrer göndərmir, amma özünü user-agent-də göstərir
  if (/Instagram/i.test(userAgent)) return "instagram";
  if (/musical_ly|Bytedance|TikTok/i.test(userAgent)) return "tiktok";
  if (/FBAN|FBAV|FB_IAB/i.test(userAgent)) return "facebook";
  if (/Telegram/i.test(userAgent)) return "telegram";
  return "direct";
}

export function detectDevice(userAgent: string): "mobile" | "desktop" {
  return /Mobi|Android|iPhone|iPad|iPod/i.test(userAgent) ? "mobile" : "desktop";
}

export function isBot(userAgent: string): boolean {
  return !userAgent || /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp\/|headless|lighthouse/i.test(userAgent);
}
