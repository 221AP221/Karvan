"use client";

import { Check, Copy, Crown, Trash2, UserPlus } from "lucide-react";
import { startTransition, useActionState, useState } from "react";
import { ActionForm } from "@/components/ActionForm";
import type { MemberStatus, TeamRole } from "@/generated/prisma/client";
import { changeMemberRole, inviteMember, removeMember } from "./actions";

const field =
  "h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/20";

export function InviteForm() {
  const [state, action, pending] = useActionState(inviteMember, undefined);
  const [copied, setCopied] = useState(false);

  return (
    <>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          startTransition(() => action(data));
        }}
        className="flex flex-col gap-3 sm:flex-row sm:items-end"
      >
        <label className="block flex-1">
          <span className="mb-1 block text-xs font-medium text-gray-600">E-poçt</span>
          <input name="email" type="email" required placeholder="komanda@nümunə.az" className={field} />
        </label>
        <label className="block sm:w-48">
          <span className="mb-1 block text-xs font-medium text-gray-600">Rol</span>
          <select name="role" defaultValue="STAFF" className={field}>
            <option value="MANAGER">Menecer</option>
            <option value="STAFF">İşçi</option>
          </select>
        </label>
        <button
          disabled={pending}
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full bg-[var(--brand)] px-5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
        >
          <UserPlus size={15} aria-hidden /> {pending ? "Göndərilir..." : "Dəvət göndər"}
        </button>
      </form>

      {state?.error && (
        <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {state.error}
        </p>
      )}

      {state?.ok && state.inviteLink && (
        <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm">
          <p className="font-medium text-emerald-900">Dəvət yaradıldı</p>
          <p className="mt-0.5 text-emerald-800">
            E-poçt provayderi qoşulubsa, məktub getdi. Linki özünüz də göndərə bilərsiniz:
          </p>
          <div className="mt-2 flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded-lg bg-white px-2.5 py-2 font-mono text-xs text-gray-700">{state.inviteLink}</code>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(state.inviteLink!);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              aria-label="Linki kopyala"
              className="shrink-0 rounded-lg border border-emerald-300 p-2 text-emerald-700 transition hover:bg-emerald-100"
            >
              {copied ? <Check size={15} aria-hidden /> : <Copy size={15} aria-hidden />}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

type Member = {
  id: string;
  role: TeamRole;
  status: MemberStatus;
  email: string;
  name: string | null;
  /** Server-də formatlanmış tarix qeydi — müştəri tərəfdə Intl işlətmirik (hidrasiya uyğunsuzluğu). */
  dateNote: string;
};

const statusStyle: Record<MemberStatus, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-800",
  INVITED: "bg-amber-100 text-amber-800",
  SUSPENDED: "bg-gray-200 text-gray-600",
};

export function MemberRow({
  member,
  roleLabels,
  roleHints,
  statusLabels,
}: {
  member: Member;
  roleLabels: Record<TeamRole, string>;
  roleHints: Record<TeamRole, string>;
  statusLabels: Record<MemberStatus, string>;
}) {
  const [confirming, setConfirming] = useState(false);
  const isOwner = member.role === "OWNER";

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-2">
          {isOwner && <Crown size={15} className="shrink-0 text-amber-500" aria-hidden />}
          <span className="font-medium">{member.name ?? member.email}</span>
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyle[member.status]}`}>{statusLabels[member.status]}</span>
        </p>
        <p className="mt-0.5 text-xs text-gray-500">
          {member.name ? `${member.email} · ` : ""}
          {roleHints[member.role]}
          {member.dateNote}
        </p>
      </div>

      {!isOwner && (
        <div className="flex shrink-0 items-center gap-2">
          <ActionForm action={changeMemberRole} submitLabel="" className="contents" buttonClassName="hidden">
            <input type="hidden" name="id" value={member.id} />
            <select
              name="role"
              defaultValue={member.role}
              onChange={(e) => e.currentTarget.form?.requestSubmit()}
              aria-label={`${member.email} üçün rol`}
              className="h-9 rounded-lg border border-gray-300 px-2 text-sm outline-none focus:border-[var(--brand)]"
            >
              <option value="MANAGER">{roleLabels.MANAGER}</option>
              <option value="STAFF">{roleLabels.STAFF}</option>
            </select>
          </ActionForm>

          {confirming ? (
            <ActionForm action={removeMember} submitLabel="" className="contents" buttonClassName="hidden">
              <input type="hidden" name="id" value={member.id} />
              <button type="submit" className="rounded-full bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700">
                Çıxart
              </button>
              <button type="button" onClick={() => setConfirming(false)} className="px-2 text-xs text-gray-500 hover:underline">
                Ləğv et
              </button>
            </ActionForm>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              aria-label="Komandadan çıxart"
              className="rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 size={16} aria-hidden />
            </button>
          )}
        </div>
      )}
    </li>
  );
}
