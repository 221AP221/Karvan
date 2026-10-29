import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-sm px-4 py-16">
      <Link href="/" className="mb-8 block text-center text-xl font-bold text-[var(--brand)]">
        BioFaktura
      </Link>
      <div className="rounded-2xl border border-gray-200 bg-white p-6">{children}</div>
    </main>
  );
}
