import { requireProfile } from "@/lib/auth";
import { db } from "@/lib/db";
import { PortfolioEditor } from "./PortfolioEditor";

export default async function PortfolioSettings() {
  const profile = await requireProfile();
  const items = await db.portfolioItem.findMany({ where: { profileId: profile.id }, orderBy: { position: "asc" } });
  return (
    <PortfolioEditor
      items={items.map((i) => ({
        id: i.id,
        title: i.title,
        description: i.description ?? "",
        imageUrl: i.imageUrl ?? "",
        linkUrl: i.linkUrl ?? "",
      }))}
    />
  );
}
