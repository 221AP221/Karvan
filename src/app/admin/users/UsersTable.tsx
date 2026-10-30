"use client";

import { ArrowDown, ArrowUp, Ban, CheckCircle2, LoaderCircle, LogOut, Pencil, ShieldCheck, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { type BulkResult, bulkBlock, bulkEndSessions, bulkSetPlan, bulkUnblock, stepPlan } from "../actions";

export type UserRow = {
  id: string;
  name: string;
  email: string;
  username: string | null;
  plan: "FREE" | "PRO" | "PRO_MAX";
  services: number;
  orders: number;
  invoices: number;
  blocked: boolean;
  admin: boolean;
  created: string;
};

const PLAN_NAMES = { FREE: "Pulsuz", PRO: "Pro", PRO_MAX: "Pro Max" };
const PLAN_STYLE = { FREE: "bg-gray-100 text-gray-700", PRO: "bg-violet-100 text-violet-800", PRO_MAX: "bg-amber-100 text-amber-900" };
const REASONS = ["Saxta elanlar", "Müştəri şikayətləri", "Spam", "Ödəniş fırıldaqçılığı", "Qaydalara zidd məzmun"];

const iconBtn =
  "grid h-8 w-8 place-items-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 disabled:pointer-events-none disabled:opacity-30";

export function UsersTable({ rows }: { rows: UserRow[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, start] = useTransition();
  const [busyRow, setBusyRow] = useState<string | null>(null);
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);
  const [blockIds, setBlockIds] = useState<string[]>([]);
  const [reason, setReason] = useState("");
  const [plan, setPlan] = useState<string>("PRO");
  const dialog = useRef<HTMLDialogElement>(null);

  const all = rows.length > 0 && rows.every((r) => selected.has(r.id));
  const ids = [...selected];

  function run(label: string, fn: () => Promise<BulkResult>, row?: string) {
    setBusyRow(row ?? null);
    start(async () => {
      const res = await fn();
      setBusyRow(null);
      if (res.error) setToast({ ok: false, text: res.error });
      else {
        const extra = res.skipped ? ` (${res.skipped} ötürüldü)` : "";
        setToast({ ok: true, text: `${label}${res.done !== undefined && !row ? `: ${res.done} hesab` : ""}${extra}` });
        if (!row) setSelected(new Set());
      }
      router.refresh();
      setTimeout(() => setToast(null), 4000);
    });
  }

  function openBlock(target: string[]) {
    setBlockIds(target);
    setReason("");
    dialog.current?.showModal();
  }

  function toggle(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <>
      {/* Toplu əməliyyatlar: seçim olanda görünür */}
      {selected.size > 0 && (
        <div className="sticky top-2 z-20 mb-3 flex flex-wrap items-center gap-2 rounded-2xl bg-gray-900 p-2 pl-4 text-sm text-white shadow-xl">
          <span className="font-medium">{selected.size} seçildi</span>
          <span className="mx-1 h-5 w-px bg-white/20" />
          <select value={plan} onChange={(e) => setPlan(e.target.value)} className="h-9 rounded-lg bg-white/10 px-2 text-white outline-none" aria-label="Tarif">
            <option value="FREE" className="text-gray-900">Pulsuz</option>
            <option value="PRO" className="text-gray-900">Pro</option>
            <option value="PRO_MAX" className="text-gray-900">Pro Max</option>
          </select>
          <button disabled={pending} onClick={() => run("Tarif dəyişdi", () => bulkSetPlan(ids, plan))} className="h-9 rounded-lg bg-white px-3 font-medium text-gray-900 hover:bg-gray-100">
            Tarifi tətbiq et
          </button>
          <button disabled={pending} onClick={() => openBlock(ids)} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-red-600 px-3 font-medium hover:bg-red-500">
            <Ban size={15} aria-hidden /> Blokla
          </button>
          <button disabled={pending} onClick={() => run("Blok götürüldü", () => bulkUnblock(ids))} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-white/10 px-3 hover:bg-white/20">
            <ShieldCheck size={15} aria-hidden /> Bloku götür
          </button>
          <button disabled={pending} onClick={() => run("Sessiyalar bağlandı", () => bulkEndSessions(ids))} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-white/10 px-3 hover:bg-white/20">
            <LogOut size={15} aria-hidden /> Çıxış etdir
          </button>
          {pending && <LoaderCircle size={16} className="animate-spin" aria-hidden />}
          <button onClick={() => setSelected(new Set())} className="ml-auto grid h-9 w-9 place-items-center rounded-lg hover:bg-white/10" aria-label="Seçimi təmizlə">
            <X size={16} aria-hidden />
          </button>
        </div>
      )}

      {toast && (
        <div role="status" className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium shadow-xl ${toast.ok ? "bg-emerald-600 text-white" : "bg-red-600 text-white"}`}>
          {toast.ok ? <CheckCircle2 size={16} aria-hidden /> : <Ban size={16} aria-hidden />} {toast.text}
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="w-10 px-4 py-2.5">
                <input
                  type="checkbox"
                  checked={all}
                  onChange={() => setSelected(all ? new Set() : new Set(rows.map((r) => r.id)))}
                  aria-label="Hamısını seç"
                  className="h-4 w-4 accent-gray-900"
                />
              </th>
              <th className="px-2 py-2.5 text-left font-medium">İstifadəçi</th>
              <th className="px-3 py-2.5 text-left font-medium">Tarif</th>
              <th className="px-3 py-2.5 text-right font-medium">Xidmət</th>
              <th className="px-3 py-2.5 text-right font-medium">Sifariş</th>
              <th className="px-3 py-2.5 text-right font-medium">Faktura</th>
              <th className="px-3 py-2.5 text-left font-medium">Status</th>
              <th className="px-3 py-2.5 text-right font-medium">Qeydiyyat</th>
              <th className="px-4 py-2.5 text-right font-medium">Əməliyyatlar</th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {rows.map((u) => {
              const busy = pending && busyRow === u.id;
              return (
                <tr key={u.id} className={`border-t border-gray-100 ${selected.has(u.id) ? "bg-violet-50/60" : "hover:bg-gray-50"}`}>
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selected.has(u.id)} onChange={() => toggle(u.id)} aria-label={`${u.name} seç`} className="h-4 w-4 accent-gray-900" />
                  </td>
                  <td className="px-2 py-3">
                    <Link href={`/admin/users/${u.id}`} className="font-medium text-gray-900 hover:underline">
                      {u.name}
                    </Link>
                    <span className="block text-xs text-gray-500">
                      {u.email}
                      {u.username && (
                        <>
                          {" · "}
                          <a href={`/${u.username}`} target="_blank" className="hover:underline">
                            @{u.username}
                          </a>
                        </>
                      )}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${PLAN_STYLE[u.plan]}`}>{PLAN_NAMES[u.plan]}</span>
                  </td>
                  <td className="px-3 py-3 text-right">{u.services}</td>
                  <td className="px-3 py-3 text-right">{u.orders}</td>
                  <td className="px-3 py-3 text-right">{u.invoices}</td>
                  <td className="px-3 py-3">
                    {u.admin ? (
                      <span className="rounded-full bg-gray-900 px-2 py-0.5 text-xs font-medium text-white">Admin</span>
                    ) : u.blocked ? (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">Bloklanıb</span>
                    ) : (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">Aktiv</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-right text-xs text-gray-500">{u.created}</td>
                  <td className="px-4 py-2">
                    <div className="flex items-center justify-end gap-0.5">
                      {busy && <LoaderCircle size={15} className="mr-1 animate-spin text-gray-400" aria-hidden />}
                      <button disabled={pending || u.plan === "PRO_MAX"} onClick={() => run("Tarif qaldırıldı", () => stepPlan(u.id, 1), u.id)} className={iconBtn} title="Tarifi qaldır" aria-label={`${u.name}: tarifi qaldır`}>
                        <ArrowUp size={16} aria-hidden />
                      </button>
                      <button disabled={pending || u.plan === "FREE"} onClick={() => run("Tarif salındı", () => stepPlan(u.id, -1), u.id)} className={iconBtn} title="Tarifi sal" aria-label={`${u.name}: tarifi sal`}>
                        <ArrowDown size={16} aria-hidden />
                      </button>
                      {!u.admin &&
                        (u.blocked ? (
                          <button disabled={pending} onClick={() => run("Blok götürüldü", () => bulkUnblock([u.id]), u.id)} className={`${iconBtn} text-emerald-600`} title="Bloku götür" aria-label={`${u.name}: bloku götür`}>
                            <ShieldCheck size={16} aria-hidden />
                          </button>
                        ) : (
                          <button disabled={pending} onClick={() => openBlock([u.id])} className={`${iconBtn} hover:bg-red-50 hover:text-red-600`} title="Blokla" aria-label={`${u.name}: blokla`}>
                            <Ban size={16} aria-hidden />
                          </button>
                        ))}
                      <Link href={`/admin/users/${u.id}#duzelis`} className={iconBtn} title="Məlumatları dəyiş" aria-label={`${u.name}: dəyiş`}>
                        <Pencil size={15} aria-hidden />
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!rows.length && <p className="p-8 text-center text-sm text-gray-500">Heç nə tapılmadı.</p>}
      </div>

      {/* Bloklama səbəbi */}
      <dialog ref={dialog} className="m-auto w-full max-w-md rounded-2xl p-0 shadow-2xl backdrop:bg-black/40">
        <form
          method="dialog"
          onSubmit={(e) => {
            if (reason.trim().length < 3) {
              e.preventDefault();
              return;
            }
            run("Bloklandı", () => bulkBlock(blockIds, reason), blockIds.length === 1 ? blockIds[0] : undefined);
          }}
          className="p-6"
        >
          <h2 className="text-lg font-semibold">{blockIds.length === 1 ? "Hesabı blokla" : `${blockIds.length} hesabı blokla`}</h2>
          <p className="mt-1 text-sm text-gray-500">Hesab dərhal çıxış edir, səhifəsi və xidmətləri gizlənir. Sonradan bərpa etmək olar.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {REASONS.map((r) => (
              <button key={r} type="button" onClick={() => setReason(r)} className={`rounded-full border px-3 py-1 text-xs ${reason === r ? "border-gray-900 bg-gray-900 text-white" : "border-gray-300 text-gray-700 hover:border-gray-500"}`}>
                {r}
              </button>
            ))}
          </div>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            maxLength={300}
            placeholder="Səbəb"
            aria-label="Bloklama səbəbi"
            className="mt-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900"
          />
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={() => dialog.current?.close()} className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50">
              Ləğv et
            </button>
            <button disabled={reason.trim().length < 3} className="rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50">
              Blokla
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
