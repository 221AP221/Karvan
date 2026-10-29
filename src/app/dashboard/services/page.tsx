import Link from "next/link";
import { buttonClass } from "@/components/ui";
import { requireProfile } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatAzn } from "@/lib/money";
import { deleteService, toggleService } from "../actions";

export default async function Services() {
  const profile = await requireProfile();
  const services = await db.service.findMany({ where: { profileId: profile.id }, orderBy: { position: "asc" } });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Xidmətlər</h1>
        <Link href="/dashboard/services/new" className={buttonClass}>+ Yeni xidmət</Link>
      </div>
      {services.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-gray-300 p-10 text-center text-gray-500">
          Hələ xidmət yoxdur. İlk xidmətinizi əlavə edin, səhifənizdə "Sifariş et" düyməsi görünəcək.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {services.map((s) => (
            <li key={s.id} className={`rounded-2xl border border-gray-200 bg-white p-4 ${s.isActive ? "" : "opacity-60"}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium">{s.title}</p>
                  <p className="text-sm text-gray-500">
                    {s.priceType === "FIXED" && s.amountQepik !== null ? formatAzn(s.amountQepik) : "Razılaşma ilə"}
                    {s.duration && ` · ${s.duration}`}
                    {!s.isActive && " · gizlədilib"}
                  </p>
                </div>
                <div className="flex gap-3 text-sm">
                  <Link href={`/dashboard/services/${s.id}`} className="text-[var(--brand)] hover:underline">Redaktə</Link>
                  <form action={toggleService.bind(null, s.id)}>
                    <button className="text-gray-600 hover:underline">{s.isActive ? "Gizlət" : "Göstər"}</button>
                  </form>
                  <form action={deleteService.bind(null, s.id)}>
                    <button className="text-red-600 hover:underline">Sil</button>
                  </form>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
