/**
 * Server-only DashScope (OpenAI-compatible) client.
 * Secrets never leave Route Handlers / lib/ai.
 */

export function getDashScopeConfig() {
  const apiKey = process.env.DASHSCOPE_API_KEY;
  const baseUrl =
    process.env.DASHSCOPE_BASE_URL ??
    "https://dashscope-intl.aliyuncs.com/compatible-mode/v1";
  // KYC vision: qwen3.6-27b (accurate) — override with DASHSCOPE_VISION_MODEL for flash
  const visionModel =
    process.env.DASHSCOPE_VISION_MODEL ??
    process.env.DASHSCOPE_LLM_MODEL ??
    "qwen3.6-27b";
  const asrModel = process.env.DASHSCOPE_ASR_MODEL ?? "qwen3-asr-flash";

  if (!apiKey) {
    throw new Error("DASHSCOPE_API_KEY is not configured");
  }

  return { apiKey, baseUrl, visionModel, asrModel };
}

type ChatContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } }
  | { type: "input_audio"; input_audio: { data: string } };

interface ChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string | Array<{ text?: string; type?: string }>;
    };
  }>;
  error?: { message?: string; code?: string };
}

function extractText(data: ChatCompletionResponse): string {
  const content = data.choices?.[0]?.message?.content;
  if (typeof content === "string") return content.trim();
  if (Array.isArray(content)) {
    return content
      .map((c) => (typeof c === "string" ? c : c.text ?? ""))
      .join("")
      .trim();
  }
  return "";
}

export async function dashscopeChat(input: {
  model: string;
  messages: Array<{
    role: "system" | "user" | "assistant";
    content: string | ChatContentPart[];
  }>;
  temperature?: number;
  /** Qwen3.6 defaults to thinking; false keeps KYC/chat fast. */
  enableThinking?: boolean;
  extra?: Record<string, unknown>;
}): Promise<string> {
  const { apiKey, baseUrl } = getDashScopeConfig();
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: input.model,
      messages: input.messages,
      temperature: input.temperature ?? 0.2,
      stream: false,
      // Without this, qwen3.6-* burns seconds on reasoning_content
      enable_thinking: input.enableThinking ?? false,
      ...input.extra,
    }),
  });

  const data = (await res.json()) as ChatCompletionResponse;
  if (!res.ok) {
    const msg = data.error?.message ?? `DashScope HTTP ${res.status}`;
    throw new Error(msg);
  }

  const text = extractText(data);
  if (!text) {
    throw new Error("Empty model response");
  }
  return text;
}

export async function analyzeBillImage(imageDataUrl: string): Promise<{
  summary: string;
  raw: string;
}> {
  const { visionModel } = getDashScopeConfig();

  const prompt = `You are helping a telecom customer understand a bill photo.
Extract ONLY facts visible in the image. Do not invent amounts, dates, or line items.
If something is unreadable, say so explicitly.

Respond in English with this structure:
1) Short summary (2-3 sentences)
2) Bullet list of visible line items / totals
3) Any questions the customer might want to ask support

Do not mention model names or providers.`;

  const raw = await dashscopeChat({
    model: visionModel,
    messages: [
      {
        role: "user",
        content: [
          { type: "image_url", image_url: { url: imageDataUrl } },
          { type: "text", text: prompt },
        ],
      },
    ],
    temperature: 0.1,
  });

  return { summary: raw, raw };
}

export async function transcribeAudio(
  audioDataUrl: string,
  language?: string,
): Promise<{ text: string }> {
  const { asrModel } = getDashScopeConfig();

  const asrOptions: Record<string, unknown> = { enable_itn: true };
  if (language) asrOptions.language = language;

  const text = await dashscopeChat({
    model: asrModel,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "input_audio",
            input_audio: { data: audioDataUrl },
          },
        ],
      },
    ],
    extra: { asr_options: asrOptions },
  });

  return { text };
}
