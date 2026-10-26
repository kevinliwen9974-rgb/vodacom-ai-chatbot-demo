import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { dashscopeChat, getDashScopeConfig } from "@/lib/ai/dashscope";
import {
  VODACOM_CS_SYSTEM,
  getChatModel,
  parseJsonObject,
  type ChatAction,
} from "@/lib/ai/chat-prompts";
import { detectIntent } from "@/lib/chat/intents";
import { answerFromFaq } from "@/lib/chat/faq";
import { customerGreetingName, getCustomer } from "@/data/customers";
import { ensureSessionIdFromHeader } from "@/lib/api/session";
import { getOrCreateSession } from "@/lib/store/session";

export const runtime = "nodejs";
export const maxDuration = 60;

const BodySchema = z.object({
  message: z.string().min(1).max(2000),
  customerId: z.string().optional(),
});

function fallbackReply(
  message: string,
  name: string,
  intent: string,
  customer: ReturnType<typeof getCustomer>,
): { reply: string; action?: ChatAction } {
  if (intent === "handoff") {
    return {
      reply: `Of course, ${name}. I can connect you to a Vodacom agent — shall I create a ticket for you?`,
      action: "handoff",
    };
  }
  if (intent === "coverage") {
    return {
      reply: "Sure. I can check what's available at your location.",
      action: "start_coverage",
    };
  }
  if (intent === "sim") {
    return {
      reply: `Happy to help with that, ${name}. I'll walk you through a secure SIM replacement now.`,
      action: "start_sim",
    };
  }
  if (intent === "purchase") {
    return {
      reply: `${name}, here are a few popular once-off bundles. Pick one and I'll take you to Top Up to finish.`,
      action: "show_bundles",
    };
  }
  if (
    customer &&
    (intent === "balance" || /balance|plan|usage/i.test(message))
  ) {
    return {
      reply: `${name}, you're on ${customer.currentPlanName} with ${customer.dataBalanceGb}GB left on ${customer.msisdnDisplay}. Your typical monthly usage is about ${customer.averageDataUsageGb}GB.`,
    };
  }
  if (intent === "billing" || /bill|invoice|statement|charges/i.test(message)) {
    return {
      reply: `${name}, I can walk you through your latest statement and highlight anything unusual.`,
      action: "start_billing",
    };
  }
  const faq = answerFromFaq(message);
  return {
    reply:
      faq ??
      `Hi ${name} — I can help with your balance, billing, buying a bundle, or a lost SIM. What do you need today?`,
  };
}

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const sessionId = ensureSessionIdFromHeader(req.headers.get("x-session-id"));
    const session = getOrCreateSession(sessionId);
    const customerId = parsed.data.customerId ?? session.customerId;
    const customer = getCustomer(customerId);
    const message = parsed.data.message;
    const intent = detectIntent(message);
    const name = customerGreetingName(customer);
    const faq = /^(how|what|why|where|when|which|who|can|could|do|does|is|are|will|should)\b|\?$/i.test(message.trim())
      ? answerFromFaq(message)
      : null;
    if (faq) return NextResponse.json({ reply: faq, intent: "faq" });
    const fb = fallbackReply(message, name, intent, customer);

    // Deterministic sub-flows: don't let LLM override start_* when intent is clear
    if (fb.action === "start_sim" || fb.action === "start_billing" || fb.action === "show_bundles" || fb.action === "handoff" || fb.action === "start_coverage") {
      try {
        getDashScopeConfig();
      } catch {
        /* ignore — still return deterministic action */
      }
      return NextResponse.json({
        reply: fb.reply,
        intent,
        action: fb.action,
      });
    }

    try {
      getDashScopeConfig();
    } catch {
      return NextResponse.json({
        reply: fb.reply,
        intent,
        action: fb.action,
      });
    }

    const snapshot = customer
      ? {
          firstName: name,
          plan: customer.currentPlanName,
          msisdn: customer.sim.msisdn,
          accountNumber: customer.accountNumber,
          dataBalanceGb: customer.dataBalanceGb,
          airtimeBalance: customer.airtimeBalance,
          averageDataUsageGb: customer.averageDataUsageGb,
          outOfBundleSpend: customer.outOfBundleSpend,
          serviceLines: customer.serviceLines,
        }
      : { firstName: name };

    const raw = await dashscopeChat({
      model: getChatModel(),
      temperature: 0.55,
      messages: [
        { role: "system", content: VODACOM_CS_SYSTEM },
        {
          role: "user",
          content: `Customer snapshot (facts only): ${JSON.stringify(snapshot)}
Detected intent hint: ${intent}
Allowed actions if clearly requested: handoff | start_sim | start_billing | start_coverage | show_bundles | none

Customer message: ${message}

Reply JSON ONLY:
{"reply":"customer-facing text","action":"none|handoff|start_sim|start_billing|start_coverage|show_bundles"}`,
        },
      ],
    });

    const obj = parseJsonObject(raw);
    const reply =
      typeof obj?.reply === "string" && obj.reply.trim()
        ? obj.reply.trim()
        : fb.reply;
    const actionRaw = typeof obj?.action === "string" ? obj.action : "none";
    const allowed: ChatAction[] = [
      "none",
      "handoff",
      "start_sim",
      "start_billing",
      "start_coverage",
      "show_bundles",
    ];
    const action = allowed.includes(actionRaw as ChatAction)
      ? (actionRaw as ChatAction)
      : fb.action;

    return NextResponse.json({
      reply,
      intent,
      action: action === "none" ? undefined : action,
    });
  } catch {
    return NextResponse.json(
      {
        error: "Sorry, I couldn't respond just now. Please try again.",
      },
      { status: 502 },
    );
  }
}
