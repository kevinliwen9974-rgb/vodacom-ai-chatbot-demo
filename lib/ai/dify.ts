import { getCustomer } from "@/data/customers";
import { getProduct, PRODUCTS } from "@/data/products/catalog";
import { getUsage } from "@/data/usage";
import type { BehaviorAggregate, ProactiveRecommendation } from "@/types";

/**
 * AI orchestration facade — swap stub for Dify / Qwen later without changing UI.
 */
export async function getProactiveRecommendation(input: {
  customerId: string;
  behavior: BehaviorAggregate;
}): Promise<ProactiveRecommendation> {
  const customer = getCustomer(input.customerId);
  if (!customer) {
    return {
      shouldProactive: false,
      intent: "UNKNOWN",
      confidence: 0,
      recommendedProduct: null,
      reasons: [],
      estimatedMonthlyBenefit: null,
      message: "",
    };
  }

  const recommended = getProduct("DATA-50GB") ?? PRODUCTS[1];
  const usage = getUsage(input.customerId);
  const avg =
    usage.length > 0
      ? usage.reduce((s, u) => s + u.dataGb, 0) / usage.length
      : customer.averageDataUsageGb;

  const reasons = [
    `Average usage (${avg.toFixed(1)}GB) exceeds current allowance (${customer.currentPlanName})`,
    `Recurring out-of-bundle charges (~R${customer.outOfBundleSpend}/month)`,
  ];

  const firstName = customer.name.split(" ")[0];

  return {
    shouldProactive: true,
    intent: "PACKAGE_COMPARISON",
    confidence: 0.94,
    recommendedProduct: recommended?.id ?? "DATA-50GB",
    reasons,
    estimatedMonthlyBenefit: `R${customer.outOfBundleSpend}`,
    message: `Hi ${firstName} 👋\n\nI noticed you're comparing data bundles.\n\nBased on your recent usage, I may have a better option for you.`,
  };
}

export async function answerFAQ(query: string): Promise<string> {
  const { answerFromFaq } = await import("@/lib/chat/faq");
  return (
    answerFromFaq(query) ??
    "I couldn't find an exact FAQ match. Try asking about balances, billing, SIM self-care, or buying a data bundle."
  );
}

export async function analyzeBill(
  imageDataUrl: string,
): Promise<{ summary: string; raw: string }> {
  const { analyzeBillImage } = await import("@/lib/ai/dashscope");
  return analyzeBillImage(imageDataUrl);
}

export async function transcribeVoice(
  audioDataUrl: string,
  language?: string,
): Promise<{ text: string }> {
  const { transcribeAudio } = await import("@/lib/ai/dashscope");
  return transcribeAudio(audioDataUrl, language);
}

export async function generateHandoverSummary(): Promise<{ ticketHint: string }> {
  return { ticketHint: "Handover summary stub — full ticket flow comes in a later phase." };
}
