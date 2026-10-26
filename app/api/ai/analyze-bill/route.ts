import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { analyzeBill } from "@/lib/ai/dify";

export const runtime = "nodejs";
export const maxDuration = 60;

const BodySchema = z.object({
  imageDataUrl: z
    .string()
    .min(32)
    .refine(
      (v) => v.startsWith("data:image/"),
      "imageDataUrl must be a data:image/* URL",
    ),
  customerId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    // Cap ~7MB raw base64 payload for demo safety
    if (parsed.data.imageDataUrl.length > 10_000_000) {
      return NextResponse.json(
        { error: "Image too large (max ~7MB)" },
        { status: 413 },
      );
    }

    const result = await analyzeBill(parsed.data.imageDataUrl);
    return NextResponse.json({
      summary: result.summary,
      // customer-facing only — no model/provider names
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Bill analysis failed";
    console.error("[analyze-bill]", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
