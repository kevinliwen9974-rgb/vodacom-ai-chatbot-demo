import type { Customer, DeviceDeal, DeviceProfile } from "@/types";

/** Demo NBO — Huawei stay-in-family contract using the official Vodacom SKU. */
export const HUAWEI_NOVA_Y74: DeviceDeal = {
  id: "huawei-nova-15-max-36",
  brand: "Huawei",
  name: "HUAWEI nova 15 Max 8/256GB",
  monthlyRand: 369,
  termMonths: 36,
  shopUrl:
    "https://www.vodacom.co.za/shop/dv6jd06131?price_type=monthly",
  action: "DEVICE_UPGRADE",
  specs: '6.84" OLED · 256GB · 4G/LTE',
};

export type DeviceNbo = {
  profile: DeviceProfile;
  deal: DeviceDeal;
  event: "Buy data";
};

/** Tenure + device age + high usage + Huawei affinity → nova 15 Max contract. */
export function evaluateDeviceUpgrade(
  customer: Customer | null | undefined,
): DeviceNbo | null {
  const profile = customer?.deviceProfile;
  if (!profile) return null;
  if (profile.tenureMonths < 24) return null;
  if (profile.deviceAgeMonths < 24) return null;
  if (profile.dataUsageBand !== "high") return null;
  if (profile.upgradePropensity < 70) return null;
  if (profile.brandAffinity.toLowerCase() !== "huawei") return null;
  return { profile, deal: HUAWEI_NOVA_Y74, event: "Buy data" };
}
