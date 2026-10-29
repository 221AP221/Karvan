import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-20 text-center">
      <h1 className="text-4xl font-bold">Profil linkiniz artıq satış edir</h1>
      <p className="mt-4 text-lg text-gray-600">
        Sosial linklər, xidmətlər, sifariş formu və avtomatik PDF faktura. Ödənişləri bir paneldən izləyin.
      </p>
      <Link
        href="/signup"
        className="mt-8 inline-block rounded-full bg-[var(--brand)] px-6 py-3 font-medium text-white"
      >
        Pulsuz başla
      </Link>
      <p className="mt-3 text-sm text-gray-500">Pulsuz planda ayda 5 faktura</p>
    </main>
  );
}
