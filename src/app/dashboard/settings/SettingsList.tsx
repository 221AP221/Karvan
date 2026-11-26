"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { useActionState, useEffect, useId, useState } from "react";
import { setCatalogVisibility } from "./actions";

/**
 * Parametrlər siyahısı. Hər parametr bir sətirdir: ikon, ad və hazırkı dəyər.
 * Forma yalnız kliklədikdə elə həmin yerdə açılır — səhifə ~2600 px-dən ~760 px-ə düşür.
 */

export function SettingsGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 ml-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">{label}</h2>
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">{children}</div>
    </section>
  );
}

const rowClass = "flex w-full items-center gap-3 border-t border-gray-100 px-4 py-3.5 text-left first:border-t-0";
const iconClass = "grid h-8 w-8 shrink-0 place-items-center rounded-[10px] bg-gray-50 text-gray-600";
const valueClass = "ml-auto truncate text-sm text-gray-500 tabular-nums";

/** Açılıb-bağlanan sətir: forma içəridə, sətirdən aşağıda görünür. */
export function SettingRow({
  id,
  icon,
  title,
  value,
  danger,
  children,
}: {
  id: string;
  icon: React.ReactNode;
  title: string;
  value?: string;
  danger?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  // /dashboard/settings#sifre kimi linklər birbaşa həmin bölməni açır
  useEffect(() => {
    const sync = () => window.location.hash.slice(1) === id && setOpen(true);
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, [id]);

  return (
    <div id={id} className={open ? "border-t border-gray-100 bg-gray-50/40 first:border-t-0" : undefined}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className={`${rowClass} transition hover:bg-gray-50 ${open ? "border-t-0 bg-transparent hover:bg-transparent" : ""}`}
      >
        <span className={`${iconClass} ${danger ? "bg-red-50 text-red-600" : ""} ${open && !danger ? "bg-[var(--brand)]/10 text-[var(--brand)]" : ""}`} aria-hidden>
          {icon}
        </span>
        <span className={`shrink-0 whitespace-nowrap text-sm font-semibold ${danger ? "text-red-600" : ""}`}>{title}</span>
        {value && <span className={valueClass}>{value}</span>}
        <ChevronDown
          size={16}
          className={`shrink-0 text-gray-400 transition ${value ? "ml-3" : "ml-auto"} ${open ? "rotate-180 text-gray-500" : ""}`}
          aria-hidden
        />
      </button>

      {open && (
        <div id={panelId} className="px-4 pb-4 pl-[3.75rem]">
          {children}
        </div>
      )}
    </div>
  );
}

/** Başqa səhifəyə aparan sətir (məs. Komanda) — açılacaq forması yoxdur. */
export function SettingLinkRow({ icon, title, value, href }: { icon: React.ReactNode; title: string; value?: string; href: string }) {
  return (
    <Link href={href} className={`${rowClass} transition hover:bg-gray-50`}>
      <span className={iconClass} aria-hidden>
        {icon}
      </span>
      <span className="shrink-0 whitespace-nowrap text-sm font-semibold">{title}</span>
      {value && <span className={valueClass}>{value}</span>}
      <ChevronDown size={16} className={`shrink-0 -rotate-90 text-gray-400 ${value ? "ml-3" : "ml-auto"}`} aria-hidden />
    </Link>
  );
}

/**
 * Yalnız yandır-söndürdən ibarət parametr: açmağa ehtiyac yoxdur, açar elə sətirdədir
 * və dəyişən kimi yadda saxlanılır.
 */
export function CatalogSwitchRow({ icon, title, visible }: { icon: React.ReactNode; title: string; visible: boolean }) {
  const [state, action, pending] = useActionState(setCatalogVisibility, undefined as Awaited<ReturnType<typeof setCatalogVisibility>> | undefined);
  const [on, setOn] = useState(visible);

  return (
    <form action={action} className={rowClass}>
      <span className={iconClass} aria-hidden>
        {icon}
      </span>
      <span className="shrink-0 whitespace-nowrap text-sm font-semibold">{title}</span>
      <span className={valueClass}>
        {state?.error ? <span className="text-red-600">{state.error}</span> : on ? "kataloqda görünürsünüz" : "kataloqda gizlisiniz"}
      </span>
      {/* Gizli input serverə gedir; düymə onu çevirib formanı göndərir */}
      <input type="hidden" name="showInCatalog" value={on ? "on" : "off"} />
      <button
        type="submit"
        role="switch"
        aria-checked={on}
        aria-label={`${title}nda görün`}
        disabled={pending}
        onClick={(e) => {
          const next = !on;
          setOn(next);
          const input = e.currentTarget.form?.elements.namedItem("showInCatalog") as HTMLInputElement | null;
          if (input) input.value = next ? "on" : "off";
        }}
        className={`relative ml-3 h-6 w-10 shrink-0 rounded-full transition disabled:opacity-60 ${on ? "bg-[var(--brand)]" : "bg-gray-300"}`}
      >
        <span className={`absolute top-[3px] h-[18px] w-[18px] rounded-full bg-white transition-all ${on ? "left-[19px]" : "left-[3px]"}`} />
      </button>
    </form>
  );
}
