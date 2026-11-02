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

// Kataloq türk və rus dillərində də göstərilir
export const CATEGORY_LABELS: Record<"tr" | "ru" | "en", Record<ServiceCategory, string>> = {
  en: {
    beauty: "Beauty and care",
    education: "Education and tutoring",
    design: "Design",
    marketing: "Social media and ads",
    photo_video: "Photo and video",
    fitness: "Fitness and health",
    consulting: "Consulting",
    psychology: "Psychology",
    it: "IT and programming",
    events: "Events",
    translation: "Translation",
    other: "Other",
  },
  tr: {
    beauty: "Güzellik ve bakım",
    education: "Eğitim ve özel ders",
    design: "Tasarım",
    marketing: "Sosyal medya ve reklam",
    photo_video: "Fotoğraf ve video",
    fitness: "Fitness ve sağlık",
    consulting: "Danışmanlık",
    psychology: "Psikoloji",
    it: "BT ve yazılım",
    events: "Etkinlikler",
    translation: "Çeviri",
    other: "Diğer",
  },
  ru: {
    beauty: "Красота и уход",
    education: "Образование и репетиторство",
    design: "Дизайн",
    marketing: "SMM и реклама",
    photo_video: "Фото и видео",
    fitness: "Фитнес и здоровье",
    consulting: "Консалтинг",
    psychology: "Психология",
    it: "IT и программирование",
    events: "Мероприятия",
    translation: "Переводы",
    other: "Другое",
  },
};

export function localizedCategory(key: string | null | undefined, locale: "az" | "tr" | "ru" | "en"): string | null {
  if (!key) return null;
  if (locale === "az") return categoryLabel(key);
  return CATEGORY_LABELS[locale][key as ServiceCategory] ?? null;
}

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
