export type Currency = "ZAR";

export type ProductCategory = "data" | "voice" | "combo" | "lte";

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  price: number;
  currency: Currency;
  validityDays: number;
  dataAllowanceGb: number;
  voiceMinutes: number;
  smsAllowance: number;
  eligibility: string[];
  promotionalStatus: "standard" | "demo_offer";
  tagline: string;
  effectiveFrom: string;
  effectiveTo: string | null;
}

export interface MonthlyUsage {
  month: string;
  dataGb: number;
  voiceMinutes: number;
  outOfBundleRand: number;
}

export interface SimInfo {
  msisdn: string;
  status: "active" | "blocked" | "suspended";
  network: string;
  radio: "5G" | "LTE" | "3G";
  puk: string;
  last4Id: string;
}

export interface ServiceLine {
  msisdn: string;
  label: string;
}

export interface Customer {
  id: string;
  name: string;
  /** Honorific for greetings, e.g. Miss / Mr */
  title?: string;
  /** Vodacom account number shown on statements / email */
  accountNumber?: string;
  msisdnDisplay: string;
  currentPlanId: string;
  currentPlanName: string;
  airtimeBalance: number;
  dataBalanceGb: number;
  voiceBalanceMinutes: number;
  smsBalance: number;
  monthlySpend: number;
  averageDataUsageGb: number;
  averageVoiceUsageMinutes: number;
  outOfBundleSpend: number;
  personaFocus: "package" | "selfcare";
  /**
   * When true, user gets personalized marketing (TikTok pie, etc.).
   * Base adjacent upsell on Next still applies to all users.
   */
  marketingEligible: boolean;
  appMix: {
    tiktokPct: number;
    youtubePct: number;
    instagramPct: number;
    whatsappPct: number;
    otherPct: number;
    totalGb: number;
  };
  idNumber: string;
  /** Accepted alternate ID/passport numbers (e.g. renewed passport). */
  idNumberAliases?: string[];
  residentialAddress: string;
  /** SIM KYC: compare uploads to CRM PDFs, or always reject (Sipho demo). */
  kycMode: "compare" | "reject";
  securityAnswers: {
    lastRechargeDate: string;
    lastRechargeAmount: number;
    lastCalledNumber: string;
  };
  sim: SimInfo;
  /** All MSISDNs on the account — bills/SIM must use these only */
  serviceLines: ServiceLine[];
  /** Handset / tenure CRM — drives DEVICE_UPGRADE NBO when buying data */
  deviceProfile?: DeviceProfile;
}

export type DataUsageBand = "low" | "medium" | "high";

export interface DeviceProfile {
  tenureMonths: number;
  currentDevice: string;
  deviceAgeMonths: number;
  dataUsageBand: DataUsageBand;
  brandAffinity: string;
  upgradePropensity: number;
}

export interface DeviceDeal {
  id: string;
  brand: string;
  name: string;
  monthlyRand: number;
  termMonths: number;
  shopUrl: string;
  action: "DEVICE_UPGRADE";
  specs: string;
}

export interface BillLineItem {
  label: string;
  amount: number;
}

export interface Invoice {
  id: string;
  customerId: string;
  month: string;
  invoiceDate: string;
  dueDate: string;
  previousBalance: number;
  paymentsReceived: number;
  lineItems: BillLineItem[];
  vat: number;
  totalDue: number;
}

export type BehaviorEventType =
  | "page_view"
  | "product_view"
  | "product_compare"
  | "product_detail"
  | "scroll"
  | "click_buy"
  | "chat_open"
  | "chat_close"
  | "portal_login"
  | "checkout_start"
  | "purchase_complete"
  | "fast_forward";

export interface BehaviorEvent {
  sessionId: string;
  customerId: string;
  eventType: BehaviorEventType;
  page: string;
  productId?: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface BehaviorAggregate {
  dwellTimeSec: number;
  productsViewed: string[];
  productsCompared: string[];
  recentActions: BehaviorEventType[];
  currentPage: string;
  chatOpened: boolean;
  portalLoggedIn: boolean;
  checkoutStarted: boolean;
  purchaseComplete: boolean;
  fastForwarded: boolean;
}

export interface ProactiveRecommendation {
  shouldProactive: boolean;
  intent: string;
  confidence: number;
  recommendedProduct: string | null;
  reasons: string[];
  estimatedMonthlyBenefit: string | null;
  message: string;
}

export type OrderStatus = "pending" | "awaiting_payment" | "paid" | "failed" | "cancelled";

export interface Order {
  id: string;
  customerId: string;
  productId: string;
  amount: number;
  currency: Currency;
  status: OrderStatus;
  createdAt: string;
  paymentId?: string;
}

export type PaymentStatus = "created" | "processing" | "succeeded" | "failed";

export interface Payment {
  id: string;
  orderId: string;
  provider: "mock" | "payfast" | "ozow";
  amount: number;
  currency: Currency;
  status: PaymentStatus;
  checkoutUrl: string;
  createdAt: string;
}

export type JourneyStepId =
  | "browsing"
  | "profile_loaded"
  | "plan_retrieved"
  | "usage_retrieved"
  | "intent_detected"
  | "ai_recommendation"
  | "product_catalogue"
  | "purchase";

export type JourneyStepState = "pending" | "active" | "done";

export interface JourneyStep {
  id: JourneyStepId;
  label: string;
  state: JourneyStepState;
}
