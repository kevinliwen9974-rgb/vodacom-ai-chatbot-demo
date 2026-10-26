/** Shared Vodacom CS prompt + JSON reply helpers (DashScope). */

export const VODACOM_CS_SYSTEM = `You are a Vodacom South Africa digital customer-care assistant in a live self-service chat.
Tone: warm, clear, commercial CS — use the customer's first name when given.
Rules:
- Keep replies short (1–3 sentences). No markdown headings.
- Never mention AI, models, demos, CRM, backends, Qwen, DashScope, or internal tools.
- Never invent balances, prices, or account facts not provided in context.
- Do not invent security answers or document numbers.
- Speak as Vodacom staff helping the customer complete their request.`;

export type ChatAction =
  | "none"
  | "handoff"
  | "start_sim"
  | "start_billing"
  | "start_coverage"
  | "show_bundles";

export function parseJsonObject(raw: string): Record<string, unknown> | null {
  const trimmed = raw.trim();
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = fence?.[1]?.trim() ?? trimmed;
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(body.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function getChatModel(): string {
  // Chat copy: prefer flash for speed
  return (
    process.env.DASHSCOPE_CHAT_MODEL ||
    process.env.DASHSCOPE_LLM_MODEL_FLASH ||
    process.env.DASHSCOPE_LLM_MODEL ||
    "qwen3.6-flash"
  );
}

export function getVisionModel(): string {
  return (
    process.env.DASHSCOPE_VISION_MODEL ||
    process.env.DASHSCOPE_LLM_MODEL ||
    "qwen3.6-27b"
  );
}
