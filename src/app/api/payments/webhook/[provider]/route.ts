import { applyGatewayResult } from "@/lib/billing";
import { gatewayByName } from "@/lib/billing-gateway";

// Gateway-in server-server bildirişi. İmza yoxlanılır; təkrar bildirişlər zərərsizdir.
export async function POST(request: Request, { params }: { params: Promise<{ provider: string }> }) {
  const gateway = gatewayByName((await params).provider);
  if (!gateway) return new Response("not found", { status: 404 });
  const result = await gateway.parseWebhook(request).catch(() => null);
  if (!result) return new Response("invalid", { status: 400 });
  await applyGatewayResult(result);
  return new Response("ok");
}
