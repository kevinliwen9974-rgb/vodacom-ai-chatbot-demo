import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { locateStores } from "@/lib/ai/stores-locate";

export const runtime = "nodejs";
export const maxDuration = 30;

const BodySchema = z.object({
  query: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  limit: z.number().min(1).max(8).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    const result = await locateStores(parsed.data);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Store lookup failed", stores: [], source: "local" },
      { status: 502 },
    );
  }
}
