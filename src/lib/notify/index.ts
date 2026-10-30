// +994 50 123 45 67 → 994501234567
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("994")) return digits;
  if (digits.startsWith("0")) return "994" + digits.slice(1);
  return "994" + digits;
}

// MVP: satıcı fakturanı öz WhatsApp-ından göndərir.
export function whatsappShareLink(phone: string, text: string): string {
  return `https://wa.me/${normalizePhone(phone)}?text=${encodeURIComponent(text)}`;
}

export function invoiceShareText(input: { sellerName: string; number: string; amount: string; url: string }) {
  return `Salam! ${input.sellerName} tərəfindən ${input.number} nömrəli faktura: ${input.amount}.\nBaxmaq və ödəmək üçün: ${input.url}`;
}

// E-poçt Resend ilə göndərilir (RESEND_API_KEY və EMAIL_FROM). Qoşulmayıbsa false qaytarır.
export async function sendEmail(input: { to: string; subject: string; text: string }): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!key || !from) return false;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: input.to, subject: input.subject, text: input.text }),
  });
  if (!res.ok) console.error("E-poçt göndərilmədi", res.status, await res.text().catch(() => ""));
  return res.ok;
}

// M5: SMS (yerli provayder) və WhatsApp Business API

export async function sendSms(_: { to: string; text: string }): Promise<void> {
  throw new Error("SMS göndərmə hələ qoşulmayıb");
}
