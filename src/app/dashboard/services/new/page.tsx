import { requirePageAccess } from "@/lib/auth";
import { ServiceForm } from "../ServiceForm";

export default async function NewService() {
  await requirePageAccess("services");

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Yeni xidmət</h1>
      <ServiceForm
        service={{ title: "", category: "", customCategory: "", imageUrl: "", description: "", priceType: "FIXED", amount: "", currency: "AZN", durationDays: "", durationWeeks: "", durationMonths: "" }}
      />
    </div>
  );
}
