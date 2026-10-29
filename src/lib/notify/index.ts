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

// M2/M5: e-poçt (Resend), SMS (yerli provayder) və WhatsApp Business API
export async function sendEmail(_: { to: string; subject: string; text: string; pdf?: Buffer }): Promise<void> {
  throw new Error("E-poçt göndərmə hələ qoşulmayıb");
}

export async function sendSms(_: { to: string; text: string }): Promise<void> {
  throw new Error("SMS göndərmə hələ qoşulmayıb");
}
