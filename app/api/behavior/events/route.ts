import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  aggregateBehavior,
  appendEvent,
  buildJourneySteps,
  getOrCreateSession,
  shouldTriggerProactive,
} from "@/lib/store/session";

const EventSchema = z.object({
  eventType: z.enum([
    "page_view",
    "product_view",
    "product_compare",
    "product_detail",
    "scroll",
    "click_buy",
    "chat_open",
    "chat_close",
    "portal_login",
    "checkout_start",
    "purchase_complete",
    "fast_forward",
  ]),
  page: z.string(),
  productId: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(req: NextRequest) {
  const sessionId = req.headers.get("x-session-id") || "sess_default";
  const session = getOrCreateSession(sessionId);
  const parsed = EventSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  appendEvent({
    sessionId,
    customerId: session.customerId,
    eventType: parsed.data.eventType,
    page: parsed.data.page,
    productId: parsed.data.productId,
    timestamp: Date.now(),
    metadata: parsed.data.metadata,
  });

  const aggregate = aggregateBehavior(sessionId);
  return NextResponse.json({
    aggregate,
    shouldProactive: shouldTriggerProactive(aggregate),
    journey: buildJourneySteps(aggregate),
  });
}

export async function GET(req: NextRequest) {
  const sessionId = req.headers.get("x-session-id") || "sess_default";
  getOrCreateSession(sessionId);
  const aggregate = aggregateBehavior(sessionId);
  return NextResponse.json({
    aggregate,
    shouldProactive: shouldTriggerProactive(aggregate),
    journey: buildJourneySteps(aggregate),
    customerId: getOrCreateSession(sessionId).customerId,
  });
}
