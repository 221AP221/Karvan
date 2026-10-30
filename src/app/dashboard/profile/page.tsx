import { requireProfile } from "@/lib/auth";
import { BasicsForm } from "./BasicsForm";

export default async function ProfileBasics() {
  const profile = await requireProfile();
  return (
    <BasicsForm
      profile={{
        displayName: profile.displayName,
        username: profile.username,
        profession: profile.profession ?? "",
        bio: profile.bio ?? "",
        about: profile.about ?? "",
        city: profile.city ?? "",
        avatarUrl: profile.avatarUrl ?? "",
        coverUrl: profile.coverUrl ?? "",
        primaryColor: (profile.theme as { primary?: string } | null)?.primary ?? "#D6127E",
      }}
    />
  );
}
