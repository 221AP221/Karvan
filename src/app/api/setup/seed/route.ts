import { execFile } from "node:child_process";
import { promisify } from "node:util";

export const dynamic = "force-dynamic";

const execFileAsync = promisify(execFile);

/**
 * Shell-siz planlarda demo hesabı (/demo, demo@karvan.az) aktivləşdirmək üçün.
 * `ALLOW_SEED=1 npx prisma db seed` ilə eynidir, yalnız bir dəfəlik HTTP çağırışı ilə.
 *
 *   curl -X POST https://sizin-domen/api/setup/seed \
 *     -H "Authorization: Bearer $CRON_SECRET"
 *
 * Diqqət: bu, /demo profilini VƏ onun 90 günlük nümunə analitikasını yaradır — ictimai
 * kataloqda görünür. `CRON_SECRET` təyin edilməyibsə, nöqtə bağlıdır.
 */
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return Response.json({ error: "CRON_SECRET təyin edilməyib" }, { status: 503 });

  const header = request.headers.get("authorization") ?? "";
  if (header !== `Bearer ${secret}`) return new Response("Not found", { status: 404 });

  try {
    const { stdout, stderr } = await execFileAsync("npx", ["prisma", "db", "seed"], {
      cwd: process.cwd(),
      env: { ...process.env, ALLOW_SEED: "1" },
      timeout: 60_000,
    });
    return Response.json({ ok: true, output: (stdout + stderr).trim() });
  } catch (err) {
    const e = err as { stdout?: string; stderr?: string; message: string };
    return Response.json({ ok: false, error: e.message, output: ((e.stdout ?? "") + (e.stderr ?? "")).trim() }, { status: 500 });
  }
}
