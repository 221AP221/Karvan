import { LEGAL_UPDATED } from "./layout";

export function LegalHeader({ title, intro }: { title: string; intro: string }) {
  return (
    <header className="mb-8 border-b border-gray-200 pb-6 dark:border-white/10">
      <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-white">{title}</h1>
      <p className="mt-3 leading-relaxed text-gray-600 dark:text-gray-300">{intro}</p>
      <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Son yenilənmə: {LEGAL_UPDATED}</p>
    </header>
  );
}

export function Section({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8 first:mt-0">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
        <span className="mr-2 text-[var(--brand)]">{n}</span>
        {title}
      </h2>
      <div className="mt-3 space-y-3 leading-relaxed text-gray-700 dark:text-gray-300">{children}</div>
    </section>
  );
}

export function Bullets({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2.5">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--brand)]" aria-hidden />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function DataTable({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left dark:border-white/10">
            {head.map((h) => (
              <th key={h} className="py-2.5 pr-4 font-semibold text-gray-900 dark:text-white">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-gray-100 align-top last:border-0 dark:border-white/5">
              {row.map((cell, j) => (
                <td key={j} className="py-2.5 pr-4 text-gray-700 dark:text-gray-300">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
