"use client";

import { Pencil, Power, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ActionForm } from "@/components/ActionForm";
import type { DiscountType, Plan } from "@/generated/prisma/client";
import { createCoupon, deleteCoupon, toggleCoupon, updateCoupon } from "../actions";

type Coupon = {
  id: string;
  code: string;
  type: DiscountType;
  value: number;
  plans: Plan[];
  months: number | null;
  maxUses: number | null;
  maxUsesPerUser: number | null;
  usedCount: number;
  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean;
  note: string | null;
  redemptions: number;
};

const field = "h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/20";
const label = "mb-1 block text-xs font-medium text-gray-600";
const day = (iso: string | null) => (iso ? iso.slice(0, 10) : "");

export function CouponForm({ editing }: { editing: Coupon | null }) {
  const [type, setType] = useState<DiscountType>(editing?.type ?? "PERCENT");

  return (
    <section className="h-fit rounded-2xl border border-gray-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold">{editing ? "Kodu dəyiş" : "Yeni endirim kodu"}</h2>
        {editing && (
          <Link href="/admin/campaigns" className="rounded-full p-1 text-gray-400 hover:bg-gray-100" aria-label="Redaktəni bağla">
            <X size={16} aria-hidden />
          </Link>
        )}
      </div>

      <ActionForm
        action={editing ? updateCoupon : createCoupon}
        submitLabel={editing ? "Yadda saxla" : "Kodu yarat"}
        successMessage={editing ? "Kod yeniləndi" : "Kod yaradıldı"}
        resetOnSuccess={!editing}
      >
        {editing && <input type="hidden" name="id" value={editing.id} />}

        <label className="block">
          <span className={label}>Kod</span>
          <input
            name="code"
            required
            defaultValue={editing?.code ?? ""}
            placeholder="YAZ2026"
            maxLength={24}
            className={`${field} font-mono uppercase`}
            onChange={(e) => (e.target.value = e.target.value.toUpperCase())}
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className={label}>Endirim növü</span>
            <select name="type" value={type} onChange={(e) => setType(e.target.value as DiscountType)} className={field}>
              <option value="PERCENT">Faizlə</option>
              <option value="FIXED">Sabit məbləğ</option>
            </select>
          </label>
          <label className="block">
            <span className={label}>{type === "PERCENT" ? "Faiz (1-100)" : "Məbləğ (AZN)"}</span>
            <input
              name="value"
              required
              type="number"
              min={type === "PERCENT" ? 1 : 0.01}
              max={type === "PERCENT" ? 100 : undefined}
              step={type === "PERCENT" ? 1 : 0.01}
              defaultValue={editing ? (editing.type === "PERCENT" ? editing.value : (editing.value / 100).toFixed(2)) : ""}
              className={field}
            />
          </label>
        </div>

        <fieldset>
          <span className={label}>Hansı tariflərə aiddir</span>
          <div className="flex gap-4 text-sm">
            {(["PRO", "PRO_MAX"] as const).map((p) => (
              <label key={p} className="flex items-center gap-2">
                <input type="checkbox" name="plans" value={p} defaultChecked={editing?.plans.includes(p)} className="h-4 w-4 accent-[var(--brand)]" />
                {p === "PRO" ? "Pro" : "Pro Max"}
              </label>
            ))}
          </div>
          <span className="mt-1 block text-xs text-gray-500">Heç biri seçilməyibsə, hər iki tarifə aiddir.</span>
        </fieldset>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className={label}>Müddət məhdudiyyəti</span>
            <select name="months" defaultValue={editing?.months ? String(editing.months) : ""} className={field}>
              <option value="">Hamısı</option>
              <option value="1">Yalnız aylıq</option>
              <option value="12">Yalnız illik</option>
            </select>
          </label>
          <label className="block">
            <span className={label}>Ümumi istifadə limiti</span>
            <input name="maxUses" type="number" min={1} defaultValue={editing?.maxUses ?? ""} placeholder="limitsiz" className={field} />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className={label}>Bir istifadəçi üçün</span>
            <input name="maxUsesPerUser" type="number" min={1} defaultValue={editing?.maxUsesPerUser ?? 1} placeholder="limitsiz" className={field} />
          </label>
          <div />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className={label}>Başlama tarixi</span>
            <input name="startsAt" type="date" defaultValue={day(editing?.startsAt ?? null)} className={field} />
          </label>
          <label className="block">
            <span className={label}>Bitmə tarixi</span>
            <input name="endsAt" type="date" defaultValue={day(editing?.endsAt ?? null)} className={field} />
          </label>
        </div>

        <label className="block">
          <span className={label}>Qeyd (yalnız admin görür)</span>
          <input name="note" defaultValue={editing?.note ?? ""} placeholder="Yaz kampaniyası, Instagram reklamı..." maxLength={200} className={field} />
        </label>
      </ActionForm>
    </section>
  );
}

function Pill({ children, tone = "gray" }: { children: React.ReactNode; tone?: "gray" | "green" | "amber" | "red" }) {
  const cls = {
    gray: "bg-gray-100 text-gray-700",
    green: "bg-emerald-100 text-emerald-800",
    amber: "bg-amber-100 text-amber-800",
    red: "bg-red-100 text-red-700",
  }[tone];
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>{children}</span>;
}

export function CouponRow({ coupon: c }: { coupon: Coupon }) {
  const now = Date.now();
  const expired = c.endsAt !== null && new Date(c.endsAt).getTime() < now;
  const notStarted = c.startsAt !== null && new Date(c.startsAt).getTime() > now;
  const exhausted = c.maxUses !== null && c.usedCount >= c.maxUses;
  const state = !c.isActive ? ["Deaktiv", "red"] : expired ? ["Müddəti bitib", "amber"] : notStarted ? ["Başlamayıb", "amber"] : exhausted ? ["Limit dolub", "amber"] : ["Aktiv", "green"];

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-sm font-semibold">{c.code}</span>
          <Pill tone="gray">{c.type === "PERCENT" ? `${c.value}%` : `${(c.value / 100).toFixed(2)} AZN`}</Pill>
          <Pill tone={state[1] as "green"}>{state[0]}</Pill>
        </p>
        <p className="mt-1 text-xs text-gray-500">
          {c.plans.length === 0 ? "Bütün tariflər" : c.plans.map((p) => (p === "PRO" ? "Pro" : "Pro Max")).join(", ")}
          {c.months ? ` · yalnız ${c.months === 1 ? "aylıq" : "illik"}` : ""}
          {" · "}
          {c.usedCount}
          {c.maxUses ? `/${c.maxUses}` : ""} istifadə
          {c.maxUsesPerUser ? ` · hər istifadəçi ${c.maxUsesPerUser}` : ""}
          {c.startsAt || c.endsAt ? ` · ${day(c.startsAt) || "..."} — ${day(c.endsAt) || "..."}` : ""}
          {c.note ? ` · ${c.note}` : ""}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <Link href={`/admin/campaigns?edit=${c.id}`} aria-label={`${c.code} kodunu dəyiş`} className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900">
          <Pencil size={16} aria-hidden />
        </Link>
        <ActionForm action={toggleCoupon} submitLabel="" className="contents" buttonClassName="hidden">
          <input type="hidden" name="id" value={c.id} />
          <button type="submit" aria-label={c.isActive ? "Deaktiv et" : "Aktiv et"} className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900">
            <Power size={16} aria-hidden />
          </button>
        </ActionForm>
        {c.usedCount === 0 && (
          <ActionForm action={deleteCoupon} submitLabel="" className="contents" buttonClassName="hidden">
            <input type="hidden" name="id" value={c.id} />
            <button type="submit" aria-label="Sil" className="rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600">
              <Trash2 size={16} aria-hidden />
            </button>
          </ActionForm>
        )}
      </div>
    </li>
  );
}
