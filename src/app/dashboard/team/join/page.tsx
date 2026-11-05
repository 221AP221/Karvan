import { CheckCircle2, XCircle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { type SearchParams, param } from "@/lib/search-params";
import { acceptInvite, switchWorkspace } from "../actions";

export const metadata: Metadata = { title: "Komandaya qoşul" };

export default async function JoinTeam({ searchParams }: { searchParams: SearchParams }) {
  await requireProfile(); // daxil olmayan istifadəçi girişə yönləndirilir
  const token = param(await searchParams, "token");
  if (!token) redirect("/dashboard");

  const result = await acceptInvite(token);

  return (
    <div className="mx-auto max-w-md py-10 text-center">
      {"ok" in result ? (
        <>
          <CheckCircle2 size={44} className="mx-auto text-emerald-500" aria-hidden />
          <h1 className="mt-4 text-2xl font-bold">Komandaya qoşuldunuz</h1>
          <p className="mt-2 text-sm text-gray-600">
            Artıq bu səhifənin sifarişləri və fakturaları ilə işləyə bilərsiniz. İş sahəsini panelin yuxarısındakı seçicidən
            dəyişə bilərsiniz.
          </p>
          <form action={switchWorkspace.bind(null, result.profileId)}>
            <button className="mt-5 rounded-full bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90">
              Komandanın səhifəsinə keç
            </button>
          </form>
        </>
      ) : (
        <>
          <XCircle size={44} className="mx-auto text-red-500" aria-hidden />
          <h1 className="mt-4 text-2xl font-bold">Dəvət qəbul edilmədi</h1>
          <p className="mt-2 text-sm text-gray-600">{result.error}</p>
          <Link href="/dashboard" className="mt-5 inline-block rounded-full border border-gray-300 px-5 py-2.5 text-sm font-medium transition hover:border-gray-500">
            Panelə qayıt
          </Link>
        </>
      )}
    </div>
  );
}
