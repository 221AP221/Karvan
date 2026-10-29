import Link from "next/link";
import { Field } from "@/components/ui";
import { signup } from "../actions";
import { ActionForm } from "@/components/ActionForm";

export default function SignupPage() {
  return (
    <>
      <h1 className="mb-1 text-xl font-semibold">Qeydiyyat</h1>
      <p className="mb-6 text-sm text-gray-500">Pulsuz plan: ayda 5 faktura</p>
      <ActionForm action={signup} submitLabel="Hesab yarat">
        <Field label="Ad, soyad və ya brend" name="displayName" required />
        <Field label="İstifadəçi adı" name="username" required hint="Səhifəniz: biofaktura.az/istifadeci_adi" />
        <Field label="E-poçt" name="email" type="email" required autoComplete="email" />
        <Field label="Şifrə" name="password" type="password" required minLength={8} autoComplete="new-password" />
      </ActionForm>
      <p className="mt-4 text-center text-sm text-gray-500">
        Hesabınız var? <Link href="/login" className="text-[var(--brand)]">Daxil olun</Link>
      </p>
    </>
  );
}
