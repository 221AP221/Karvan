"use client";

import { Eye, EyeOff, Lock } from "lucide-react";
import { useState } from "react";

export function PasswordField({
  label,
  name,
  autoComplete = "current-password",
  minLength,
  value,
  onChange,
  hint,
  labels = { show: "Şifrəni göstər", hide: "Şifrəni gizlət", caps: "Caps Lock aktivdir" },
}: {
  label: string;
  name: string;
  autoComplete?: string;
  minLength?: number;
  value?: string;
  onChange?: (v: string) => void;
  hint?: React.ReactNode;
  labels?: { show: string; hide: string; caps: string };
}) {
  const [visible, setVisible] = useState(false);
  const [caps, setCaps] = useState(false);
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
      <span className="relative block">
        <Lock size={16} strokeWidth={1.75} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden />
        <input
          name={name}
          type={visible ? "text" : "password"}
          required
          minLength={minLength}
          autoComplete={autoComplete}
          value={value}
          onChange={onChange && ((e) => onChange(e.target.value))}
          onKeyUp={(e) => setCaps(e.getModifierState("CapsLock"))}
          className="h-12 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-12 text-[15px] outline-none transition placeholder:text-gray-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 dark:border-white/10 dark:bg-white/[0.04] dark:text-gray-100"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? labels.hide : labels.show}
          aria-pressed={visible}
          className="absolute right-1.5 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/10 dark:hover:text-gray-200"
        >
          {visible ? <EyeOff size={18} strokeWidth={1.75} aria-hidden /> : <Eye size={18} strokeWidth={1.75} aria-hidden />}
        </button>
      </span>
      {caps && <span className="mt-1 block text-xs text-amber-600">{labels.caps}</span>}
      {hint}
    </label>
  );
}
