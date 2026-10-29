import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { db } from "@/lib/db";
import { ServiceForm } from "../ServiceForm";

export default async function EditService({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requireProfile();
  const service = await db.service.findFirst({ where: { id: (await params).id, profileId: profile.id } });
  if (!service) notFound();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Xidməti redaktə et</h1>
      <ServiceForm
        service={{
          id: service.id,
          title: service.title,
          description: service.description ?? "",
          priceType: service.priceType,
          amount: service.amountQepik === null ? "" : String(service.amountQepik / 100),
          duration: service.duration ?? "",
        }}
      />
    </div>
  );
}
