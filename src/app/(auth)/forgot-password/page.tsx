import { getDictionary, getLocale } from "@/i18n/server";
import { ForgotForm } from "./ForgotForm";

export default async function ForgotPasswordPage() {
  const a = getDictionary(await getLocale()).auth;
  return (
    <>
      <h1 className="text-3xl font-bold">{a.forgot.title}</h1>
      <p className="mt-2 text-gray-500 dark:text-gray-400">{a.forgot.text}</p>
      <ForgotForm t={a.forgot} email={a.login.email} placeholder={a.login.emailPlaceholder} />
    </>
  );
}
