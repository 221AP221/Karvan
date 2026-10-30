import { BadgeCheck, Star } from "lucide-react";

type Seller = { name: string; initials: string; profession: string; color: string; services: [string, string][]; rating: string };

const SELLERS: Seller[] = [
  { name: "Leyla Həsənova", initials: "LH", profession: "Makiyaj ustası", color: "#db2777", rating: "4.9", services: [["Gəlin makiyajı", "180 AZN"], ["Gündəlik makiyaj", "40 AZN"]] },
  { name: "Aygün Məmmədova", initials: "AM", profession: "İngilis dili müəllimi", color: "#7c3aed", rating: "5.0", services: [["IELTS hazırlığı", "320 AZN"], ["Fərdi dərs", "25 AZN"]] },
  { name: "Studio Nur", initials: "SN", profession: "Fotoqraf", color: "#0284c7", rating: "4.8", services: [["Fotosessiya", "150 AZN"], ["Toy çəkilişi", "Razılaşma ilə"]] },
  { name: "Rauf Əliyev", initials: "RƏ", profession: "Fitness məşqçisi", color: "#059669", rating: "4.9", services: [["Aylıq proqram", "90 AZN"], ["Qidalanma planı", "35 AZN"]] },
  { name: "Pixel Lab", initials: "PL", profession: "Dizayn studiyası", color: "#ea580c", rating: "5.0", services: [["Loqo dizaynı", "250 AZN"], ["Brendbuk", "Razılaşma ilə"]] },
  { name: "Nigar SMM", initials: "NS", profession: "SMM mütəxəssisi", color: "#e11d48", rating: "4.7", services: [["Aylıq idarəetmə", "400 AZN"], ["Reels paketi", "120 AZN"]] },
];

// Kartlarda backdrop-blur yoxdur: hərəkət edən onlarla blur qatı zəif cihazlarda səhifəni donudurdu
function SellerCard({ seller }: { seller: Seller }) {
  return (
    <div className="w-56 shrink-0 rounded-3xl border border-white/10 bg-[#24252b] p-4">
      <div className="h-12 rounded-2xl" style={{ background: `linear-gradient(135deg, ${seller.color}, ${seller.color}55)` }} />
      <div className="-mt-6 px-1">
        <span className="grid h-11 w-11 place-items-center rounded-full border-2 border-[#24252b] text-sm font-bold text-white" style={{ background: seller.color }}>
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
          <div key={title} className="rounded-xl bg-white/[0.05] p-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/75">{title}</span>
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
    <div
      className={`flex flex-col gap-4 will-change-transform ${direction === "up" ? "animate-auth-up" : "animate-auth-down"} ${className}`}
      style={{ animationDuration: `${duration}s` }}
    >
      {[...sellers, ...sellers].map((s, i) => (
        <SellerCard key={i} seller={s} />
      ))}
    </div>
  );
}

// Giriş/qeydiyyat fonu. Böyük ekranda yalnız sol paneldə (formanın arxasında gizlənən hissə render olunmur),
// mobildə isə statik qradiyent: forma dərhal görünür, telefon boş yerə animasiya hesablamır.
export function AuthShowcase() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden bg-[#17181c] [contain:strict] lg:right-auto lg:w-[51.2%]"
      style={{
        backgroundImage:
          "radial-gradient(40rem 30rem at 0% 0%, rgba(214,18,126,0.35), transparent 70%), radial-gradient(36rem 28rem at 100% 100%, rgba(236,28,140,0.22), transparent 70%)",
      }}
    >
      <div className="absolute inset-y-0 right-0 hidden w-[56%] -rotate-[6deg] justify-end gap-4 opacity-80 [mask-image:linear-gradient(to_bottom,transparent,black_12%,black_88%,transparent)] lg:flex">
        <Column sellers={SELLERS.slice(0, 3)} direction="up" duration={60} className="-mt-24" />
        <Column sellers={SELLERS.slice(3)} direction="down" duration={70} className="-mt-56 -mr-16" />
      </div>
      {/* Sol mətnin oxunması üçün */}
      <div className="absolute inset-0 hidden bg-[linear-gradient(to_right,#17181c_0%,#17181c_50%,rgba(23,24,28,0.8)_68%,rgba(23,24,28,0.15)_100%)] lg:block" />
    </div>
  );
}
