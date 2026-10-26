import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { dashscopeChat, getDashScopeConfig } from "@/lib/ai/dashscope";
import {
  VODACOM_CS_SYSTEM,
  getChatModel,
  parseJsonObject,
} from "@/lib/ai/chat-prompts";

export const runtime = "nodejs";
export const maxDuration = 45;

const BodySchema = z.object({
  step: z.string(),
  event: z.string(),
  firstName: z.string().optional(),
  fallback: z.string().min(1),
  facts: z.record(z.string(), z.unknown()).optional(),
  allowedActions: z.array(z.string()).optional(),
});

/**
 * LLM rewrites SIM self-care surface copy. State machine stays in the client.
 */
export async function POST(req: NextRequest) {
  let fallback = "Please continue with the steps above.";
  try {
    const json = await req.json();
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { step, event, firstName, facts, allowedActions } = parsed.data;
    fallback = parsed.data.fallback;

    try {
      getDashScopeConfig();
    } catch {
      return NextResponse.json({ text: fallback });
    }

    const raw = await dashscopeChat({
      model: getChatModel(),
      temperature: 0.45,
      messages: [
        { role: "system", content: VODACOM_CS_SYSTEM },
        {
          role: "user",
          content: `Rewrite the assistant message for a SIM self-care step.
First name: ${firstName ?? "there"}
Current step: ${step}
Event: ${event}
Facts (do not invent beyond these): ${JSON.stringify(facts ?? {})}
Allowed next actions (mention only if relevant): ${(allowedActions ?? []).join(", ") || "none"}

Fallback wording (keep meaning, vary phrasing naturally):
${fallback}

Reply JSON ONLY:
{"text":"rewritten customer-facing message"}`,
        },
      ],
    });

    const obj = parseJsonObject(raw);
    const text =
      typeof obj?.text === "string" && obj.text.trim()
        ? obj.text.trim()
        : fallback;

    return NextResponse.json({ text });
  } catch {
    return NextResponse.json({ text: fallback });
  }
}
