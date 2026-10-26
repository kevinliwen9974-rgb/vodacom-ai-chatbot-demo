import { NextRequest, NextResponse } from "next/server";
import { getCustomer, listCustomers } from "@/data/customers";
import { getOrCreateSession, setCustomer } from "@/lib/store/session";

function sid(req: NextRequest) {
  return req.headers.get("x-session-id") || "sess_default";
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  if (id === "list") {
    return NextResponse.json({ customers: listCustomers().map((c) => ({ id: c.id, name: c.name })) });
  }
  const customer = getCustomer(id);
  if (!customer) return NextResponse.json({ error: "not found" }, { status: 404 });
  getOrCreateSession(sid(req));
  return NextResponse.json({ customer });
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  if (body?.action === "select") {
    if (!getCustomer(id)) return NextResponse.json({ error: "not found" }, { status: 404 });
    setCustomer(sid(req), id);
    return NextResponse.json({ ok: true, customerId: id });
  }
  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}
