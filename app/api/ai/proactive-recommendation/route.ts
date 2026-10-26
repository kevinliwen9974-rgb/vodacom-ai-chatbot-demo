import { NextRequest, NextResponse } from "next/server";
import { getProactiveRecommendation } from "@/lib/ai/dify";
import { getCustomer } from "@/data/customers";
import { getProduct, PRODUCTS } from "@/data/products/catalog";
import {
  aggregateBehavior,
  getOrCreateSession,
  shouldTriggerProactive,
} from "@/lib/store/session";

export async function POST(req: NextRequest) {
  const sessionId = req.headers.get("x-session-id") || "sess_default";
  const session = getOrCreateSession(sessionId);
  const body = await req.json().catch(() => ({}));
  const force = Boolean(body?.force);
  const aggregate = aggregateBehavior(sessionId);

  if (!force && !shouldTriggerProactive(aggregate)) {
    return NextResponse.json({
      shouldProactive: false,
      recommendation: null,
      customer: getCustomer(session.customerId),
      products: PRODUCTS,
      behavior: aggregate,
    });
  }

  const recommendation = await getProactiveRecommendation({
    customerId: session.customerId,
    behavior: aggregate,
  });

  const product = recommendation.recommendedProduct
    ? getProduct(recommendation.recommendedProduct)
    : null;

  return NextResponse.json({
    shouldProactive: recommendation.shouldProactive,
    recommendation,
    recommendedProduct: product,
    customer: getCustomer(session.customerId),
    products: PRODUCTS,
    behavior: aggregate,
  });
}
