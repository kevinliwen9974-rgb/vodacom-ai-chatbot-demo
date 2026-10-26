import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getPaymentProvider, mockPaymentProvider } from "@/lib/payment";
import { orders, payments } from "@/lib/store/session";

const Schema = z.object({
  orderId: z.string(),
  returnUrl: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const parsed = Schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "orderId required" }, { status: 400 });
  }
  const order = orders.get(parsed.data.orderId);
  if (!order) return NextResponse.json({ error: "order not found" }, { status: 404 });

  const provider = getPaymentProvider();
  const payment = await provider.createPayment({
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    returnUrl: parsed.data.returnUrl ?? "/customer/checkout",
  });

  order.status = "awaiting_payment";
  order.paymentId = payment.id;
  orders.set(order.id, order);
  payments.set(payment.id, payment);

  // auto-mark processing for mock UX
  if (provider.name === "mock") {
    mockPaymentProvider.markProcessing(payment.id);
    payment.status = "processing";
    payments.set(payment.id, payment);
  }

  return NextResponse.json({ payment, order });
}
