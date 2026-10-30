// Hero hissəsindəki telefon maketi: satıcının bio səhifəsi və üzərində "canlı" bildirişlər.
export function HeroPhone() {
  return (
    <div className="relative mx-auto w-full max-w-[340px]">
      <div
        aria-hidden
        className="absolute -inset-10 -z-10 rounded-full bg-gradient-to-tr from-violet-400/40 via-pink-300/40 to-amber-200/40 blur-3xl"
      />

      {/* Telefon */}
      <div className="animate-float relative rounded-[2.6rem] border-[10px] border-gray-900 bg-white shadow-2xl shadow-violet-900/25">
        <div className="absolute left-1/2 top-2 h-5 w-24 -translate-x-1/2 rounded-full bg-gray-900" />
        <div className="overflow-hidden rounded-[2rem] bg-gradient-to-b from-pink-50 to-white px-5 pb-6 pt-10">
          <div className="text-center">
            <div className="mx-auto h-16 w-16 rounded-full bg-gradient-to-br from-pink-500 to-violet-600 p-0.5">
              <div className="grid h-full w-full place-items-center rounded-full bg-white text-xl font-bold text-pink-600">LH</div>
            </div>
            <p className="mt-2 font-semibold">Leyla Həsənova</p>
            <p className="text-xs text-gray-500">Makiyaj ustası · Bakı</p>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-medium">
            <span className="rounded-xl border border-gray-200 bg-white py-2 text-center">Instagram</span>
            <span className="rounded-xl border border-gray-200 bg-white py-2 text-center">WhatsApp</span>
          </div>
          <p className="mb-2 mt-5 text-xs font-semibold text-gray-500">XİDMƏTLƏR</p>
          {[
            { title: "Gündəlik makiyaj", price: "40 AZN" },
            { title: "Gəlin makiyajı", price: "Razılaşma ilə" },
          ].map((s) => (
            <div key={s.title} className="mb-2 rounded-2xl border border-gray-200 bg-white p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{s.title}</span>
                <span className="font-semibold text-gray-700">{s.price}</span>
              </div>
              <span className="mt-2 block rounded-full bg-pink-600 py-1.5 text-center text-xs font-medium text-white">
                Sifariş et
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Bildirişlər */}
      <div className="animate-pop absolute -left-4 -top-6 sm:-left-28 sm:top-24" style={{ animationDelay: "0.9s" }}>
        <div className="animate-float-slow flex items-center gap-3 rounded-2xl border border-gray-200 bg-white/95 px-4 py-3 shadow-xl backdrop-blur">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-violet-100 text-lg">🛍️</span>
          <span className="text-left">
            <span className="block text-xs text-gray-500">Yeni sifariş</span>
            <span className="block text-sm font-semibold">Nərmin · 40 AZN</span>
          </span>
        </div>
      </div>

      <div className="animate-pop absolute -right-28 top-[42%] hidden sm:block" style={{ animationDelay: "1.6s" }}>
        <div className="animate-float flex items-center gap-3 rounded-2xl border border-gray-200 bg-white/95 px-4 py-3 shadow-xl backdrop-blur" style={{ animationDelay: "-2s" }}>
          <span className="grid h-9 w-9 place-items-center rounded-full bg-sky-100 text-lg">📄</span>
          <span className="text-left">
            <span className="block text-xs text-gray-500">Faktura göndərildi</span>
            <span className="block font-mono text-sm font-semibold">LEY-2026-0042</span>
          </span>
        </div>
      </div>

      <div className="animate-pop absolute -bottom-6 left-4 sm:-left-8" style={{ animationDelay: "2.3s" }}>
        <div className="animate-float-slow flex items-center gap-3 rounded-2xl bg-emerald-600 px-4 py-3 text-white shadow-xl shadow-emerald-600/30" style={{ animationDelay: "-4s" }}>
          <span className="grid h-9 w-9 place-items-center rounded-full bg-white/20 text-lg">✓</span>
          <span className="text-left">
            <span className="block text-xs text-emerald-100">Ödənildi</span>
            <span className="block text-sm font-semibold">+40,00 AZN</span>
          </span>
        </div>
      </div>
    </div>
  );
}
