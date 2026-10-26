import { NextRequest, NextResponse } from "next/server";
import { getCustomer } from "@/data/customers";
import { getInvoices } from "@/data/billing";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  if (!getCustomer(id)) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json({ invoices: getInvoices(id) });
}
