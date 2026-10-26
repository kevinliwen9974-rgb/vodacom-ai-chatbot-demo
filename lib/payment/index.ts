import type { Payment, PaymentStatus } from "@/types";

export interface CreatePaymentInput {
  orderId: string;
  amount: number;
  currency: "ZAR";
  returnUrl: string;
}

export interface PaymentProvider {
  name: "mock" | "payfast" | "ozow";
  createPayment(input: CreatePaymentInput): Promise<Payment>;
  getPaymentStatus(paymentId: string): Promise<PaymentStatus>;
}

export class MockPaymentProvider implements PaymentProvider {
  name = "mock" as const;
  private statuses = new Map<string, PaymentStatus>();

  async createPayment(input: CreatePaymentInput): Promise<Payment> {
    const id = `pay_mock_${Date.now()}`;
    this.statuses.set(id, "created");
    const payment: Payment = {
      id,
      orderId: input.orderId,
      provider: "mock",
      amount: input.amount,
      currency: input.currency,
      status: "created",
      checkoutUrl: `/customer/checkout?paymentId=${id}&orderId=${input.orderId}`,
      createdAt: new Date().toISOString(),
    };
    return payment;
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentStatus> {
    return this.statuses.get(paymentId) ?? "failed";
  }

  /** Demo helper — simulate gateway success */
  markSucceeded(paymentId: string) {
    this.statuses.set(paymentId, "succeeded");
  }

  markProcessing(paymentId: string) {
    this.statuses.set(paymentId, "processing");
  }
}

/** Placeholders for later sandbox wiring */
export class PayfastProvider implements PaymentProvider {
  name = "payfast" as const;
  async createPayment(): Promise<Payment> {
    throw new Error("Payfast sandbox not configured");
  }
  async getPaymentStatus(): Promise<PaymentStatus> {
    throw new Error("Payfast sandbox not configured");
  }
}

export class OzowProvider implements PaymentProvider {
  name = "ozow" as const;
  async createPayment(): Promise<Payment> {
    throw new Error("Ozow sandbox not configured");
  }
  async getPaymentStatus(): Promise<PaymentStatus> {
    throw new Error("Ozow sandbox not configured");
  }
}

export const mockPaymentProvider = new MockPaymentProvider();

export function getPaymentProvider(): PaymentProvider {
  const mode = process.env.PAYMENT_PROVIDER ?? "mock";
  if (mode === "payfast") return new PayfastProvider();
  if (mode === "ozow") return new OzowProvider();
  return mockPaymentProvider;
}
