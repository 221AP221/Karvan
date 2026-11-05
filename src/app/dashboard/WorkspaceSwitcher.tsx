"use client";

import { Check, ChevronDown, Crown, Users } from "lucide-react";
import { startTransition, useEffect, useRef, useState } from "react";
import { switchWorkspace } from "./team/actions";

type Workspace = { profileId: string; username: string; displayName: string; role: string; isCurrent: boolean; isOwn: boolean };

/** Öz səhifəsi ilə üzvü olduğu komandalar arasında keçid. Tək iş sahəsi olanda göstərilmir. */
export function WorkspaceSwitcher({ workspaces, roleLabels }: { workspaces: Workspace[]; roleLabels: Record<string, string> }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  if (workspaces.length < 2) return null;
  const current = workspaces.find((w) => w.isCurrent) ?? workspaces[0];

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="inline-flex max-w-[180px] items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:border-gray-400"
      >
        {current.isOwn ? <Crown size={13} className="shrink-0 text-amber-500" aria-hidden /> : <Users size={13} className="shrink-0 text-gray-400" aria-hidden />}
        <span className="truncate">{current.displayName}</span>
        <ChevronDown size={13} className="shrink-0 text-gray-400" aria-hidden />
      </button>

      {open && (
        <ul className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-xl shadow-black/10">
          {workspaces.map((w) => (
            <li key={w.profileId}>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  if (!w.isCurrent) startTransition(() => switchWorkspace(w.profileId));
                }}
                className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm transition hover:bg-gray-50"
              >
                {w.isOwn ? <Crown size={14} className="shrink-0 text-amber-500" aria-hidden /> : <Users size={14} className="shrink-0 text-gray-400" aria-hidden />}
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{w.displayName}</span>
                  <span className="block truncate text-xs text-gray-500">
                    /{w.username} · {roleLabels[w.role] ?? w.role}
                  </span>
                </span>
                {w.isCurrent && <Check size={15} className="shrink-0 text-[var(--brand)]" aria-hidden />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
