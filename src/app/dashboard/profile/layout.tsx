import { ExternalLink } from "lucide-react";
import { secondaryButtonClass } from "@/components/ui";
import { requirePageAccess } from "@/lib/auth";
import { ProfileTabs } from "./Tabs";

export default async function ProfileLayout({ children }: { children: React.ReactNode }) {
  const profile = await requirePageAccess("profile");
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Səhifəm</h1>
          <p className="text-sm text-gray-500">Müştərilərin gördüyü səhifəni burada qurursunuz</p>
        </div>
        <a href={`/${profile.username}`} target="_blank" className={`${secondaryButtonClass} gap-2`}>
          <ExternalLink size={16} strokeWidth={1.75} aria-hidden /> Səhifəyə bax
        </a>
      </div>
      <ProfileTabs />
      {children}
    </div>
  );
}
