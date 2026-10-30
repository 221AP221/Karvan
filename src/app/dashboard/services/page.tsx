import { Clock, Eye, EyeOff, Pencil, Plus, ShoppingBag, Tag, Trash2 } from "lucide-react";
import Link from "next/link";
import { FilterBar } from "@/components/FilterBar";
import { buttonClass } from "@/components/ui";
import type { Prisma } from "@/generated/prisma/client";
import { requireProfile } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { type SearchParams, param } from "@/lib/search-params";
import { SERVICE_CATEGORIES, categoryLabel, formatDuration } from "@/lib/services";
import { deleteService, toggleService } from "../actions";

export default async function Services({ searchParams }: { searchParams: SearchParams }) {
  const profile = await requireProfile();
  const sp = await searchParams;
  const q = param(sp, "q");
  const category = param(sp, "category");
  const status = param(sp, "status");
  const price = param(sp, "price");

  const where: Prisma.ServiceWhereInput = {
    profileId: profile.id,
    ...(q && { OR: [{ title: { contains: q, mode: "insensitive" } }, { description: { contains: q, mode: "insensitive" } }] }),
    ...(category && { category }),
    ...(status === "active" && { isActive: true }),
    ...(status === "hidden" && { isActive: false }),
    ...((price === "FIXED" || price === "NEGOTIABLE") && { priceType: price }),
  };
  const [services, total] = await Promise.all([
    db.service.findMany({ where, orderBy: { position: "asc" } }),
    db.service.count({ where: { profileId: profile.id } }),
  ]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Xidmətlər</h1>
          <p className="text-sm text-gray-500">Səhifənizdə “Sifariş et” düyməsi ilə görünür</p>
        </div>
        <Link href="/dashboard/services/new" className={`${buttonClass} gap-1.5`}>
          <Plus size={16} aria-hidden /> Yeni xidmət
        </Link>
      </div>

      {total === 0 ? (
        <div className="grid place-items-center gap-3 rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-violet-50 text-violet-600 ring-1 ring-violet-100">
            <ShoppingBag size={26} strokeWidth={1.5} aria-hidden />
          </span>
          <p className="font-medium">Hələ xidmət yoxdur</p>
          <p className="max-w-sm text-sm text-gray-500">İlk xidmətinizi əlavə edin, səhifənizdə “Sifariş et” düyməsi görünəcək.</p>
        </div>
      ) : (
        <>
          <FilterBar
            total={services.length}
            fields={[
              { type: "search", name: "q", placeholder: "Xidmət adı və ya təsvir..." },
              { type: "select", name: "category", label: "Növ", options: SERVICE_CATEGORIES.map((c) => ({ value: c.key, label: c.label })) },
              { type: "select", name: "price", label: "Qiymət", options: [{ value: "FIXED", label: "Sabit" }, { value: "NEGOTIABLE", label: "Razılaşma ilə" }] },
              { type: "select", name: "status", label: "Status", options: [{ value: "active", label: "Aktiv" }, { value: "hidden", label: "Gizli" }] },
            ]}
          />
          {services.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-500">Filtrə uyğun xidmət tapılmadı.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {services.map((s) => {
                const duration = formatDuration(s);
                const label = s.category === "other" && s.customCategory ? s.customCategory : categoryLabel(s.category);
                return (
                  <li key={s.id} className={`rounded-2xl border border-gray-200 bg-white p-4 ${s.isActive ? "" : "bg-gray-50"}`}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className={`font-semibold ${s.isActive ? "" : "text-gray-500"}`}>{s.title}</p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                          <span className="rounded-full bg-[var(--brand)]/10 px-2.5 py-1 font-semibold text-[var(--brand)]">
                            {s.priceType === "FIXED" && s.amountQepik !== null ? formatMoney(s.amountQepik, s.currency) : "Razılaşma ilə"}
                          </span>
                          {label && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-gray-600">
                              <Tag size={12} aria-hidden /> {label}
                            </span>
                          )}
                          {duration && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-gray-600">
                              <Clock size={12} aria-hidden /> {duration}
                            </span>
                          )}
                          {!s.isActive && <span className="rounded-full bg-amber-100 px-2.5 py-1 font-medium text-amber-800">Gizli</span>}
                          {s.blocked && (
                            <span title="Qaydalara uyğun olmadığı üçün səhifədə və kataloqda göstərilmir. Dəstəklə əlaqə saxlayın." className="rounded-full bg-red-100 px-2.5 py-1 font-medium text-red-800">
                              Moderasiya tərəfindən gizlədilib
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Link href={`/dashboard/services/${s.id}`} aria-label="Redaktə" title="Redaktə" className="grid h-9 w-9 place-items-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-900">
                          <Pencil size={16} strokeWidth={1.75} aria-hidden />
                        </Link>
                        <form action={toggleService.bind(null, s.id)}>
                          <button aria-label={s.isActive ? "Gizlət" : "Göstər"} title={s.isActive ? "Gizlət" : "Göstər"} className="grid h-9 w-9 place-items-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-900">
                            {s.isActive ? <EyeOff size={16} strokeWidth={1.75} aria-hidden /> : <Eye size={16} strokeWidth={1.75} aria-hidden />}
                          </button>
                        </form>
                        <form action={deleteService.bind(null, s.id)}>
                          <button aria-label="Sil" title="Sil" className="grid h-9 w-9 place-items-center rounded-full text-gray-400 hover:bg-red-50 hover:text-red-600">
                            <Trash2 size={16} strokeWidth={1.75} aria-hidden />
                          </button>
                        </form>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
