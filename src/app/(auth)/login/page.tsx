import { CheckCircle2 } from "lucide-react";
import { type SearchParams, param } from "@/lib/search-params";
import { LoginForm } from "./LoginForm";

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const reset = param(await searchParams, "reset") === "1";
  return (
    <>
      <h1 className="text-3xl font-bold">Xoş gördük</h1>
      <p className="mt-2 text-gray-500">Panelinizə daxil olun və sifarişləri izləyin</p>
      {reset && (
        <p className="mt-6 flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-800">
          <CheckCircle2 size={17} aria-hidden /> Şifrə yeniləndi. Yeni şifrə ilə daxil olun.
        </p>
      )}
      <LoginForm />
    </>
  );
}
