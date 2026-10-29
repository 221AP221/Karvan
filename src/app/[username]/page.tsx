import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatAzn } from "@/lib/money";
import { OrderForm } from "./OrderForm";

type Props = { params: Promise<{ username: string }> };

async function getProfile(username: string) {
  return db.profile.findUnique({
    where: { username: username.toLowerCase() },
    include: {
      socialLinks: { orderBy: { position: "asc" } },
      services: { where: { isActive: true }, orderBy: { position: "asc" } },
    },
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const profile = await getProfile((await params).username);
  if (!profile) return {};
  return { title: `${profile.displayName} · BioFaktura`, description: profile.bio ?? undefined };
}

export default async function ProfilePage({ params }: Props) {
  const profile = await getProfile((await params).username);
  if (!profile) notFound();

  const theme = (profile.theme ?? {}) as { primary?: string };

  return (
    <main className="mx-auto max-w-md px-4 py-10" style={{ "--brand": theme.primary } as React.CSSProperties}>
      <header className="text-center">
        {profile.avatarUrl && (
          <img src={profile.avatarUrl} alt="" className="mx-auto h-24 w-24 rounded-full object-cover" />
        )}
        <h1 className="mt-4 text-2xl font-bold">{profile.displayName}</h1>
        {profile.bio && <p className="mt-2 text-gray-600">{profile.bio}</p>}
      </header>

      <nav className="mt-6 flex flex-col gap-2">
        {profile.socialLinks.map((link) => (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border bg-white px-4 py-3 text-center font-medium"
          >
            {link.label ?? link.platform}
          </a>
        ))}
      </nav>

      {profile.services.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 text-lg font-semibold">Xidmətlər</h2>
          <ul className="flex flex-col gap-3">
            {profile.services.map((service) => (
              <li key={service.id} className="rounded-xl border bg-white p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-medium">{service.title}</h3>
                    {service.duration && <p className="text-sm text-gray-500">{service.duration}</p>}
                  </div>
                  <span className="whitespace-nowrap font-semibold">
                    {service.priceType === "FIXED" && service.amountQepik !== null
                      ? formatAzn(service.amountQepik)
                      : "Razılaşma ilə"}
                  </span>
                </div>
                {service.description && <p className="mt-2 text-sm text-gray-600">{service.description}</p>}
                <OrderForm serviceId={service.id} fixedPrice={service.priceType === "FIXED"} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
