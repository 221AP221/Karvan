import { ForgotForm } from "./ForgotForm";

export default function ForgotPasswordPage() {
  return (
    <>
      <h1 className="text-3xl font-bold">Şifrəni bərpa et</h1>
      <p className="mt-2 text-gray-500">Qeydiyyatdan keçdiyiniz e-poçtu yazın, şifrəni yeniləmək üçün link göndərək.</p>
      <ForgotForm />
    </>
  );
}
