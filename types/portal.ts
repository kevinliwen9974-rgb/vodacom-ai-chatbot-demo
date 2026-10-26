import type { TopUpBundle } from "@/components/sites/qr-vodacom-co-za-50a80143/shared/catalog";

export type PortalCandidate = {
  id: string;
  volume: string;
  volumeMb: number;
  price: number;
  label: string;
  unlimited?: boolean;
};

export type PortalEvent =
  | {
      kind: "topup_product";
      product: string;
      viewedBundleIds: string[];
      force?: boolean;
    }
  | {
      kind: "bundle_selected";
      product: string;
      bundleType: string;
      selectedId: string;
      viewedBundleIds: string[];
      candidates: PortalCandidate[];
      dwellTimeSec: number;
      comparisonCount: number;
      purchaseIntent: "HIGH";
      force?: boolean;
    }
  | {
      kind: "summer_deals_browse";
      category: string;
      selectedId: string;
      viewedOfferIds: string[];
      candidates: Array<{
        id: string;
        title: string;
        volumeMb: number;
        price: number;
        validityDays: number;
      }>;
    }
  | {
      kind: "summer_deals_compare";
      category: string;
      selectedId: string;
      viewedOfferIds: string[];
      candidates: Array<{
        id: string;
        title: string;
        volumeMb: number;
        price: number;
        validityDays: number;
      }>;
    }
  | {
      kind: "summer_deals_checkout_intent";
      category: string;
      selectedId: string;
      viewedOfferIds: string[];
      candidates: Array<{
        id: string;
        title: string;
        volumeMb: number;
        price: number;
        validityDays: number;
      }>;
    };

export function toTopUpBundle(c: PortalCandidate, product: string, bundleType: string): TopUpBundle {
  return {
    id: c.id,
    product: product as TopUpBundle["product"],
    type: bundleType as TopUpBundle["type"],
    label: c.label,
    volume: c.volume,
    volumeMb: c.volumeMb,
    price: c.price,
    unlimited: c.unlimited ?? c.volumeMb < 0,
  };
}
