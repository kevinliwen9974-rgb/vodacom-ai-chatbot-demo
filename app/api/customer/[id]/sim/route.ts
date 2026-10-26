import { NextRequest, NextResponse } from "next/server";
import { getCustomer } from "@/data/customers";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const customer = getCustomer(id);
  if (!customer) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({
    sim: {
      ...customer.sim,
      currentPlan: customer.currentPlanName,
      dataBalanceGb: customer.dataBalanceGb,
      voiceBalanceMinutes: customer.voiceBalanceMinutes,
      smsBalance: customer.smsBalance,
      airtimeBalance: customer.airtimeBalance,
    },
  });
}
