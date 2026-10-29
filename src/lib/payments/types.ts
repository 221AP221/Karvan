export type CreatePaymentResult =
  | { kind: "redirect"; url: string; externalId: string }
  | { kind: "manual" };

export type WebhookResult = {
  externalId: string;
  status: "SUCCEEDED" | "FAILED";
  amountQepik: number;
};

// Hər provayder (manual, Payriff, Epoint, ...) bu interfeysi tətbiq edir.
export interface PaymentProvider {
  readonly name: string;
  createPayment(input: {
    invoicePublicId: string;
    amountQepik: number;
    description: string;
    returnUrl: string;
  }): Promise<CreatePaymentResult>;
  verifyWebhook(request: Request): Promise<WebhookResult | null>;
}
