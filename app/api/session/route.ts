import { NextRequest, NextResponse } from "next/server";
import { getCustomer } from "@/data/customers";
import {
  getOrCreateSession,
  resetSession,
  setCustomer,
  aggregateBehavior,
  buildJourneySteps,
} from "@/lib/store/session";

export async function GET(req: NextRequest) {
  const sessionId = req.headers.get("x-session-id") || "sess_default";
  const session = getOrCreateSession(sessionId);
  const aggregate = aggregateBehavior(sessionId);
  return NextResponse.json({
    sessionId,
    customerId: session.customerId,
    customer: getCustomer(session.customerId),
    aggregate,
    journey: buildJourneySteps(aggregate),
  });
}

export async function POST(req: NextRequest) {
  const sessionId = req.headers.get("x-session-id") || "sess_default";
  const body = await req.json().catch(() => ({}));
  if (body.action === "reset") {
    resetSession(sessionId, body.customerId);
  } else if (body.action === "select" && body.customerId) {
    setCustomer(sessionId, body.customerId);
  }
  const session = getOrCreateSession(sessionId);
  const aggregate = aggregateBehavior(sessionId);
  return NextResponse.json({
    sessionId,
    customerId: session.customerId,
    customer: getCustomer(session.customerId),
    aggregate,
    journey: buildJourneySteps(aggregate),
  });
}
