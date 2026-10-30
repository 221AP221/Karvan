import { BadgeCheck, Check, FileText, ShoppingBag, Star } from "lucide-react";

type Seller = { name: string; initials: string; profession: string; color: string; services: [string, string][]; rating: string };

const SELLERS: Seller[] = [
  { name: "Leyla Həsənova", initials: "LH", profession: "Makiyaj ustası", color: "#db2777", rating: "4.9", services: [["Gəlin makiyajı", "180 AZN"], ["Gündəlik makiyaj", "40 AZN"]] },
  { name: "Aygün Məmmədova", initials: "AM", profession: "İngilis dili müəllimi", color: "#7c3aed", rating: "5.0", services: [["IELTS hazırlığı", "320 AZN"], ["Fərdi dərs", "25 AZN"]] },
  { name: "Studio Nur", initials: "SN", profession: "Fotoqraf", color: "#0284c7", rating: "4.8", services: [["Fotosessiya", "150 AZN"], ["Toy çəkilişi", "Razılaşma ilə"]] },
  { name: "Rauf Əliyev", initials: "RƏ", profession: "Fitness məşqçisi", color: "#059669", rating: "4.9", services: [["Aylıq proqram", "90 AZN"], ["Qidalanma planı", "35 AZN"]] },
  { name: "Pixel Lab", initials: "PL", profession: "Dizayn studiyası", color: "#ea580c", rating: "5.0", services: [["Loqo dizaynı", "250 AZN"], ["Brendbuk", "Razılaşma ilə"]] },
  { name: "Nigar SMM", initials: "NS", profession: "SMM mütəxəssisi", color: "#e11d48", rating: "4.7", services: [["Aylıq idarəetmə", "400 AZN"], ["Reels paketi", "120 AZN"]] },
  { name: "Dr. Səbinə", initials: "DS", profession: "Psixoloq", color: "#4f46e5", rating: "5.0", services: [["Onlayn seans", "60 AZN"], ["Ailə konsultasiyası", "90 AZN"]] },
  { name: "Nail Art Bakı", initials: "NA", profession: "Dırnaq ustası", color: "#c026d3", rating: "4.8", services: [["Manikür + gel", "35 AZN"], ["Dizayn", "15 AZN"]] },
];

function SellerCard({ seller }: { seller: Seller }) {
  return (
    <div className="w-60 shrink-0 rounded-3xl border border-white/10 bg-white/[0.07] p-4 shadow-2xl shadow-black/20 backdrop-blur-md">
      <div className="h-14 rounded-2xl" style={{ background: `linear-gradient(135deg, ${seller.color}, ${seller.color}55)` }} />
      <div className="-mt-7 px-1">
        <span className="grid h-12 w-12 place-items-center rounded-full border-2 border-[#1f2026] text-sm font-bold text-white" style={{ background: seller.color }}>
          {seller.initials}
        </span>
        <div className="mt-2 flex items-center gap-1 text-sm font-semibold text-white">
          {seller.name}
          <BadgeCheck size={14} className="text-sky-300" aria-hidden />
        </div>
        <div className="flex items-center justify-between text-xs text-white/50">
          {seller.profession}
          <span className="inline-flex items-center gap-0.5 text-amber-300">
            <Star size={11} fill="currentColor" aria-hidden /> {seller.rating}
          </span>
        </div>
      </div>
      <div className="mt-3 flex flex-col gap-2">
        {seller.services.map(([title, price]) => (
          <div key={title} className="rounded-xl bg-white/[0.06] p-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/80">{title}</span>
              <span className="font-semibold text-white">{price}</span>
            </div>
            <div className="mt-2 rounded-full py-1 text-center text-[11px] font-semibold text-white" style={{ background: seller.color }}>
              Sifariş et
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Column({ sellers, direction, duration, className = "" }: { sellers: Seller[]; direction: "up" | "down"; duration: number; className?: string }) {
  return (
    <div className={`flex flex-col gap-4 ${direction === "up" ? "animate-auth-up" : "animate-auth-down"} ${className}`} style={{ animationDuration: `${duration}s` }}>
      {[...sellers, ...sellers].map((s, i) => (
        <SellerCard key={i} seller={s} />
      ))}
    </div>
  );
}

const TOASTS = [
  { icon: ShoppingBag, title: "Yeni sifariş", text: "Gəlin makiyajı · 180 AZN", tone: "bg-white text-gray-900", iconTone: "bg-violet-100 text-violet-600", pos: "left-[30%] top-[12%]", delay: "0s" },
  { icon: FileText, title: "Faktura göndərildi", text: "AYG-2026-0142", tone: "bg-white text-gray-900", iconTone: "bg-sky-100 text-sky-600", pos: "left-[40%] top-[72%]", delay: "-3s" },
  { icon: Check, title: "Ödənildi", text: "+320,00 AZN", tone: "bg-emerald-500 text-white", iconTone: "bg-white/25 text-white", pos: "left-[26%] bottom-[10%]", delay: "-6s" },
];

// Giriş/qeydiyyat səhifəsinin animasiyalı fonu: müxtəlif satıcıların səhifələri və xidmətləri axır.
export function AuthShowcase() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden bg-[#17181c]">
      <div className="absolute -left-32 top-0 h-[28rem] w-[28rem] rounded-full bg-violet-600/40 blur-[120px]" />
      <div className="absolute -right-24 bottom-0 h-[26rem] w-[26rem] rounded-full bg-pink-600/30 blur-[120px]" />

      <div className="absolute inset-0 flex -rotate-[8deg] scale-125 justify-center gap-4 opacity-90 [mask-image:linear-gradient(to_bottom,transparent,black_15%,black_85%,transparent)]">
        <Column sellers={SELLERS.slice(0, 4)} direction="up" duration={46} />
        <Column sellers={SELLERS.slice(4)} direction="down" duration={54} className="-mt-40" />
        <Column sellers={[...SELLERS.slice(2, 6)]} direction="up" duration={50} className="-mt-20" />
        <Column sellers={[...SELLERS.slice(5), ...SELLERS.slice(0, 2)]} direction="down" duration={58} className="hidden -mt-56 xl:flex" />
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-[#17181c] via-[#17181c]/30 to-[#17181c]/50" />
      {/* Böyük ekranda sol mətnin oxunması üçün */}
      <div className="absolute inset-y-0 left-0 hidden w-[55%] bg-gradient-to-r from-[#17181c] via-[#17181c]/90 to-transparent lg:block" />

      {TOASTS.map(({ icon: Icon, title, text, tone, iconTone, pos, delay }) => (
        <div key={title} className={`animate-auth-toast absolute ${pos} hidden items-center gap-3 rounded-2xl px-4 py-3 shadow-2xl shadow-black/30 sm:flex ${tone}`} style={{ animationDelay: delay }}>
          <span className={`grid h-9 w-9 place-items-center rounded-xl ${iconTone}`}>
            <Icon size={18} strokeWidth={2} />
          </span>
          <span>
            <span className="block text-xs opacity-60">{title}</span>
            <span className="block text-sm font-semibold">{text}</span>
          </span>
        </div>
      ))}

    </div>
  );
}
