import { ExternalLink, Trash2 } from "lucide-react";
import { Card } from "@/components/ui";
import { requireProfile } from "@/lib/auth";
import { db } from "@/lib/db";
import { PLATFORMS, displayValue } from "@/lib/social";
import { deleteCustomLink } from "../actions";
import { AddLinkForm, SocialsForm } from "./forms";

export default async function SocialSettings() {
  const profile = await requireProfile();
  const links = await db.socialLink.findMany({ where: { profileId: profile.id }, orderBy: { position: "asc" } });
  const values = Object.fromEntries(
    PLATFORMS.map((p) => {
      const link = links.find((l) => l.platform === p.key);
      return [p.key, link ? displayValue(p.key, link.url) : ""];
    }),
  );
  const custom = links.filter((l) => l.platform === "CUSTOM");

  return (
    <div className="flex flex-col gap-6">
      <SocialsForm values={values} />

      <Card title="Linklər">
        <p className="-mt-2 mb-4 text-sm text-gray-500">
          Portfolio, menyu, qiymət siyahısı, Google Maps ünvanı — səhifənizdə böyük düymə kimi görünür.
        </p>
        {custom.length > 0 && (
          <ul className="mb-4 divide-y divide-gray-100 rounded-xl border border-gray-200">
            {custom.map((link) => (
              <li key={link.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <span className="min-w-0">
                  <span className="block font-medium">{link.label}</span>
                  <a href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 truncate text-gray-500 hover:text-gray-900">
                    {link.url} <ExternalLink size={12} aria-hidden />
                  </a>
                </span>
                <form action={deleteCustomLink.bind(null, link.id)}>
                  <button className="grid h-8 w-8 place-items-center rounded-full text-gray-400 hover:bg-red-50 hover:text-red-600" aria-label={`${link.label} linkini sil`}>
                    <Trash2 size={16} strokeWidth={1.75} aria-hidden />
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
        <AddLinkForm />
      </Card>
    </div>
  );
}
