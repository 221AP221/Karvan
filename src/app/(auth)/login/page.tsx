import Link from "next/link";
import { Field } from "@/components/ui";
import { login } from "../actions";
import { ActionForm } from "@/components/ActionForm";

export default function LoginPage() {
  return (
    <>
      <h1 className="mb-6 text-xl font-semibold">Daxil ol</h1>
      <ActionForm action={login} submitLabel="Daxil ol">
        <Field label="E-poçt" name="email" type="email" required autoComplete="email" />
        <Field label="Şifrə" name="password" type="password" required autoComplete="current-password" />
      </ActionForm>
      <p className="mt-4 text-center text-sm text-gray-500">
        Hesabınız yoxdur? <Link href="/signup" className="text-[var(--brand)]">Qeydiyyat</Link>
      </p>
    </>
  );
}
