import { notFound } from "next/navigation";
import { requirePageAccess } from "@/lib/auth";
import { db } from "@/lib/db";
import { ServiceForm } from "../ServiceForm";

export default async function EditService({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requirePageAccess("services");
  const service = await db.service.findFirst({ where: { id: (await params).id, profileId: profile.id } });
  if (!service) notFound();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Xidməti redaktə et</h1>
      <ServiceForm
        service={{
          id: service.id,
          title: service.title,
          category: service.category ?? "",
          customCategory: service.customCategory ?? "",
          imageUrl: service.imageUrl ?? "",
          description: service.description ?? "",
          priceType: service.priceType,
          amount: service.amountQepik === null ? "" : String(service.amountQepik / 100),
          currency: service.currency,
          durationDays: service.durationDays ? String(service.durationDays) : "",
          durationWeeks: service.durationWeeks ? String(service.durationWeeks) : "",
          durationMonths: service.durationMonths ? String(service.durationMonths) : "",
          legacyDuration: service.duration ?? undefined,
          durationMin: service.durationMin ? String(service.durationMin) : "",
          location: service.location,
          depositPercent: service.depositPercent ? String(service.depositPercent) : "",
          cancelWindowHours: String(service.cancelWindowHours),
        }}
      />
    </div>
  );
}
