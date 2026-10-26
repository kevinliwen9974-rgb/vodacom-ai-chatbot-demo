import type { Product } from "@/types";
import {
  MONICE_OFFERS,
  TOPUP_BUNDLES,
} from "@/components/sites/qr-telkom-co-za-50a80143/shared/catalog";

export const PRODUCTS: Product[] = [
  {
    id: "DATA-20GB",
    name: "20GB Data Bundle",
    category: "data",
    price: 229,
    currency: "ZAR",
    validityDays: 30,
    dataAllowanceGb: 20,
    voiceMinutes: 0,
    smsAllowance: 0,
    eligibility: ["prepaid", "postpaid"],
    promotionalStatus: "standard",
    tagline: "Everyday browsing and social",
    effectiveFrom: "2026-01-01",
    effectiveTo: null,
  },
  {
    id: "DATA-50GB",
    name: "50GB + 50GB Night Owl",
    category: "data",
    price: 349,
    currency: "ZAR",
    validityDays: 30,
    dataAllowanceGb: 50,
    voiceMinutes: 0,
    smsAllowance: 0,
    eligibility: ["prepaid", "postpaid"],
    promotionalStatus: "demo_offer",
    tagline: "Monthly recurring · 30 days",
    effectiveFrom: "2026-01-01",
    effectiveTo: null,
  },
  {
    id: "DATA-80GB",
    name: "80GB Data Bundle",
    category: "data",
    price: 399,
    currency: "ZAR",
    validityDays: 30,
    dataAllowanceGb: 80,
    voiceMinutes: 0,
    smsAllowance: 0,
    eligibility: ["prepaid", "postpaid"],
    promotionalStatus: "demo_offer",
    tagline: "Heavy streaming and hotspot use",
    effectiveFrom: "2026-01-01",
    effectiveTo: null,
  },
  {
    id: "LTE-80GB",
    name: "80GB LTE Wireless",
    category: "data",
    price: 229,
    currency: "ZAR",
    validityDays: 30,
    dataAllowanceGb: 80,
    voiceMinutes: 0,
    smsAllowance: 0,
    eligibility: ["postpaid"],
    promotionalStatus: "standard",
    tagline: "Official LTE Wireless — 80GB",
    effectiveFrom: "2026-04-01",
    effectiveTo: null,
  },
  {
    id: "LTE-120GB",
    name: "120GB LTE Wireless",
    category: "data",
    price: 299,
    currency: "ZAR",
    validityDays: 30,
    dataAllowanceGb: 120,
    voiceMinutes: 0,
    smsAllowance: 0,
    eligibility: ["postpaid"],
    promotionalStatus: "demo_offer",
    tagline: "Official LTE Wireless — 120GB (+R70 vs 80GB)",
    effectiveFrom: "2026-04-01",
    effectiveTo: null,
  },
];

function portalAsProduct(): Product[] {
  const topup = TOPUP_BUNDLES.map((b): Product => {
    const days =
      b.type === "Hourly" || b.type === "Daily"
        ? 1
        : b.type === "3 Day"
          ? 3
          : b.type === "Weekend"
            ? 2
            : b.type === "Weekly"
              ? 7
              : 30;
    const gb =
      b.unlimited || b.volumeMb < 0
        ? 99
        : Math.round((b.volumeMb / 1024) * 100) / 100;
    return {
      id: b.id,
      name: `${b.volume} ${b.product} (${b.type})`,
      category: "data",
      price: b.price,
      currency: "ZAR",
      validityDays: days,
      dataAllowanceGb: gb,
      voiceMinutes: 0,
      smsAllowance: 0,
      eligibility: ["prepaid"],
      promotionalStatus: "standard",
      tagline: `${b.volume} · R${b.price.toFixed(2)}`,
      effectiveFrom: "2026-01-01",
      effectiveTo: null,
    };
  });
  const monice = MONICE_OFFERS.map(
    (o): Product => ({
      id: o.id,
      name: o.title,
      category: o.category.startsWith("Voice")
        ? "voice"
        : o.category.startsWith("Combo")
          ? "combo"
          : "data",
      price: o.price,
      currency: "ZAR",
      validityDays: o.validityDays,
      dataAllowanceGb: Math.round((o.volumeMb / 1024) * 100) / 100,
      voiceMinutes: 0,
      smsAllowance: 0,
      eligibility: ["prepaid"],
      promotionalStatus: "standard",
      tagline: `Mo'Nice · ${o.validityDays} days`,
      effectiveFrom: "2026-01-01",
      effectiveTo: null,
    }),
  );
  return [...topup, ...monice];
}

const PORTAL_PRODUCTS = portalAsProduct();

export function getProduct(id: string): Product | undefined {
  return (
    PRODUCTS.find((p) => p.id === id) ??
    PORTAL_PRODUCTS.find((p) => p.id === id)
  );
}

export function listSellableProducts(): Product[] {
  return [...PRODUCTS, ...PORTAL_PRODUCTS];
}
