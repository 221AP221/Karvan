import { getDictionary } from "@/i18n/server";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { OG_CONTENT_TYPE, OG_SIZE, ogImage, ogText } from "@/lib/og";

export const alt = "Karvan";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

// Satıcının linki paylaşılanda: adı, peşəsi və ən ucuz xidmətin qiyməti görünür
export default async function Image({ params }: { params: Promise<{ username: string }> }) {
  const t = getDictionary("az");
  const profile = await db.profile.findUnique({
    where: { username: (await params).username.toLowerCase() },
    select: {
      displayName: true,
      profession: true,
      city: true,
      services: { where: { isActive: true, blocked: false }, select: { title: true, amountQepik: true, currency: true, priceType: true } },
    },
  });
  if (!profile) return ogImage({ title: "Karvan", subtitle: t.meta.description });

  const cheapest = profile.services.filter((s) => s.priceType === "FIXED" && s.amountQepik !== null).sort((a, b) => a.amountQepik! - b.amountQepik!)[0];
  const subtitle = [profile.services.slice(0, 3).map((s) => s.title).join(" · "), cheapest ? `${formatMoney(cheapest.amountQepik!, cheapest.currency)}-dən` : ""]
    .filter(Boolean)
    .join(" · ");
  return ogImage({
    title: ogText(profile.displayName, 42),
    subtitle: ogText(subtitle, 120),
    badge: [profile.profession, profile.city].filter(Boolean).join(" · ") || undefined,
  });
}
