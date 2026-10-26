import type { Customer } from "@/types";

/** Mutable runtime copy — purchases update balances/plans in-memory for the demo session. */
export const CUSTOMERS: Record<string, Customer> = {
  sipho: {
    id: "sipho",
    name: "Sipho Mokoena",
    title: "Mr",
    accountNumber: "772100331",
    msisdnDisplay: "082 555 0101",
    currentPlanId: "DATA-20GB",
    currentPlanName: "20GB Data",
    airtimeBalance: 48.5,
    dataBalanceGb: 4.2,
    voiceBalanceMinutes: 35,
    smsBalance: 120,
    monthlySpend: 284,
    averageDataUsageGb: 31.8,
    averageVoiceUsageMinutes: 110,
    outOfBundleSpend: 85,
    personaFocus: "package",
    marketingEligible: true,
    appMix: {
      tiktokPct: 81,
      youtubePct: 10,
      instagramPct: 5,
      whatsappPct: 2,
      otherPct: 2,
      totalGb: 38.4,
    },
    idNumber: "9001015800085",
    residentialAddress: "12 Long Street, Cape Town, 8001",
    kycMode: "reject",
    securityAnswers: {
      lastRechargeDate: "2026-08-18",
      lastRechargeAmount: 50,
      lastCalledNumber: "0825550199",
    },
    sim: {
      msisdn: "0825550101",
      status: "active",
      network: "Vodacom Mobile",
      radio: "5G",
      puk: "12345678",
      last4Id: "0085",
    },
    serviceLines: [
      { msisdn: "0825550101", label: "20GB Data (primary)" },
    ],
  },
  /** Device-contract persona — Buy data → Huawei NBO only (no TikTok / SKU upsell). */
  thabo: {
    id: "thabo",
    name: "Thabo Dlamini",
    title: "Mr",
    accountNumber: "664188220",
    msisdnDisplay: "082 555 0202",
    currentPlanId: "DATA-20GB",
    currentPlanName: "20GB Data",
    airtimeBalance: 62,
    dataBalanceGb: 3.1,
    voiceBalanceMinutes: 20,
    smsBalance: 80,
    monthlySpend: 310,
    averageDataUsageGb: 34.6,
    averageVoiceUsageMinutes: 95,
    outOfBundleSpend: 72,
    personaFocus: "package",
    marketingEligible: false,
    appMix: {
      tiktokPct: 18,
      youtubePct: 22,
      instagramPct: 20,
      whatsappPct: 28,
      otherPct: 12,
      totalGb: 34.6,
    },
    idNumber: "8504125800088",
    residentialAddress: "44 Commissioner Street, Johannesburg, 2001",
    kycMode: "reject",
    securityAnswers: {
      lastRechargeDate: "2026-08-12",
      lastRechargeAmount: 80,
      lastCalledNumber: "0825550188",
    },
    sim: {
      msisdn: "0825550202",
      status: "active",
      network: "Vodacom Mobile",
      radio: "LTE",
      puk: "55667788",
      last4Id: "0088",
    },
    serviceLines: [
      { msisdn: "0825550202", label: "20GB Data (primary)" },
    ],
    deviceProfile: {
      tenureMonths: 28,
      currentDevice: "Huawei Nova 9i",
      deviceAgeMonths: 28,
      dataUsageBand: "high",
      brandAffinity: "Huawei",
      upgradePropensity: 86,
    },
  },
  /** SIM + Billing persona — CRM KYC PDFs under data/kyc/shen/ */
  shen: {
    id: "shen",
    name: "Li Wen",
    title: "Mr",
    accountNumber: "908214455",
    msisdnDisplay: "079 573 1369",
    currentPlanId: "DATA-20GB",
    currentPlanName: "20GB Data Bundle",
    airtimeBalance: 120,
    dataBalanceGb: 18.6,
    voiceBalanceMinutes: 80,
    smsBalance: 200,
    monthlySpend: 549,
    averageDataUsageGb: 35,
    averageVoiceUsageMinutes: 95,
    outOfBundleSpend: 320,
    personaFocus: "package",
    marketingEligible: true,
    appMix: {
      tiktokPct: 12,
      youtubePct: 28,
      instagramPct: 18,
      whatsappPct: 32,
      otherPct: 10,
      totalGb: 38,
    },
    idNumber: "EN3455201",
    residentialAddress: "18 The Bernardino, Khyber Rock",
    kycMode: "compare",
    securityAnswers: {
      lastRechargeDate: "2026-10-20",
      lastRechargeAmount: 100,
      lastCalledNumber: "0115550100",
    },
    sim: {
      /** Primary = LTE deal line on statements (must match billing) */
      msisdn: "0795731369",
      status: "active",
      network: "Vodacom Mobile",
      radio: "LTE",
      puk: "87654321",
      last4Id: "5201",
    },
    serviceLines: [
      { msisdn: "0795731369", label: "20GB Data Bundle" },
      { msisdn: "0671399999", label: "Vodacom Infinite Max TopUp Deal" },
      { msisdn: "0682155585", label: "Data MultiSIM" },
      { msisdn: "0754190038", label: "Data MultiSIM" },
    ],
  },
};

export const DEFAULT_CUSTOMER_ID = "sipho";

export function getCustomer(id: string): Customer | undefined {
  // Legacy alias from earlier demos
  if (id === "thandi") return CUSTOMERS.shen;
  return CUSTOMERS[id];
}

export function listCustomers(): Customer[] {
  return Object.values(CUSTOMERS);
}

/** First-name greeting for chat / UI (Shen, Sipho). Honorific stays on the bill mailer only. */
export function customerGreetingName(c: Customer | null | undefined): string {
  if (!c) return "there";
  return c.name.trim().split(/\s+/)[0] || "there";
}

export function lineLabel(customerId: string, msisdn: string): string {
  const c = getCustomer(customerId);
  const line = c?.serviceLines.find((l) => l.msisdn === msisdn);
  return line ? `${line.label} (${msisdn})` : msisdn;
}
