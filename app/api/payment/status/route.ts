import { NextRequest, NextResponse } from "next/server";
import { CUSTOMERS } from "@/data/customers";
import { getProduct } from "@/data/products/catalog";
import { mockPaymentProvider } from "@/lib/payment";
import { appendEvent, orders, payments } from "@/lib/store/session";

export async function GET(req: NextRequest) {
  const paymentId = req.nextUrl.searchParams.get("paymentId");
  if (!paymentId) return NextResponse.json({ error: "paymentId required" }, { status: 400 });
  const payment = payments.get(paymentId);
  if (!payment) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ payment, order: orders.get(payment.orderId) });
}

/** Confirm mock payment success and update customer plan from structured product facts. */
export async function POST(req: NextRequest) {
  const sessionId = req.headers.get("x-session-id") || "sess_default";
  const body = await req.json().catch(() => ({}));
  const paymentId = String(body.paymentId || "");
  const payment = payments.get(paymentId);
  if (!payment) return NextResponse.json({ error: "not found" }, { status: 404 });

  mockPaymentProvider.markSucceeded(paymentId);
  payment.status = "succeeded";
  payments.set(paymentId, payment);

  const order = orders.get(payment.orderId);
  if (!order) return NextResponse.json({ error: "order missing" }, { status: 404 });
  order.status = "paid";
  orders.set(order.id, order);

  const product = getProduct(order.productId);
  const customer = CUSTOMERS[order.customerId];
  if (customer && product) {
    const onceOff =
      product.id.startsWith("TU-") || product.id.startsWith("MN-");
    if (onceOff) {
      customer.dataBalanceGb =
        Math.round((customer.dataBalanceGb + product.dataAllowanceGb) * 100) / 100;
      customer.airtimeBalance = Math.max(
        0,
        Math.round((customer.airtimeBalance - product.price) * 100) / 100,
      );
    } else {
      customer.currentPlanId = product.id;
      customer.currentPlanName = product.name.replace(" Bundle", "");
      customer.dataBalanceGb = product.dataAllowanceGb;
    }
  }

  appendEvent({
    sessionId,
    customerId: order.customerId,
    eventType: "purchase_complete",
    page: "/customer/checkout",
    productId: order.productId,
    timestamp: Date.now(),
  });

  return NextResponse.json({
    payment,
    order,
    customer,
    product,
    receipt: {
      id: `rcpt_${Date.now()}`,
      amount: order.amount,
      currency: order.currency,
      productName: product?.name,
      paidAt: new Date().toISOString(),
      note: "Demo transaction — MockPaymentProvider (not Vodacom production).",
    },
  });
}
