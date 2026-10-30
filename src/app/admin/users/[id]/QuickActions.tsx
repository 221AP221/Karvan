"use client";

import { ArrowDown, ArrowUp, Ban, CheckCircle2, LoaderCircle, LogOut, Pencil, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { type BulkResult, bulkEndSessions, bulkUnblock, stepPlan } from "../../actions";

const NAMES = { FREE: "Pulsuz", PRO: "Pro", PRO_MAX: "Pro Max" } as const;
const ORDER = ["FREE", "PRO", "PRO_MAX"] as const;

// İstifadəçi səhifəsinin yuxarısındakı əməliyyat kartları
export function QuickActions({ userId, plan, blocked, protectedUser, sessions }: { userId: string; plan: keyof typeof NAMES; blocked: boolean; protectedUser: boolean; sessions: number }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [active, setActive] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const i = ORDER.indexOf(plan);
  const up = ORDER[i + 1];
  const down = ORDER[i - 1];

  function run(key: string, label: string, fn: () => Promise<BulkResult>) {
    setActive(key);
    start(async () => {
      const res = await fn();
      setMsg(res.error ? { ok: false, text: res.error } : { ok: true, text: label });
      setActive(null);
      router.refresh();
    });
  }

  const cardCls = "group flex flex-col items-start gap-2 rounded-2xl border border-gray-200 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-gray-400 hover:shadow-md disabled:pointer-events-none disabled:opacity-40";
  const spin = (key: string) => pending && active === key && <LoaderCircle size={14} className="animate-spin" aria-hidden />;

  return (
    <section aria-label="Əməliyyatlar" className="mb-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <button disabled={!up || pending} onClick={() => run("up", `Tarif qaldırıldı: ${NAMES[up!]}`, () => stepPlan(userId, 1))} className={cardCls}>
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><ArrowUp size={18} aria-hidden /></span>
          <span className="flex items-center gap-1.5 text-sm font-semibold">Tarifi qaldır {spin("up")}</span>
          <span className="text-xs text-gray-500">{up ? `${NAMES[plan]} → ${NAMES[up]}` : "Ən yüksək tarifdədir"}</span>
        </button>
        <button disabled={!down || pending} onClick={() => run("down", `Tarif salındı: ${NAMES[down!]}`, () => stepPlan(userId, -1))} className={cardCls}>
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-50 text-amber-700"><ArrowDown size={18} aria-hidden /></span>
          <span className="flex items-center gap-1.5 text-sm font-semibold">Tarifi sal {spin("down")}</span>
          <span className="text-xs text-gray-500">{down ? `${NAMES[plan]} → ${NAMES[down]}` : "Pulsuz tarifdədir"}</span>
        </button>
        {blocked ? (
          <button disabled={pending} onClick={() => run("unblock", "Blok götürüldü", () => bulkUnblock([userId]))} className={cardCls}>
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><ShieldCheck size={18} aria-hidden /></span>
            <span className="flex items-center gap-1.5 text-sm font-semibold">Bloku götür {spin("unblock")}</span>
            <span className="text-xs text-gray-500">Hesab yenidən aktiv olur</span>
          </button>
        ) : (
          <a href="#bloklama" aria-disabled={protectedUser} className={`${cardCls} ${protectedUser ? "pointer-events-none opacity-40" : ""}`}>
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-red-50 text-red-600"><Ban size={18} aria-hidden /></span>
            <span className="text-sm font-semibold">Blokla</span>
            <span className="text-xs text-gray-500">{protectedUser ? "Admin bloklanmır" : "Səbəb yazılır"}</span>
          </a>
        )}
        <button disabled={protectedUser || !sessions || pending} onClick={() => run("logout", "Bütün cihazlardan çıxarıldı", () => bulkEndSessions([userId]))} className={cardCls}>
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gray-100 text-gray-700"><LogOut size={18} aria-hidden /></span>
          <span className="flex items-center gap-1.5 text-sm font-semibold">Çıxış etdir {spin("logout")}</span>
          <span className="text-xs text-gray-500">{sessions} açıq sessiya</span>
        </button>
        <a href="#duzelis" className={cardCls}>
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-50 text-violet-700"><Pencil size={17} aria-hidden /></span>
          <span className="text-sm font-semibold">Məlumatları dəyiş</span>
          <span className="text-xs text-gray-500">Ad, e-poçt, telefon, ünvan</span>
        </a>
        <a href="#fealiyyet" className={cardCls}>
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-sky-50 text-sky-700"><CheckCircle2 size={18} aria-hidden /></span>
          <span className="text-sm font-semibold">Fəaliyyət</span>
          <span className="text-xs text-gray-500">Girişlər və əməliyyatlar</span>
        </a>
      </div>
      {msg && <p role="status" className={`mt-3 rounded-xl px-4 py-2.5 text-sm ${msg.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>{msg.text}</p>}
    </section>
  );
}
