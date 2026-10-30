import { LinkIcon } from "lucide-react";
import Link from "next/link";
import { getDictionary, getLocale } from "@/i18n/server";
import { findValidReset } from "@/lib/password-reset";
import { type SearchParams, param } from "@/lib/search-params";
import { ResetForm } from "./ResetForm";

export default async function ResetPasswordPage({ searchParams }: { searchParams: SearchParams }) {
  const token = param(await searchParams, "token");
  const valid = await findValidReset(token);
  const a = getDictionary(await getLocale()).auth;

  if (!valid) {
    return (
      <div className="text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-red-50 text-red-600 ring-1 ring-red-100">
          <LinkIcon size={24} strokeWidth={1.75} aria-hidden />
        </span>
        <h1 className="mt-5 text-2xl font-bold">{a.reset.invalidTitle}</h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">{a.reset.invalidText}</p>
        <Link href="/forgot-password" className="mt-6 inline-flex h-11 items-center rounded-xl bg-gray-900 px-6 font-semibold text-white hover:bg-gray-800">
          {a.reset.newLink}
        </Link>
      </div>
    );
  }

  return (
    <>
      <h1 className="text-3xl font-bold">{a.reset.title}</h1>
      <p className="mt-2 text-gray-500 dark:text-gray-400">{a.reset.text}</p>
      <ResetForm token={token} t={a.reset} password={a.password} />
    </>
  );
}
