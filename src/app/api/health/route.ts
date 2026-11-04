import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Xarici monitorinq üçün vəziyyət nöqtəsi (NFR-REL-05, NFR-OPS-04).
 * 200 — sistem işləkdir, 503 — baza cavab vermir. Heç bir şəxsi məlumat qaytarmır.
 */
export async function GET() {
  const started = Date.now();
  let dbMs: number | null = null;
  let ok = true;
  try {
    await db.$queryRaw`SELECT 1`;
    dbMs = Date.now() - started;
  } catch {
    ok = false;
  }
  return new Response(
    JSON.stringify({
      ok,
      db: ok ? "up" : "down",
      dbMs,
      uptimeSec: Math.round(process.uptime()),
      time: new Date().toISOString(),
    }),
    {
      status: ok ? 200 : 503,
      headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
    },
  );
}
