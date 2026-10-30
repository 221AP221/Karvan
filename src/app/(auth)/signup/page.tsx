import { getDictionary, getLocale } from "@/i18n/server";
import { SignupForm } from "./SignupForm";

export default async function SignupPage() {
  const a = getDictionary(await getLocale()).auth;
  return (
    <>
      <h1 className="text-3xl font-bold">{a.signup.title}</h1>
      <p className="mt-2 text-gray-500 dark:text-gray-400">{a.signup.text}</p>
      <SignupForm t={a.signup} password={a.password} />
    </>
  );
}
