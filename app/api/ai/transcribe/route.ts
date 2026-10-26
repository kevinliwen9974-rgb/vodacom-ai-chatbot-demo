import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { transcribeVoice } from "@/lib/ai/dify";

export const runtime = "nodejs";
export const maxDuration = 60;

const BodySchema = z.object({
  audioDataUrl: z
    .string()
    .min(32)
    .refine(
      (v) => v.startsWith("data:audio/"),
      "audioDataUrl must be a data:audio/* URL",
    ),
  language: z.string().optional(),
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

    if (parsed.data.audioDataUrl.length > 14_000_000) {
      return NextResponse.json(
        { error: "Audio too large (max ~10MB)" },
        { status: 413 },
      );
    }

    const result = await transcribeVoice(
      parsed.data.audioDataUrl,
      parsed.data.language,
    );
    return NextResponse.json({ text: result.text });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Transcription failed";
    console.error("[transcribe]", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
