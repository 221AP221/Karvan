"use client";

import { Bot, LoaderCircle, MessageCircle, Send, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Turn = { role: "user" | "assistant"; content: string };
type Labels = {
  title: string;
  subtitle: string;
  open: string;
  close: string;
  placeholder: string;
  send: string;
  greeting: string;
  suggestions: string[];
  error: string;
  note: string;
};

const MAX_MESSAGE = 500;
// Panel və ödəniş ekranlarında köməkçi işi kəsməsin
const HIDDEN = ["/dashboard", "/admin", "/pay"];

export function ChatWidget({ t }: { t: Labels }) {
  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Yeni mesaj gələndə söhbət aşağı sürüşür
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [turns, busy]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (HIDDEN.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return null;

  async function ask(question: string) {
    const clean = question.trim().slice(0, MAX_MESSAGE);
    if (!clean || busy) return;
    const next: Turn[] = [...turns, { role: "user", content: clean }];
    setTurns(next);
    setText("");
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Söhbətin yalnız son hissəsi göndərilir
        body: JSON.stringify({ messages: next.slice(-12) }),
      });
      const data = (await res.json()) as { reply?: string; error?: string };
      if (data.reply) setTurns([...next, { role: "assistant", content: data.reply }]);
      else setError(data.error ?? t.error);
    } catch {
      setError(t.error);
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t.open}
        className="fixed bottom-4 right-4 z-40 grid h-14 w-14 place-items-center rounded-full bg-[var(--brand,#D6127E)] text-white shadow-xl shadow-black/20 transition hover:scale-105 sm:bottom-6 sm:right-6"
      >
        <MessageCircle size={24} strokeWidth={2} aria-hidden />
      </button>
    );
  }

  return (
    <div
      role="dialog"
      aria-label={t.title}
      className="fixed inset-x-3 bottom-3 z-40 flex max-h-[min(80vh,640px)] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl shadow-black/20 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-[400px] dark:border-white/10 dark:bg-[#15161a]"
    >
      <header className="flex items-center gap-3 border-b border-gray-100 px-4 py-3 dark:border-white/10">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--brand,#D6127E)]/10 text-[var(--brand,#D6127E)]">
          <Bot size={18} aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-gray-900 dark:text-white">{t.title}</span>
          <span className="block text-xs text-gray-500 dark:text-gray-400">{t.subtitle}</span>
        </span>
        <button type="button" onClick={() => setOpen(false)} aria-label={t.close} className="rounded-full p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-white/10">
          <X size={18} aria-hidden />
        </button>
      </header>

      <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        <p className="rounded-2xl rounded-tl-sm bg-gray-100 px-3.5 py-2.5 text-sm text-gray-800 dark:bg-white/10 dark:text-gray-100">{t.greeting}</p>

        {turns.length === 0 && (
          <div className="flex flex-wrap gap-2">
            {t.suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => ask(s)}
                className="rounded-full border border-gray-200 px-3 py-1.5 text-xs text-gray-600 transition hover:border-gray-400 dark:border-white/15 dark:text-gray-300"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {turns.map((turn, i) => (
          <p
            key={i}
            className={
              turn.role === "user"
                ? "ml-auto w-fit max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-[var(--brand,#D6127E)] px-3.5 py-2.5 text-sm text-white"
                : "w-fit max-w-[90%] whitespace-pre-wrap rounded-2xl rounded-tl-sm bg-gray-100 px-3.5 py-2.5 text-sm text-gray-800 dark:bg-white/10 dark:text-gray-100"
            }
          >
            {turn.content}
          </p>
        ))}

        {busy && (
          <p className="flex w-fit items-center gap-2 rounded-2xl rounded-tl-sm bg-gray-100 px-3.5 py-2.5 text-sm text-gray-500 dark:bg-white/10">
            <LoaderCircle size={15} className="animate-spin" aria-hidden /> ...
          </p>
        )}
        {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(text);
        }}
        className="flex items-end gap-2 border-t border-gray-100 p-3 dark:border-white/10"
      >
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              ask(text);
            }
          }}
          rows={1}
          maxLength={MAX_MESSAGE}
          placeholder={t.placeholder}
          aria-label={t.placeholder}
          className="max-h-28 min-h-10 flex-1 resize-none rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[var(--brand,#D6127E)] dark:border-white/15 dark:bg-white/5 dark:text-white"
        />
        <button
          type="submit"
          disabled={busy || !text.trim()}
          aria-label={t.send}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--brand,#D6127E)] text-white transition hover:opacity-90 disabled:opacity-40"
        >
          <Send size={17} aria-hidden />
        </button>
      </form>

      <p className="border-t border-gray-100 px-4 py-2 text-center text-[11px] text-gray-400 dark:border-white/10">{t.note}</p>
    </div>
  );
}
