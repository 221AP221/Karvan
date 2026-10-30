import { FileText, Link2, ShieldCheck, Wallet } from "lucide-react";
import Link from "next/link";
import { AuthShowcase } from "@/components/auth/AuthShowcase";
import { BackButton } from "@/components/BackButton";
import { Logo } from "@/components/Logo";

const POINTS = [
  { icon: Link2, text: "Bir link: sosial hesablar, xidmətlər, gördüyünüz işlər" },
  { icon: FileText, text: "Hər sifarişə avtomatik PDF faktura" },
  { icon: Wallet, text: "Kim ödəyib, kim gecikir — bir paneldə" },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <AuthShowcase />

      <div className="relative grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
        {/* Sol: mesaj (yalnız böyük ekranda) */}
        <div className="hidden flex-col justify-between p-12 text-white lg:flex">
          <Link href="/" className="w-fit" aria-label="Karvan ana səhifə">
            <Logo tone="dark" />
          </Link>
          <div className="max-w-md">
            <h2 className="text-4xl font-bold leading-tight">
              Profilinizi
              <br />
              <span className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-amber-200 bg-clip-text text-transparent">satış səhifəsinə</span> çevirin
            </h2>
            <ul className="mt-8 space-y-4">
              {POINTS.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-white/80">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/10 ring-1 ring-white/15">
                    <Icon size={17} strokeWidth={1.75} aria-hidden />
                  </span>
                  {text}
                </li>
              ))}
            </ul>
          </div>
          <p className="flex items-center gap-2 text-sm text-white/50">
            <ShieldCheck size={16} aria-hidden /> Məlumatlarınız qorunur, şifrələr şifrələnmiş saxlanılır
          </p>
        </div>

        {/* Sağ: forma */}
        <div className="flex items-center justify-center p-4 sm:p-8 lg:bg-white">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl shadow-black/30 sm:p-8 lg:rounded-none lg:p-0 lg:shadow-none">
            <div className="mb-8 flex items-center justify-between">
              <BackButton fallback="/" className="-ml-2" />
              <Link href="/" className="lg:hidden" aria-label="Karvan ana səhifə">
                <Logo />
              </Link>
              <Link href="/" className="hidden text-sm font-medium text-gray-500 hover:text-gray-900 lg:inline">
                Ana səhifə
              </Link>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
