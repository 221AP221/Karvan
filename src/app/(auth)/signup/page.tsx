import { SignupForm } from "./SignupForm";

export default function SignupPage() {
  return (
    <>
      <h1 className="text-3xl font-bold">Hesab yaradın</h1>
      <p className="mt-2 text-gray-500">Pulsuz plan: səhifə, limitsiz sifariş və ayda 5 faktura</p>
      <SignupForm />
    </>
  );
}
