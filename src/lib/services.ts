export const SERVICE_CATEGORIES = [
  { key: "beauty", label: "Gözəllik və baxım" },
  { key: "education", label: "Təhsil və repetitorluq" },
  { key: "design", label: "Dizayn" },
  { key: "marketing", label: "SMM və reklam" },
  { key: "photo_video", label: "Foto və video" },
  { key: "fitness", label: "Fitness və sağlamlıq" },
  { key: "consulting", label: "Konsultasiya" },
  { key: "psychology", label: "Psixologiya" },
  { key: "it", label: "IT və proqramlaşdırma" },
  { key: "events", label: "Tədbirlər" },
  { key: "translation", label: "Tərcümə" },
  { key: "other", label: "Digər" },
] as const;

export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number]["key"];

export const categoryLabel = (key: string | null | undefined) =>
  SERVICE_CATEGORIES.find((c) => c.key === key)?.label ?? null;

// "1 ay 2 həftə 3 gün"; strukturlu müddət yoxdursa köhnə sərbəst mətn
export function formatDuration(s: {
  durationMonths?: number | null;
  durationWeeks?: number | null;
  durationDays?: number | null;
  duration?: string | null;
}): string | null {
  const parts = [
    s.durationMonths ? `${s.durationMonths} ay` : null,
    s.durationWeeks ? `${s.durationWeeks} həftə` : null,
    s.durationDays ? `${s.durationDays} gün` : null,
  ].filter(Boolean);
  return parts.length ? parts.join(" ") : (s.duration ?? null);
}
