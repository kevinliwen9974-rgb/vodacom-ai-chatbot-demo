import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getProduct } from "@/data/products/catalog";
import { getOrCreateSession, orders } from "@/lib/store/session";

const CreateSchema = z.object({
  productId: z.string(),
});

export async function POST(req: NextRequest) {
  const sessionId = req.headers.get("x-session-id") || "sess_default";
  const session = getOrCreateSession(sessionId);
  const parsed = CreateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "productId required" }, { status: 400 });
  }
  const product = getProduct(parsed.data.productId);
  if (!product) return NextResponse.json({ error: "product not found" }, { status: 404 });

  const id = `ord_${Date.now()}`;
  const order = {
    id,
    customerId: session.customerId,
    productId: product.id,
    amount: product.price,
    currency: product.currency,
    status: "pending" as const,
    createdAt: new Date().toISOString(),
  };
  orders.set(id, order);
  return NextResponse.json({ order, product });
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const order = orders.get(id);
  if (!order) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ order });
}
