import { SITE_URL } from "@/i18n/config";

// Mətn şablonları: "{name} — {profession}" → dəyərlərlə doldurulur
export function fill(template: string, vars: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? "")).replace(/\s+/g, " ").trim();
}

// Axtarış nəticəsində kəsilməsin: təsvir ~160, başlıq ~60 simvol
export function clamp(text: string, max = 160) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), max - 20)).trimEnd()}…`;
}

export const absoluteUrl = (path: string) => `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;

// JSON-LD: </script> ilə bağlanmasın deyə < işarəsi escape edilir
export const jsonLdScript = (data: unknown) => ({ __html: JSON.stringify(data).replace(/</g, "\\u003c") });

export function breadcrumbs(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({ "@type": "ListItem", position: i + 1, name: item.name, item: absoluteUrl(item.path) })),
  };
}
