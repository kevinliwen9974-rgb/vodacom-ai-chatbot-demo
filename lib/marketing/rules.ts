import type { TopUpBundle } from "@/components/sites/qr-vodacom-co-za-50a80143/shared/catalog";

export type PurchaseIntent = "LOW" | "MEDIUM" | "HIGH";

export interface BundleSelectedContext {
  selected: TopUpBundle;
  previouslyViewed: TopUpBundle[];
  candidates: TopUpBundle[];
  dwellTimeSec: number;
  comparisonCount: number;
  purchaseIntent: PurchaseIntent;
  force?: boolean;
}

export interface IncrementalUpsellAction {
  type: "incremental_upsell";
  selected: TopUpBundle;
  upgrade: TopUpBundle;
  deltaPrice: number;
}

export interface AppUsageInsightAction {
  type: "app_usage_insight";
  product: string;
  recommendPlanId: "DATA-50GB";
}

export type MarketingAction = IncrementalUpsellAction | AppUsageInsightAction;

/** Nearest higher-priced SKU on the same shelf (catalogue discovery — no invented offers). */
export function findAdjacentUpgrade(
  selected: TopUpBundle,
  candidates: TopUpBundle[],
): TopUpBundle | null {
  const higher = candidates
    .filter((c) => c.id !== selected.id && c.price > selected.price)
    .sort((a, b) => a.price - b.price);
  return higher[0] ?? null;
}

/**
 * Scene ① — checkout-gate upsell on Next when a cheaper SKU was selected
 * and a higher adjacent catalogue price exists. Applies to all demo users.
 */
export function evaluateCheckoutGate(
  ctx: BundleSelectedContext,
): IncrementalUpsellAction | null {
  const upgrade = findAdjacentUpgrade(ctx.selected, ctx.candidates);
  if (!upgrade) return null;

  return {
    type: "incremental_upsell",
    selected: ctx.selected,
    upgrade,
    deltaPrice: Math.round((upgrade.price - ctx.selected.price) * 100) / 100,
  };
}

/** Scene ② — TikTok heavy-user insight when entering TikTok category. */
export function evaluateTikTokInsight(
  product: string,
  force = false,
): AppUsageInsightAction | null {
  if (!force && product !== "TikTok Bundles - Once Off") return null;
  return {
    type: "app_usage_insight",
    product: "TikTok Bundles - Once Off",
    recommendPlanId: "DATA-50GB",
  };
}
