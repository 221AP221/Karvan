import { applyGatewayResult } from "@/lib/billing";
import { gatewayByName } from "@/lib/billing-gateway";
import { db } from "@/lib/db";

async function handle(request: Request, provider: string) {
  const gateway = gatewayByName(provider);
  if (!gateway) return null;
  const result = await gateway.parseWebhook(request).catch(() => null);
  if (result) await applyGatewayResult(result);
  return result;
}

// Gateway-in server-server bildirişi. İmza (və ya API təsdiqi) yoxlanılır; təkrar bildirişlər zərərsizdir.
export async function POST(request: Request, { params }: { params: Promise<{ provider: string }> }) {
  const provider = (await params).provider;
  if (!gatewayByName(provider)) return new Response("not found", { status: 404 });
  return (await handle(request, provider)) ? new Response("ok") : new Response("invalid", { status: 400 });
}

// Bəzi gateway-lər istifadəçini callback ünvanına geri yönləndirir (GET): nəticə yoxlanılır, ödəniş səhifəsinə keçilir
export async function GET(request: Request, { params }: { params: Promise<{ provider: string }> }) {
  const provider = (await params).provider;
  if (!gatewayByName(provider)) return new Response("not found", { status: 404 });
  await handle(request, provider);
  // Nəticə hələ gəlməyibdirsə də istifadəçi ödəniş səhifəsinə qayıdır (o, statusu yenidən yoxlayır)
  const orderId = new URL(request.url).searchParams.get(gatewayByName(provider)?.returnParam ?? "orderId") ?? "";
  const payment = orderId ? await db.subscriptionPayment.findFirst({ where: { provider, OR: [{ externalId: orderId }, { reference: orderId }] }, select: { id: true } }) : null;
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin).replace(/\/$/, "");
  return Response.redirect(payment ? `${base}/dashboard/billing/success?id=${payment.id}` : `${base}/dashboard/billing`, 303);
}
