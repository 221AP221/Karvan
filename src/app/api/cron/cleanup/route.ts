import { runInactivityCleanup } from "@/lib/inactivity";

export const dynamic = "force-dynamic";

/**
 * Passiv hesabların təmizlənməsi (gündəlik cron ilə çağırılır).
 *
 *   curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://karvan.az/api/cron/cleanup
 *
 * `CRON_SECRET` təyin edilməyibsə, nöqtə bağlıdır — təsadüfən işə düşə bilməz.
 * `?dryRun=1` yalnız hesablayır, heç nə silmir.
 */
async function handle(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return Response.json({ error: "CRON_SECRET təyin edilməyib" }, { status: 503 });

  const header = request.headers.get("authorization") ?? "";
  if (header !== `Bearer ${secret}`) return new Response("Not found", { status: 404 });

  const dryRun = new URL(request.url).searchParams.get("dryRun") === "1";
  const result = await runInactivityCleanup({ dryRun });
  return Response.json(
    { dryRun, checked: result.checked, warned: result.warned.length, deleted: result.deleted.length },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export const POST = handle;
export const GET = handle;
