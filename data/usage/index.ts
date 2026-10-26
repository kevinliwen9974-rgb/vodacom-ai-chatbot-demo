import type { MonthlyUsage } from "@/types";

export const USAGE_BY_CUSTOMER: Record<string, MonthlyUsage[]> = {
  sipho: [
    { month: "July", dataGb: 29.4, voiceMinutes: 98, outOfBundleRand: 72 },
    { month: "August", dataGb: 34.1, voiceMinutes: 120, outOfBundleRand: 95 },
    { month: "September", dataGb: 31.8, voiceMinutes: 112, outOfBundleRand: 88 },
  ],
  shen: [
    { month: "July", dataGb: 20.2, voiceMinutes: 90, outOfBundleRand: 8 },
    { month: "August", dataGb: 23.5, voiceMinutes: 100, outOfBundleRand: 14 },
    { month: "September", dataGb: 22.0, voiceMinutes: 95, outOfBundleRand: 12 },
  ],
};

export function getUsage(customerId: string): MonthlyUsage[] {
  if (customerId === "thandi") return USAGE_BY_CUSTOMER.shen ?? [];
  return USAGE_BY_CUSTOMER[customerId] ?? [];
}
