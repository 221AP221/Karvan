import { hashPassword } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Shell-siz planlarda (Render Free və s.) admin hesabı yaratmaq/yeniləmək üçün.
 * `scripts/make-admin.ts` ilə eyni məntiq, yalnız bir dəfəlik HTTP çağırışı ilə.
 *
 *   curl -X POST https://sizin-domen/api/setup/admin \
 *     -H "Authorization: Bearer $CRON_SECRET" \
 *     -H "Content-Type: application/json" \
 *     -d '{"email":"admin@sizin-domen.az","password":"GucluSifre123!"}'
 *
 * `CRON_SECRET` təyin edilməyibsə, nöqtə bağlıdır — təsadüfən işə düşə bilməz.
 */
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return Response.json({ error: "CRON_SECRET təyin edilməyib" }, { status: 503 });

  const header = request.headers.get("authorization") ?? "";
  if (header !== `Bearer ${secret}`) return new Response("Not found", { status: 404 });

  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.toLowerCase().trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const superAdmin = body?.super !== false;

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return Response.json({ error: "Düzgün e-poçt yazın" }, { status: 400 });
  if (password.length < 10) return Response.json({ error: "Şifrə ən azı 10 simvol olmalıdır" }, { status: 400 });

  const role = superAdmin ? "SUPER_ADMIN" : "ADMIN";
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    await db.user.update({ where: { id: existing.id }, data: { role, blockedAt: null, passwordHash: await hashPassword(password) } });
    return Response.json({ ok: true, message: `${email} indi ${role === "SUPER_ADMIN" ? "super admin" : "admin"}dir, şifrə yeniləndi.` });
  }
  await db.user.create({ data: { email, role, passwordHash: await hashPassword(password) } });
  return Response.json({ ok: true, message: `Yeni ${role === "SUPER_ADMIN" ? "super admin" : "admin"} yaradıldı: ${email}` });
}
