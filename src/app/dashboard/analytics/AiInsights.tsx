"use client";

import { AlertTriangle, CheckCircle2, Lightbulb, LoaderCircle, Sparkles, TrendingUp } from "lucide-react";
import { useState } from "react";
import { Card, secondaryButtonClass } from "@/components/ui";
import type { AnalyticsAdvice } from "@/lib/ai";
import { callAi } from "@/lib/ai-client";

type Words = {
  aiTitle: string;
  aiText: string;
  aiButton: string;
  aiLoading: string;
  aiAgain: string;
  aiInsights: string;
  aiRisks: string;
  aiActions: string;
  aiForecast: string;
  aiNote: string;
  aiEffort: string;
};

const EFFORT_STYLE: Record<string, string> = {
  asan: "bg-emerald-100 text-emerald-800",
  orta: "bg-amber-100 text-amber-800",
  çətin: "bg-red-100 text-red-800",
};

/** Analitika səhifəsinin rəqəmlərini AI-a oxudub müşahidə, risk və plan şəklində qaytarır. */
export function AiInsights({ period, words }: { period: number; words: Words }) {
  const [state, setState] = useState<{ busy?: boolean; error?: string; advice?: AnalyticsAdvice }>({});

  async function run() {
    setState({ busy: true });
    try {
      setState({ advice: await callAi<AnalyticsAdvice>("analytics", { period }) });
    } catch (error) {
      setState({ error: (error as Error).message });
    }
  }

  const { advice } = state;

  return (
    <Card
      title={words.aiTitle}
      actions={
        <button type="button" onClick={run} disabled={state.busy} className={`${secondaryButtonClass} gap-2`}>
          {state.busy ? <LoaderCircle size={15} className="animate-spin" aria-hidden /> : <Sparkles size={15} aria-hidden />}
          {state.busy ? words.aiLoading : advice ? words.aiAgain : words.aiButton}
        </button>
      }
    >
      {!advice && !state.error && !state.busy && <p className="text-sm text-gray-500">{words.aiText}</p>}
      {state.error && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {state.error}
        </p>
      )}

      {advice && (
        <div className="flex flex-col gap-5">
          <p className="text-sm font-medium">{advice.headline}</p>

          <section>
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Lightbulb size={15} className="text-amber-500" aria-hidden /> {words.aiInsights}
            </h3>
            <ul className="flex flex-col gap-2.5">
              {advice.insights.map((i) => (
                <li key={i.title} className="text-sm">
                  <span className="font-medium">{i.title}.</span> <span className="text-gray-600">{i.detail}</span>
                </li>
              ))}
            </ul>
          </section>

          {advice.risks.length > 0 && (
            <section>
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                <AlertTriangle size={15} className="text-red-500" aria-hidden /> {words.aiRisks}
              </h3>
              <ul className="flex flex-col gap-2.5">
                {advice.risks.map((i) => (
                  <li key={i.title} className="text-sm">
                    <span className="font-medium">{i.title}.</span> <span className="text-gray-600">{i.detail}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
              <CheckCircle2 size={15} className="text-emerald-600" aria-hidden /> {words.aiActions}
            </h3>
            <ol className="flex flex-col gap-3">
              {advice.actions.map((a, i) => (
                <li key={a.title} className="flex gap-3 text-sm">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-gray-100 text-xs font-semibold">{i + 1}</span>
                  <span className="min-w-0">
                    <span className="font-medium">{a.title}</span>
                    <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-medium ${EFFORT_STYLE[a.effort] ?? "bg-gray-100 text-gray-700"}`}>
                      {a.effort} {words.aiEffort}
                    </span>
                    <span className="mt-0.5 block text-gray-600">{a.detail}</span>
                  </span>
                </li>
              ))}
            </ol>
          </section>

          <section className="rounded-xl bg-gray-50 p-3.5">
            <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold text-gray-700">
              <TrendingUp size={15} className="text-[var(--brand)]" aria-hidden /> {words.aiForecast}
            </h3>
            <p className="text-sm text-gray-600">{advice.forecast}</p>
          </section>

          <p className="text-xs text-gray-400">{words.aiNote}</p>
        </div>
      )}
    </Card>
  );
}
