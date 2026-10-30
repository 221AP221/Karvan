"use client";

import { ArrowLeft, AtSign, Building2, Check, CreditCard, Globe2, Mail, Phone, ShieldCheck, UserRound } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AuthField } from "@/components/AuthField";
import { AuthError, PasswordStrength, SubmitButton, useAuthForm } from "@/components/auth/AuthForm";
import { PasswordField } from "@/components/PasswordField";
import { signup } from "../actions";

const STEP1_FIELDS = ["firstName", "lastName", "brand", "phone", "citizenship", "document"];

const TRANSLIT: Record<string, string> = { ə: "e", ı: "i", ö: "o", ü: "u", ş: "s", ç: "c", ğ: "g", i̇: "i" };

// "Leyla Həsənova" → "leyla.hesenova"
function suggestUsername(text: string) {
  return text
    .toLocaleLowerCase("az")
    .replace(/[əıöüşçğ]/g, (c) => TRANSLIT[c] ?? c)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "")
    .slice(0, 30);
}

export function SignupForm() {
  const { state, pending, onSubmit } = useAuthForm(signup);
  const form = useRef<HTMLFormElement>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [citizenship, setCitizenship] = useState<"AZ" | "FOREIGN">("AZ");
  const [names, setNames] = useState({ firstName: "", lastName: "", brand: "" });
  const [username, setUsername] = useState("");
  const [usernameEdited, setUsernameEdited] = useState(false);
  const [password, setPassword] = useState("");

  // Səhifə ünvanı əl ilə dəyişdirilməyibsə, brend və ya ad-soyaddan təklif edirik
  useEffect(() => {
    if (!usernameEdited) setUsername(suggestUsername(names.brand || `${names.firstName} ${names.lastName}`));
  }, [names, usernameEdited]);

  // Server birinci addımdakı sahədə xəta tapıbsa, ora qayıdırıq
  useEffect(() => {
    if (state?.field && STEP1_FIELDS.includes(state.field)) setStep(1);
  }, [state]);

  function next() {
    const inputs = STEP1_FIELDS.flatMap((n) => Array.from(form.current!.querySelectorAll<HTMLInputElement>(`[name="${n}"]`)));
    for (const input of inputs) if (!input.reportValidity()) return;
    setStep(2);
  }

  const name = (key: keyof typeof names) => ({
    name: key,
    value: names[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setNames((n) => ({ ...n, [key]: e.target.value })),
  });

  return (
    <>
      {/* Addım göstəricisi */}
      <ol className="mt-6 grid grid-cols-2 gap-3" aria-label="Qeydiyyat addımları">
        {["Şəxsi məlumat", "Hesab"].map((label, i) => {
          const n = (i + 1) as 1 | 2;
          const done = step > n;
          const current = step === n;
          return (
            <li key={label}>
              <button
                type="button"
                onClick={() => (n === 1 ? setStep(1) : next())}
                className="flex w-full flex-col gap-2 text-left"
                aria-current={current ? "step" : undefined}
              >
                <span className={`h-1.5 rounded-full transition ${current || done ? "bg-gradient-to-r from-violet-600 to-pink-600" : "bg-gray-200"}`} />
                <span className={`flex items-center gap-1.5 text-xs font-semibold ${current ? "text-gray-900" : "text-gray-400"}`}>
                  <span className={`grid h-5 w-5 place-items-center rounded-full text-[10px] ${done ? "bg-emerald-500 text-white" : current ? "bg-gray-900 text-white" : "bg-gray-200 text-gray-500"}`}>
                    {done ? <Check size={11} strokeWidth={3} aria-hidden /> : n}
                  </span>
                  {label}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <form ref={form} onSubmit={onSubmit} className="mt-6" noValidate={false}>
        {/* 1-ci addım */}
        <div className={step === 1 ? "flex flex-col gap-4" : "hidden"}>
          <div className="grid gap-4 sm:grid-cols-2">
            <AuthField label="Ad" icon={UserRound} required minLength={2} maxLength={40} autoComplete="given-name" placeholder="Leyla" {...name("firstName")} />
            <AuthField label="Soyad" icon={UserRound} required minLength={2} maxLength={40} autoComplete="family-name" placeholder="Həsənova" {...name("lastName")} />
          </div>
          <AuthField label="Brend (könüllü)" icon={Building2} maxLength={80} autoComplete="organization" placeholder="Leyla Makeup Studio" hint="Səhifədə adınız əvəzinə brend göstəriləcək" {...name("brand")} />
          <AuthField label="Əlaqə nömrəsi" name="phone" type="tel" icon={Phone} required autoComplete="tel" placeholder="+994 50 123 45 67" pattern="^[+0-9 ()-]{9,20}$" />

          <fieldset>
            <legend className="mb-1.5 text-sm font-medium text-gray-700">Vətəndaşlıq</legend>
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-gray-100 p-1">
              {(
                [
                  ["AZ", "Azərbaycan vətəndaşı", ShieldCheck],
                  ["FOREIGN", "Xarici vətəndaş", Globe2],
                ] as const
              ).map(([value, label, Icon]) => (
                <label
                  key={value}
                  className={`flex cursor-pointer items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                    citizenship === value ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  <input type="radio" name="citizenship" value={value} checked={citizenship === value} onChange={() => setCitizenship(value)} className="sr-only" />
                  <Icon size={16} strokeWidth={1.75} aria-hidden />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>

          {citizenship === "AZ" ? (
            <AuthField
              key="fin"
              label="FİN kod"
              name="document"
              icon={CreditCard}
              required
              minLength={7}
              maxLength={7}
              pattern="^[A-Za-z0-9]{7}$"
              autoComplete="off"
              placeholder="5ABCDE1"
              className="font-mono uppercase tracking-[0.2em]"
              hint="Şəxsiyyət vəsiqəsindəki 7 simvollu kod"
            />
          ) : (
            <AuthField
              key="passport"
              label="Pasport nömrəsi"
              name="document"
              icon={CreditCard}
              required
              minLength={5}
              maxLength={20}
              pattern="^[A-Za-z0-9 ]{5,20}$"
              autoComplete="off"
              placeholder="C01234567"
              className="font-mono uppercase tracking-wider"
            />
          )}

          <AuthError message={state?.field && STEP1_FIELDS.includes(state.field) ? state.error : undefined} />
          <button
            type="button"
            onClick={next}
            className="mt-1 flex h-12 w-full items-center justify-center rounded-xl bg-gray-900 text-[15px] font-semibold text-white transition hover:bg-gray-800"
          >
            Davam et
          </button>
        </div>

        {/* 2-ci addım */}
        <div className={step === 2 ? "flex flex-col gap-4" : "hidden"}>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-gray-700">Səhifə ünvanı</span>
            <span className="flex h-12 items-center rounded-xl border border-gray-200 bg-white transition focus-within:border-violet-500 focus-within:ring-4 focus-within:ring-violet-500/10">
              <span className="flex items-center gap-1.5 border-r border-gray-200 pl-3.5 pr-2 text-sm text-gray-400">
                <AtSign size={15} aria-hidden /> biofaktura.az/
              </span>
              <input
                name="username"
                required
                minLength={3}
                maxLength={30}
                pattern="^[a-z0-9_.]{3,30}$"
                value={username}
                onChange={(e) => {
                  setUsernameEdited(true);
                  setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ""));
                }}
                className="min-w-0 flex-1 bg-transparent px-2 text-[15px] outline-none"
              />
            </span>
            <span className="mt-1 block text-xs text-gray-500">Instagram bio-nuza qoyacağınız link</span>
          </label>
          <AuthField label="E-poçt" name="email" type="email" icon={Mail} required autoComplete="email" placeholder="ad@nümunə.az" />
          <PasswordField label="Şifrə" name="password" autoComplete="new-password" minLength={8} value={password} onChange={setPassword} hint={<PasswordStrength value={password} />} />
          <PasswordField label="Şifrəni təsdiqləyin" name="confirm" autoComplete="new-password" minLength={8} />

          <p className="flex gap-2 rounded-xl bg-gray-50 p-3 text-xs text-gray-500">
            <ShieldCheck size={15} className="mt-px shrink-0 text-emerald-600" aria-hidden />
            FİN kod və ya pasport nömrəsi yalnız hesabın təsdiqi üçündür, səhifənizdə heç kimə göstərilmir.
          </p>
          <AuthError message={state?.field && STEP1_FIELDS.includes(state.field) ? undefined : state?.error} />
          <div className="flex gap-3">
            <button type="button" onClick={() => setStep(1)} aria-label="Əvvəlki addım" className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-gray-200 text-gray-600 transition hover:bg-gray-50">
              <ArrowLeft size={18} aria-hidden />
            </button>
            <SubmitButton pending={pending}>Hesab yarat</SubmitButton>
          </div>
        </div>
      </form>

      <p className="mt-8 text-center text-sm text-gray-500">
        Hesabınız var?{" "}
        <Link href="/login" className="font-semibold text-violet-600 hover:text-violet-800">
          Daxil olun
        </Link>
      </p>
    </>
  );
}
