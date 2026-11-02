"use server";

import { redirect } from "next/navigation";
import { applyGatewayResult } from "@/lib/billing";
import { callbackUrl, returnUrl, sandboxEnabled, sandboxSign } from "@/lib/billing-gateway";
import { db } from "@/lib/db";

export type PayState = { error?: string } | undefined;

// Yalnız bu test kartları qəbul olunur: real kart nömrəsi heç vaxt işlənmir və saxlanılmır
const CARDS: Record<string, "ok" | "declined" | "funds" | "expired"> = {
  "4242424242424242": "ok",
  "5555555555554444": "ok",
  "4000000000000002": "declined",
  "4000000000009995": "funds",
  "4000000000000069": "expired",
};
const MESSAGES = { declined: "Bank ödənişi rədd etdi.", funds: "Kartda kifayət qədər vəsait yoxdur.", expired: "Kartın vaxtı bitib." };

// Real gateway kimi: nəticə server-server imzalı bildirişlə (webhook) göndərilir
async function notify(reference: string, status: "success" | "failed", amountQepik: number) {
  const data = Buffer.from(JSON.stringify({ status, order_id: reference, transaction: `sbx_${reference}`, amount: amountQepik / 100 })).toString("base64");
  try {
    const res = await fetch(callbackUrl("sandbox"), { method: "POST", body: new URLSearchParams({ data, signature: sandboxSign(data) }) });
    if (res.ok) return;
  } catch {}
  // Sayt başqa ünvanda/portda işləyirsə, eyni funksiya birbaşa çağırılır
  await applyGatewayResult({ reference, status: status === "success" ? "SUCCEEDED" : "FAILED", externalId: `sbx_${reference}`, amountQepik });
}

export async function payWithTestCard(reference: string, _: PayState, form: FormData): Promise<PayState> {
  if (!sandboxEnabled()) return { error: "Test rejimi söndürülüb" };
  const payment = await db.subscriptionPayment.findUnique({ where: { reference } });
  if (!payment || payment.method !== "CARD" || payment.status !== "PENDING") return { error: "Bu ödəniş artıq bağlanıb" };

  const number = String(form.get("number") ?? "").replace(/\D/g, "");
  const expiry = /^(\d{2})\s*\/\s*(\d{2})$/.exec(String(form.get("expiry") ?? "").trim());
  const cvc = String(form.get("cvc") ?? "");
  if (!(number in CARDS)) return { error: "Test rejimində yalnız test kartları qəbul olunur (aşağıdakı siyahıya baxın). Real kart nömrəsi yazmayın." };
  if (!expiry || Number(expiry[1]) < 1 || Number(expiry[1]) > 12) return { error: "Bitmə tarixi AA/İİ formatında olmalıdır" };
  if (new Date(2000 + Number(expiry[2]), Number(expiry[1]), 1) <= new Date()) return { error: "Kartın vaxtı bitib" };
  if (!/^\d{3,4}$/.test(cvc)) return { error: "CVC 3 rəqəm olmalıdır" };
  if (String(form.get("name") ?? "").trim().length < 3) return { error: "Kart sahibinin adını yazın" };

  const outcome = CARDS[number];
  if (outcome !== "ok") return { error: MESSAGES[outcome] }; // real gateway kimi: səhifədə qalır, yenidən cəhd olar
  await notify(reference, "success", payment.amountQepik);
  redirect(returnUrl(payment.id));
}

export async function cancelTestPayment(reference: string) {
  if (!sandboxEnabled()) return;
  const payment = await db.subscriptionPayment.findUnique({ where: { reference } });
  if (!payment || payment.status !== "PENDING") return;
  await notify(reference, "failed", payment.amountQepik);
  redirect(returnUrl(payment.id));
}
