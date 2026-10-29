import type { PaymentProvider } from "./types";

const manual: PaymentProvider = {
  name: "manual",
  async createPayment() {
    return { kind: "manual" };
  },
  async verifyWebhook() {
    return null;
  },
};

// M5: seçilmiş gateway burada qoşulacaq (bax: docs/PRD.md §8).
const providers: Record<string, PaymentProvider> = { manual };

export function getPaymentProvider(name: string): PaymentProvider {
  const provider = providers[name];
  if (!provider) throw new Error(`Naməlum ödəniş provayderi: ${name}`);
  return provider;
}
