"use client";

import { Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export type AiDemoText = {
  prompt: string;
  you: string;
  reading: string;
  convert: string;
  ready: string;
  check: string;
  total: string;
  rows: { label: string; value: string }[];
};

type Phase = "typing" | "thinking" | "result";

// Sərbəst mətnin fakturaya çevrilməsini göstərən dövri animasiya. Ekrana daxil olanda başlayır.
export function AiDemo({ t }: { t: AiDemoText }) {
  const PROMPT = t.prompt;
  const RESULT = t.rows;
  const ref = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);
  const [typed, setTyped] = useState(0);
  const [phase, setPhase] = useState<Phase>("typing");
  const [rows, setRows] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setTyped(PROMPT.length);
      setPhase("result");
      setRows(RESULT.length);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => entry?.isIntersecting && setStarted(true), { threshold: 0.4 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [PROMPT.length, RESULT.length]);

  useEffect(() => {
    if (!started) return;
    let timer: ReturnType<typeof setTimeout>;
    if (phase === "typing") {
      timer =
        typed < PROMPT.length
          ? setTimeout(() => setTyped((n) => n + 1), 32)
          : setTimeout(() => setPhase("thinking"), 500);
    } else if (phase === "thinking") {
      timer = setTimeout(() => setPhase("result"), 1100);
    } else {
      timer =
        rows < RESULT.length
          ? setTimeout(() => setRows((n) => n + 1), 220)
          : setTimeout(() => {
              setTyped(0);
              setRows(0);
              setPhase("typing");
            }, 4500);
    }
    return () => clearTimeout(timer);
  }, [started, phase, typed, rows, PROMPT.length, RESULT.length]);

  return (
    <div ref={ref} className="grid gap-4 md:grid-cols-2">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-violet-300">{t.you}</p>
        <p className="min-h-[96px] tabular-nums text-sm leading-relaxed text-white sm:text-base">
          {PROMPT.slice(0, typed)}
          {phase === "typing" && <span className="animate-caret ml-0.5 inline-block h-4 w-0.5 translate-y-0.5 bg-violet-300" />}
        </p>
        <div className="mt-4 flex items-center gap-2 text-sm">
          <span
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 font-medium transition ${
              phase === "thinking" ? "bg-violet-500 text-white" : "bg-white/10 text-violet-200"
            }`}
          >
            {phase === "thinking" ? (
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            ) : (
              <Sparkles size={16} strokeWidth={1.75} aria-hidden />
            )}
            <span>{phase === "thinking" ? t.reading : t.convert}</span>
          </span>
        </div>
      </div>

      <div className="rounded-3xl bg-white p-5 text-gray-900 shadow-2xl shadow-violet-950/40">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{t.ready}</p>
          <span className={`rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 transition-opacity ${rows === RESULT.length ? "opacity-100" : "opacity-0"}`}>
            {t.check}
          </span>
        </div>
        <dl className="divide-y divide-gray-100">
          {RESULT.map((row, i) => (
            <div
              key={row.label}
              className={`flex justify-between gap-3 py-2.5 text-sm transition-all duration-500 ${
                i < rows ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0"
              }`}
            >
              <dt className="text-gray-500">{row.label}</dt>
              <dd className="text-right font-medium">{row.value}</dd>
            </div>
          ))}
        </dl>
        <div className={`mt-3 flex items-center justify-between rounded-2xl bg-gray-900 px-4 py-3 text-white transition-all duration-500 ${rows === RESULT.length ? "opacity-100" : "opacity-0"}`}>
          <span className="text-sm text-gray-300">{t.total}</span>
          <span className="text-lg font-semibold">150,00 AZN</span>
        </div>
      </div>
    </div>
  );
}
