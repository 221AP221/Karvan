import { createHash, createHmac, timingSafeEqual } from "node:crypto";

// Kart ödənişi: kart məlumatı heç vaxt Karvan-a daxil olmur. İstifadəçi ödəniş sisteminin (gateway) öz
// səhifəsinə yönləndirilir, nəticəni gateway server-server bildirişi (webhook) ilə bizə göndərir.
export type GatewayResult = { reference: string; status: "SUCCEEDED" | "FAILED"; externalId?: string; amountQepik?: number };

export type GatewayName = "epoint" | "payriff" | "sandbox";

export interface BillingGateway {
  readonly name: GatewayName;
  // Nəticəni gateway API-dən soruşur (istifadəçi qayıdanda və ya webhook itəndə). Dəstəkləmirsə, boş.
  fetchResult?(payment: { reference: string; externalId: string | null }): Promise<GatewayResult | null>;
  // Brauzerin gateway-dən qayıtması (GET) bu gateway-də hansı sorğu parametrini daşıyır
  returnParam?: string;
  createCheckout(input: { reference: string; amountQepik: number; description: string; successUrl: string; errorUrl: string; callbackUrl: string }): Promise<{ url: string; externalId?: string }>;
  parseWebhook(request: Request): Promise<GatewayResult | null>;
}

const appUrl = () => (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
const safeEqual = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

// Epoint.az: data = base64(JSON), signature = base64(sha1(private_key + data + private_key)).
// Sahə adlarını və endpoint-i https://epoint.az sənədləri və test hesabı ilə yoxlayın.
const epoint: BillingGateway = {
  name: "epoint",
  // Best-effort: sənəddə statusu soruşmaq üçün endpoint varsa (EPOINT_STATUS_URL) istifadə olunur; xəta olsa, webhook gözlənilir
  async fetchResult(payment) {
    const url = process.env.EPOINT_STATUS_URL;
    if (!url || !payment.externalId) return null;
    const privateKey = process.env.EPOINT_PRIVATE_KEY!;
    const data = Buffer.from(JSON.stringify({ public_key: process.env.EPOINT_PUBLIC_KEY, transaction: payment.externalId })).toString("base64");
    const signature = createHash("sha1").update(privateKey + data + privateKey).digest("base64");
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ data, signature }) });
    const json = (await res.json().catch(() => null)) as { status?: string; amount?: number | string } | null;
    const status = String(json?.status ?? "").toLowerCase();
    if (!res.ok || !status || status === "new" || status === "pending") return null;
    return { reference: payment.reference, status: status === "success" ? "SUCCEEDED" : "FAILED", externalId: payment.externalId, amountQepik: json?.amount !== undefined ? Math.round(Number(json.amount) * 100) : undefined };
  },
  async createCheckout(input) {
    const publicKey = process.env.EPOINT_PUBLIC_KEY!;
    const privateKey = process.env.EPOINT_PRIVATE_KEY!;
    const data = Buffer.from(
      JSON.stringify({
        public_key: publicKey,
        amount: Number((input.amountQepik / 100).toFixed(2)),
        currency: "AZN",
        language: "az",
        order_id: input.reference,
        description: input.description,
        success_redirect_url: input.successUrl,
        error_redirect_url: input.errorUrl,
        result_url: input.callbackUrl,
      }),
    ).toString("base64");
    const signature = createHash("sha1").update(privateKey + data + privateKey).digest("base64");
    const res = await fetch(process.env.EPOINT_API_URL ?? "https://epoint.az/api/1/request", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ data, signature }),
    });
    const json = (await res.json().catch(() => null)) as { status?: string; redirect_url?: string; transaction?: string; message?: string } | null;
    if (!res.ok || json?.status !== "success" || !json.redirect_url) throw new Error(json?.message ?? "Ödəniş sistemi cavab vermədi");
    return { url: json.redirect_url, externalId: json.transaction };
  },
  async parseWebhook(request) {
    const form = await request.formData().catch(() => null);
    const data = String(form?.get("data") ?? "");
    const signature = String(form?.get("signature") ?? "");
    if (!data || !signature) return null;
    const privateKey = process.env.EPOINT_PRIVATE_KEY!;
    const expected = createHash("sha1").update(privateKey + data + privateKey).digest("base64");
    if (!safeEqual(signature, expected)) return null;
    const body = JSON.parse(Buffer.from(data, "base64").toString("utf8")) as { status?: string; order_id?: string; transaction?: string; amount?: number | string };
    if (!body.order_id) return null;
    const status = String(body.status ?? "").toLowerCase();
    if (status === "new" || status === "pending") return null; // hələ tamamlanmayıb
    return {
      reference: body.order_id,
      status: status === "success" ? "SUCCEEDED" : "FAILED",
      externalId: body.transaction,
      amountQepik: body.amount !== undefined ? Math.round(Number(body.amount) * 100) : undefined,
    };
  },
};

// Payriff v3: POST /api/v3/orders (Authorization: secret key). Callback imzasızdır, ona görə bildirişə inanmırıq:
// yalnız orderId götürülür, nəticə API-dən (GET /orders/{id}) alınır. Sahə adlarını Payriff sənədi və sandbox sifarişi ilə yoxlayın.
const payriffBase = () => (process.env.PAYRIFF_API_URL ?? "https://api.payriff.com/api/v3").replace(/\/$/, "");
type PayriffOrder = { payload?: { orderId?: string; paymentUrl?: string; paymentStatus?: string; orderStatus?: string; amount?: number | string } };

function payriffResult(reference: string, externalId: string, json: PayriffOrder | null): GatewayResult | null {
  const status = String(json?.payload?.paymentStatus ?? json?.payload?.orderStatus ?? "").toUpperCase();
  if (!status || ["CREATED", "NEW", "PENDING", "INPROGRESS", "IN_PROGRESS"].includes(status)) return null; // hələ tamamlanmayıb
  const amount = json?.payload?.amount;
  return { reference, status: ["APPROVED", "PAID", "SUCCESS", "SUCCEEDED"].includes(status) ? "SUCCEEDED" : "FAILED", externalId, amountQepik: amount !== undefined ? Math.round(Number(amount) * 100) : undefined };
}

async function payriffFetch(orderId: string) {
  const res = await fetch(`${payriffBase()}/orders/${encodeURIComponent(orderId)}`, { headers: { Authorization: process.env.PAYRIFF_SECRET_KEY! } });
  return res.ok ? ((await res.json().catch(() => null)) as PayriffOrder | null) : null;
}

const payriff: BillingGateway = {
  name: "payriff",
  returnParam: "orderId",
  async createCheckout(input) {
    const res = await fetch(`${payriffBase()}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: process.env.PAYRIFF_SECRET_KEY! },
      body: JSON.stringify({ amount: Number((input.amountQepik / 100).toFixed(2)), language: "AZ", currency: "AZN", description: input.description, callbackUrl: input.callbackUrl, cardSave: false, operation: "PURCHASE" }),
    });
    const json = (await res.json().catch(() => null)) as (PayriffOrder & { message?: string }) | null;
    if (!res.ok || !json?.payload?.paymentUrl || !json.payload.orderId) throw new Error(json?.message ?? "Ödəniş sistemi cavab vermədi");
    return { url: json.payload.paymentUrl, externalId: json.payload.orderId };
  },
  async fetchResult(payment) {
    if (!payment.externalId) return null;
    return payriffResult(payment.reference, payment.externalId, await payriffFetch(payment.externalId));
  },
  async parseWebhook(request) {
    // Callback JSON (POST) və ya brauzer qayıdışı (GET ?orderId=): hər ikisində yalnız orderId götürülür
    let orderId = new URL(request.url).searchParams.get("orderId") ?? "";
    if (!orderId && request.method === "POST") {
      const body = (await request.json().catch(() => null)) as { orderId?: string; payload?: { orderId?: string } } | null;
      orderId = body?.payload?.orderId ?? body?.orderId ?? "";
    }
    if (!orderId) return null;
    const { db } = await import("@/lib/db");
    const payment = await db.subscriptionPayment.findFirst({ where: { provider: "payriff", externalId: orderId }, select: { reference: true } });
    if (!payment) return null;
    return payriffResult(payment.reference, orderId, await payriffFetch(orderId));
  },
};

// Test gateway: real gateway ilə eyni yol (yönləndirmə + imzalı webhook + eyni aktivləşmə). Fərq yalnız ondadır ki,
// ödəniş səhifəsi /pay/sandbox-dır və yalnız test kartlarını qəbul edir, pul çıxılmır.
const sandboxSecret = () => process.env.SANDBOX_SECRET ?? "karvan-sandbox-secret";
export const sandboxSign = (data: string) => createHmac("sha256", sandboxSecret()).update(data).digest("hex");

const sandbox: BillingGateway = {
  name: "sandbox",
  async createCheckout(input) {
    return { url: `${appUrl()}/pay/sandbox/${input.reference}` };
  },
  async parseWebhook(request) {
    const form = await request.formData().catch(() => null);
    const data = String(form?.get("data") ?? "");
    const signature = String(form?.get("signature") ?? "");
    if (!data || !signature || !safeEqual(signature, sandboxSign(data))) return null;
    const body = JSON.parse(Buffer.from(data, "base64").toString("utf8")) as { status?: string; order_id?: string; transaction?: string; amount?: number };
    if (!body.order_id) return null;
    return { reference: body.order_id, status: body.status === "success" ? "SUCCEEDED" : "FAILED", externalId: body.transaction, amountQepik: body.amount !== undefined ? Math.round(body.amount * 100) : undefined };
  },
};

export function sandboxEnabled() {
  return process.env.PAYMENT_GATEWAY === "sandbox" || (!process.env.PAYMENT_GATEWAY && process.env.NODE_ENV !== "production");
}

export function getBillingGateway(): BillingGateway | null {
  const chosen = process.env.PAYMENT_GATEWAY;
  if (chosen === "epoint" && process.env.EPOINT_PUBLIC_KEY && process.env.EPOINT_PRIVATE_KEY) return epoint;
  if (chosen === "payriff" && process.env.PAYRIFF_SECRET_KEY) return payriff;
  if (sandboxEnabled()) return sandbox;
  return null;
}

export function gatewayByName(name: string): BillingGateway | null {
  if (name === "epoint" && process.env.EPOINT_PRIVATE_KEY) return epoint;
  if (name === "payriff" && process.env.PAYRIFF_SECRET_KEY) return payriff;
  if (name === "sandbox" && sandboxEnabled()) return sandbox;
  return null;
}

export const callbackUrl = (provider: string) => `${appUrl()}/api/payments/webhook/${provider}`;
export const returnUrl = (paymentId: string) => `${appUrl()}/dashboard/billing/success?id=${paymentId}`;
