export interface AppUsageSlice {
  app: string;
  gb: number;
  percent: number;
  color: string;
}

const SIPHO_APP_USAGE: AppUsageSlice[] = [
  { app: "TikTok", gb: 31.2, percent: 81, color: "#010101" },
  { app: "YouTube", gb: 3.8, percent: 10, color: "#FF0000" },
  { app: "Instagram", gb: 1.9, percent: 5, color: "#E1306C" },
  { app: "WhatsApp", gb: 0.9, percent: 2, color: "#25D366" },
  { app: "Other", gb: 0.6, percent: 2, color: "#8892A4" },
];

const SHEN_APP_USAGE: AppUsageSlice[] = [
  { app: "YouTube", gb: 11.4, percent: 30, color: "#FF0000" },
  { app: "WhatsApp", gb: 9.5, percent: 25, color: "#25D366" },
  { app: "TikTok", gb: 7.6, percent: 20, color: "#010101" },
  { app: "Instagram", gb: 5.7, percent: 15, color: "#E1306C" },
  { app: "Other", gb: 3.8, percent: 10, color: "#8892A4" },
];

/** Demo-only Sipho-style breakdown — not real Vodacom telemetry. */
export const APP_USAGE_30D: AppUsageSlice[] = SIPHO_APP_USAGE;

export const APP_USAGE_TOTAL_GB = 38.4;

export function getAppUsage(customerId?: string | null): {
  slices: AppUsageSlice[];
  totalGb: number;
} {
  if (customerId === "shen" || customerId === "thandi") {
    return { slices: SHEN_APP_USAGE, totalGb: 38 };
  }
  return { slices: SIPHO_APP_USAGE, totalGb: APP_USAGE_TOTAL_GB };
}
