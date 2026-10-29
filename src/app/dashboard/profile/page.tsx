import { Card } from "@/components/ui";
import { requireProfile } from "@/lib/auth";
import { db } from "@/lib/db";
import { deleteSocialLink } from "../actions";
import { AddLinkForm, ProfileForm } from "./forms";

export default async function ProfileSettings() {
  const profile = await requireProfile();
  const links = await db.socialLink.findMany({ where: { profileId: profile.id }, orderBy: { position: "asc" } });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Profil</h1>
      <ProfileForm
        profile={{
          displayName: profile.displayName,
          username: profile.username,
          bio: profile.bio ?? "",
          city: profile.city ?? "",
          avatarUrl: profile.avatarUrl ?? "",
          primaryColor: (profile.theme as { primary?: string } | null)?.primary ?? "#6d28d9",
          invoicePrefix: profile.invoicePrefix,
          accountName: profile.accountName ?? "",
          bankName: profile.bankName ?? "",
          cardNumber: profile.cardNumber ?? "",
          iban: profile.iban ?? "",
        }}
      />

      <Card title="Sosial linklər">
        {links.length > 0 && (
          <ul className="mb-4 divide-y divide-gray-100">
            {links.map((link) => (
              <li key={link.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span className="min-w-0">
                  <span className="font-medium">{link.label ?? link.platform}</span>
                  <span className="block truncate text-gray-500">{link.url}</span>
                </span>
                <form action={deleteSocialLink.bind(null, link.id)}>
                  <button className="text-red-600 hover:underline">Sil</button>
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
