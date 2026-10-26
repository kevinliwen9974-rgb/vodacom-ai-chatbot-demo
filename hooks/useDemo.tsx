"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { apiFetch, getClientSessionId } from "@/lib/api/client";
import type {
  BehaviorAggregate,
  Customer,
  JourneyStep,
  Product,
  ProactiveRecommendation,
} from "@/types";
import type { PortalEvent } from "@/types/portal";
import { toTopUpBundle } from "@/types/portal";
import {
  getTopUpBundle,
  SUMMER_DEALS_OFFERS,
  randPerGb,
  type TopUpBundle,
} from "@/components/sites/qr-vodacom-co-za-50a80143/shared/catalog";
import {
  evaluateCheckoutGate,
  findAdjacentUpgrade,
} from "@/lib/marketing/rules";
import { getAppUsage } from "@/data/usage/app-breakdown";
import {
  SIM_STORES,
  createSimState,
  securityMatches,
  type SimState,
} from "@/lib/sim/flow";
import { buildAgentBriefing } from "@/lib/care/handoff-brief";
import {
  VODACOM_5G_EXPLORE_URL,
  VODACOM_COVERAGE_MAP_URL,
  VODACOM_FIBRE_EXPLORE_URL,
  type CoverageCheckResponse,
  type CoverageFocus,
  type CoverageLocation,
  type CoverageState,
} from "@/lib/coverage/types";
import { resolveCoverageLocation, resolveCoverageByCoords } from "@/lib/coverage/resolve";
import { coverageSuggestions } from "@/mock/coverage";
import {
  coverageNextStepCopy,
  coverageResultCopy,
} from "@/lib/coverage/copy";
import { rankStoresByLocation } from "@/lib/sim/stores";
import {
  parseAmount,
  parseDateYmd,
  parseMsisdn,
  parsePhone,
} from "@/lib/sim/parse-input";
import {
  getLatestInvoice,
  SHEN_DATA_USAGE,
  SHEN_LTE_AVG,
} from "@/data/billing";
import { customerGreetingName, getCustomer } from "@/data/customers";
import {
  evaluateDeviceUpgrade,
  type DeviceNbo,
} from "@/data/devices/nbo";
import {
  clockForPreset,
  isAgentDeskOpen,
  type ClockPreset,
} from "@/lib/care/hours";

const VODACOM_CARE_PHONE = "081 180";
/** Vodacom online help / live chat. */
export const VODACOM_ONLINE_CHAT_URL =
  "https://help.vodacom.co.za/tobi/home/web/";
/** Official Vodacom store finder — optional extra; collection still requires a named store. */
export const VODACOM_STORE_LOCATOR_URL =
  "https://www.vodacom.co.za/cloud/contact-us/find-a-store/";
/** Shen / Sunninghill — rank nearby JHB stores for SIM collection. */
const SHEN_HOME = { lat: -26.041, lng: 28.072 };

function nearbyCollectionStores() {
  return rankStoresByLocation(SHEN_HOME.lat, SHEN_HOME.lng, 4);
}

type SimManualCard = {
  title: string;
  body: string[];
  checks: Array<{ label: string; status: "ok" | "warn" }>;
  recommended: string;
};

function buildSimManualCard(
  state: SimState,
  kind: "docs" | "security",
): SimManualCard {
  const msisdnOk = Boolean(state.msisdn);
  const idOk = Boolean(state.idDocDataUrl);
  const porOk = Boolean(state.porDocDataUrl);

  const checks: Array<{ label: string; status: "ok" | "warn" }> = [
    {
      label: "Mobile number verified",
      status: msisdnOk ? "ok" : "warn",
    },
    {
      label: "ID document uploaded",
      status: idOk ? "ok" : "warn",
    },
    {
      label: "Proof of residence uploaded",
      status: porOk ? "ok" : "warn",
    },
    {
      label: "Security questions completed",
      status: kind === "security" ? "ok" : "warn",
    },
    {
      label: kind === "docs" ? "Identity mismatch" : "Security answers mismatch",
      status: "warn",
    },
    { label: "3 attempts reached", status: "warn" },
  ];

  return {
    title: "SIM SWAP – MANUAL VERIFICATION",
    body: [
      "Your online verification has been locked for security.",
      "I've prepared your request so you don't need to start again.",
    ],
    checks,
    recommended: "Visit a Vodacom Store",
  };
}

type CompareRow = {
  id: string;
  title: string;
  price: number;
  meta: string;
  recommended?: boolean;
};

type UpsellCard = {
  selectedId: string;
  upgradeId: string;
  selectedLabel: string;
  upgradeLabel: string;
  selectedPrice: number;
  upgradePrice: number;
  deltaPrice: number;
  product: string;
};

/** Apply a shelf selection on the Top Up page (chat guides only — no payment). */
export type PortalShelfHint = {
  product: string;
  bundleType: string;
  bundleId: string;
  nonce: number;
};

export type ChatChoice = {
  id: string;
  label: string;
  meta?: string;
  /** topup bundle id or sim action */
  action: string;
  payload?: string;
  disabled?: boolean;
  /** Visual weight — primary = lime CTA like proactive toast */
  variant?: "primary" | "secondary" | "ghost";
};

export type VerifyProgressStep = {
  id: string;
  label: string;
  state: "done" | "active" | "pending" | "failed";
};

export type ChatMessage = {
  id: string;
  role: "bot" | "user" | "system";
  text: string;
  recommendation?: Product | null;
  reasons?: string[];
  benefit?: string | null;
  compareRows?: CompareRow[];
  /** @deprecated prefer guideBundleId — chat no longer purchases */
  buyProductId?: string;
  guideBundleId?: string;
  upsell?: UpsellCard;
  showUsagePie?: boolean;
  /** Three-month data usage vs current plan (billing upsell) */
  showDataUsageChart?: boolean;
  choices?: ChatChoice[];
  handoff?: { reason: string; context: string[] };
  /** SIM lockout — visit store (Vodacom-style manual verification) */
  simManual?: {
    title: string;
    body: string[];
    checks: Array<{ label: string; status: "ok" | "warn" }>;
    recommended: string;
  };
  nearbyStores?: Array<{
    id: string;
    name: string;
    address: string;
    distanceKm?: number;
    lat: number;
    lng: number;
  }>;
  /** Non-SIM specialist handoff */
  careOffer?: {
    phone: string;
    issue: string;
  };
  callbackForm?: {
    reason: string;
    defaultNumber?: string;
  };
  /** @deprecated prefer uploadCard */
  uploadSlots?: Array<"id" | "por">;
  uploadCard?: {
    step: 1 | 2;
    kind: "id" | "por";
    title: string;
    body: string;
  };
  uploadedFile?: {
    name: string;
    sizeLabel: string;
    kind: "id" | "por";
  };
  verifyProgress?: {
    title: string;
    steps: VerifyProgressStep[];
  };
  /** Document verify attempt badge (state-backed, not chat memory) */
  attemptBadge?: { current: number; max: number };
  verifyResult?: {
    title: string;
    fields: Array<{ label: string; value: string; ok: boolean }>;
  };
  paySim?: boolean;
  storePick?: boolean;
  /** After store pick — brief for that branch's staff */
  storeHandoff?: {
    storeName: string;
    address: string;
    reference: string;
  };
  /** Online-agent briefing shown in chat (no CRM tags) */
  agentBrief?: {
    reference: string;
    summary: string;
    requestedAction: string;
    lastTurns: string[];
  };
  locationInput?: {
    placeholder?: string;
    suggestions: Array<{ id: string; label: string }>;
  };
  locationCard?: CoverageLocation;
  coverageChecking?: { address: string };
  coverageResult?: {
    address: string;
    line1?: string;
    suburb?: string;
    city?: string;
    result: CoverageCheckResponse;
  };
  coverageFallback?: { kind: "complex" | "error" };
  /** Green check celebration after all KYC + security pass */
  verifiedOk?: boolean;
  /** Override default "Verification complete" badge copy */
  okBadge?: string;
  /** Structured confirm widget for MSISDN / date / amount / phone */
  inputWidget?: {
    kind: "msisdn" | "date" | "amount" | "phone";
    prefill?: string;
    label?: string;
  };
  /** Next-best device contract when the customer asked for data */
  deviceDeal?: {
    currentDevice: string;
    deviceAgeMonths: number;
    offerName: string;
    brand: string;
    monthlyRand: number;
    termMonths: number;
    shopUrl: string;
    specs: string;
  };
};

export type DeviceNboView = DeviceNbo & {
  status: "offered" | "accepted" | "data_only" | "declined";
};

export type AgentHandoffPacket = {
  channel: "online_chat";
  reference: string;
  customerName: string;
  msisdn: string;
  accountNumber: string;
  plan: string;
  page: string;
  issue: string;
  lastMessages: string[];
  crmNotes: string[];
  summary: string;
  requestedAction: string;
};

type DemoContextValue = {
  customer: Customer | null;
  products: Product[];
  usage: { month: string; dataGb: number; outOfBundleRand: number }[];
  aggregate: BehaviorAggregate | null;
  journey: JourneyStep[];
  chatOpen: boolean;
  proactiveOpen: boolean;
  proactiveMessage: string;
  recommendation: ProactiveRecommendation | null;
  recommendedProduct: Product | null;
  messages: ChatMessage[];
  setMessages: Dispatch<SetStateAction<ChatMessage[]>>;
  showTechnical: boolean;
  checkoutBusy: boolean;
  lastReceipt: Record<string, unknown> | null;
  refresh: () => Promise<void>;
  selectCustomer: (id: string) => Promise<void>;
  resetJourney: () => Promise<void>;
  fastForward: () => Promise<void>;
  track: (
    eventType: string,
    page: string,
    productId?: string,
    metadata?: Record<string, unknown>,
  ) => Promise<{ shouldProactive?: boolean }>;
  acceptProactive: () => Promise<void>;
  dismissProactive: () => void;
  openChat: () => void;
  closeChat: () => void;
  setShowTechnical: (v: boolean) => void;
  startCheckout: (productId: string) => Promise<string | null>;
  purchaseInChat: (productId: string) => Promise<void>;
  completePayment: (paymentId: string) => Promise<void>;
  /** Returns true if an interrupt UI was opened (caller should stay put). */
  notifyPortalEvent: (event: PortalEvent) => boolean;
  fastForwardWhatsApp: () => Promise<void>;
  fastForwardTikTok: () => Promise<void>;
  /** Chat guides only: apply SKU on host page and end assistant mission */
  applyBundleGuide: (bundleId: string) => void;
  portalShelfHint: PortalShelfHint | null;
  clearPortalShelfHint: () => void;
  /** Live mirror of the bundle currently selected on the top-up page. */
  portalSelection: TopUpBundle | null;
  setPortalSelection: (b: TopUpBundle | null) => void;
  /** Last bundle the chat guided onto the page — survives message clears. */
  guidedBundleId: string | null;
  summerDealsOfferHint: { offerId: string; nonce: number } | null;
  clearSummerDealsOfferHint: () => void;
  startSimSelfCare: (opts?: {
    suspendOnly?: boolean;
    replace?: boolean;
  }) => void | Promise<void>;
  /** Bill email / menu deep-link — open chat with bill explain CTA */
  startBillingAssist: (opts?: {
    fromEmail?: boolean;
    replace?: boolean;
  }) => void | Promise<void>;
  /** Empty-chat main menu (SIM / Billing / …) */
  seedChatMenu: () => void;
  startCoverageCheck: (opts?: {
    focus?: CoverageFocus;
    replace?: boolean;
    skipChooser?: boolean;
  }) => void;
  submitCoverageAddress: (query: string) => void;
  /** Coverage with a place already extracted from the user's sentence */
  proposeCoverageLocation: (query: string, focus?: CoverageFocus) => void;
  /** Coverage from browser geolocation — snaps to nearest real address */
  proposeCoverageByCoords: (lat: number, lng: number) => void;
  coverageGeoFailed: () => void;
  /** Pin dragged on the confirm map — re-resolve address live */
  adjustCoverageLocation: (lat: number, lng: number) => void;
  handleChatAction: (action: string, payload?: string) => Promise<void>;
  advanceSimChat: (
    text: string,
    opts?: { confirmed?: boolean; silent?: boolean },
  ) => Promise<boolean>;
  completeSimDocs: (kind: "id" | "por", dataUrl: string, fileMeta?: { name: string; size: number }) => Promise<void>;
  simFailCount: number;
  simActive: boolean;
  simState: import("@/lib/sim/flow").SimState | null;
  deviceNbo: DeviceNboView | null;
  agentHandoff: AgentHandoffPacket | null;
  coverageState: CoverageState;
  coverageActive: boolean;
  clockPreset: ClockPreset;
  setClockPreset: (preset: ClockPreset) => void;
  demoNow: Date;
  agentDeskOpen: boolean;
  startDeviceUpgrade: (opts?: {
    injectUser?: boolean;
    replace?: boolean;
    toast?: boolean;
    customerId?: string;
  }) => boolean;
};

const DemoContext = createContext<DemoContextValue | null>(null);

const emptyAgg: BehaviorAggregate = {
  dwellTimeSec: 0,
  productsViewed: [],
  productsCompared: [],
  recentActions: [],
  currentPage: "/customer",
  chatOpened: false,
  portalLoggedIn: false,
  checkoutStarted: false,
  purchaseComplete: false,
  fastForwarded: false,
};

const IDLE_COVERAGE: CoverageState = {
  step: "idle",
  focus: "any",
  location: null,
  result: null,
};

export function DemoProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [usage, setUsage] = useState<
    { month: string; dataGb: number; outOfBundleRand: number }[]
  >([]);
  const [aggregate, setAggregate] = useState<BehaviorAggregate | null>(null);
  const [journey, setJourney] = useState<JourneyStep[]>([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [proactiveOpen, setProactiveOpen] = useState(false);
  const [proactiveMessage, setProactiveMessage] = useState("");
  const [recommendation, setRecommendation] =
    useState<ProactiveRecommendation | null>(null);
  const [recommendedProduct, setRecommendedProduct] = useState<Product | null>(
    null,
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [showTechnical, setShowTechnical] = useState(false);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<Record<string, unknown> | null>(
    null,
  );
  const [proactiveFetched, setProactiveFetched] = useState(false);
  const [portalShelfHint, setPortalShelfHint] = useState<PortalShelfHint | null>(
    null,
  );
  const [portalSelection, setPortalSelection] = useState<TopUpBundle | null>(
    null,
  );
  const [guidedBundleId, setGuidedBundleId] = useState<string | null>(null);
  const [summerDealsOfferHint, setSummerDealsOfferHint] = useState<{
    offerId: string;
    nonce: number;
  } | null>(null);
  const [simState, setSimState] = useState<SimState | null>(null);
  const [simFailCount, setSimFailCount] = useState(0);
  const [deviceNbo, setDeviceNbo] = useState<DeviceNboView | null>(null);
  const [agentHandoff, setAgentHandoff] = useState<AgentHandoffPacket | null>(
    null,
  );
  const [coverageState, setCoverageState] =
    useState<CoverageState>(IDLE_COVERAGE);
  const [clockPreset, setClockPreset] = useState<ClockPreset>("live");
  const [liveNow, setLiveNow] = useState(() => new Date());
  const demoNow = useMemo(
    () => clockForPreset(clockPreset, liveNow),
    [clockPreset, liveNow],
  );
  const agentDeskOpen = useMemo(() => isAgentDeskOpen(demoNow), [demoNow]);

  useEffect(() => {
    if (clockPreset !== "live") return;
    setLiveNow(new Date());
    const tick = window.setInterval(() => setLiveNow(new Date()), 30_000);
    return () => window.clearInterval(tick);
  }, [clockPreset]);
  /** Product scenes already interrupted once (dismiss or upgrade) — no second Next popup */
  const marketingConsumedRef = useRef<Set<string>>(new Set());
  const notifyPortalRef = useRef<(event: PortalEvent) => boolean>(() => false);

  const refresh = useCallback(async () => {
    getClientSessionId();
    const sess = await apiFetch("/api/session").then((r) => r.json());
    setCustomer(sess.customer ?? null);
    setAggregate(sess.aggregate ?? emptyAgg);
    setJourney(sess.journey ?? []);
    if (sess.customerId) {
      const [u, p] = await Promise.all([
        apiFetch(`/api/customer/${sess.customerId}/usage`).then((r) => r.json()),
        apiFetch("/api/products").then((r) => r.json()),
      ]);
      setUsage(u.usage ?? []);
      setProducts(p.products ?? []);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const fetchProactive = useCallback(async (force = false) => {
    const res = await apiFetch("/api/ai/proactive-recommendation", {
      method: "POST",
      body: JSON.stringify({ force }),
    }).then((r) => r.json());
    if (res.shouldProactive && res.recommendation) {
      setRecommendation(res.recommendation);
      setRecommendedProduct(res.recommendedProduct ?? null);
      setProactiveMessage(res.recommendation.message);
      setProactiveOpen(true);
      setProactiveFetched(true);
    }
    return res;
  }, []);

  const track = useCallback(
    async (
      eventType: string,
      page: string,
      productId?: string,
      metadata?: Record<string, unknown>,
    ) => {
      const res = await apiFetch("/api/behavior/events", {
        method: "POST",
        body: JSON.stringify({ eventType, page, productId, metadata }),
      }).then((r) => r.json());
      setAggregate(res.aggregate ?? null);
      setJourney(res.journey ?? []);
      const topUpGate = page.includes("/qr_portal/top-up/data");
      const allowProactive = !topUpGate || metadata?.allowProactive === true;
      if (res.shouldProactive && allowProactive && !proactiveFetched && !chatOpen) {
        await fetchProactive(false);
      }
      return res;
    },
    [chatOpen, fetchProactive, proactiveFetched],
  );

  const selectCustomer = useCallback(
    async (id: string) => {
      await apiFetch("/api/session", {
        method: "POST",
        body: JSON.stringify({ action: "select", customerId: id }),
      });
      setProactiveOpen(false);
      setProactiveFetched(false);
      setChatOpen(false);
      setMessages([]);
      setLastReceipt(null);
      setDeviceNbo(null);
      setAgentHandoff(null);
      setCoverageState(IDLE_COVERAGE);
      setPortalSelection(null);
      setGuidedBundleId(null);
      marketingConsumedRef.current.clear();
      await refresh();
    },
    [refresh],
  );

  const resetJourney = useCallback(async () => {
    await apiFetch("/api/session", {
      method: "POST",
      body: JSON.stringify({ action: "reset", customerId: customer?.id }),
    });
    marketingConsumedRef.current.clear();
    setProactiveOpen(false);
    setProactiveFetched(false);
    setChatOpen(false);
    setMessages([]);
    setRecommendation(null);
    setRecommendedProduct(null);
    setLastReceipt(null);
    setDeviceNbo(null);
    setAgentHandoff(null);
    setCoverageState(IDLE_COVERAGE);
    setPortalSelection(null);
    setGuidedBundleId(null);
    await refresh();
  }, [customer?.id, refresh]);

  const fastForwardWhatsApp = useCallback(async () => {
    await track("fast_forward", "/qr_portal/top-up/data", "TU-WA-D-300");
    notifyPortalRef.current({
      kind: "bundle_selected",
      product: "WhatsApp Bundles Once-off",
      bundleType: "Daily",
      selectedId: "TU-WA-D-300",
      viewedBundleIds: ["TU-WA-D-150", "TU-WA-D-300", "TU-WA-D-UNL"],
      candidates: [
        {
          id: "TU-WA-D-150",
          volume: "150MB",
          volumeMb: 150,
          price: 6,
          label: "WhatsApp Bundles Once-off",
        },
        {
          id: "TU-WA-D-300",
          volume: "300MB",
          volumeMb: 300,
          price: 11,
          label: "WhatsApp Bundles Once-off",
        },
        {
          id: "TU-WA-D-UNL",
          volume: "Daily unlimited",
          volumeMb: -1,
          price: 15,
          label: "WhatsApp Bundles Once-off",
          unlimited: true,
        },
      ],
      dwellTimeSec: 18.6,
      comparisonCount: 3,
      purchaseIntent: "HIGH",
      force: true,
    });
  }, [track]);

  const fastForwardTikTok = useCallback(async () => {
    await track("fast_forward", "/qr_portal/top-up/data", "TU-TT-D-300");
    notifyPortalRef.current({
      kind: "bundle_selected",
      product: "TikTok Bundles - Once Off",
      bundleType: "Once Off",
      selectedId: "TU-TT-D-300",
      viewedBundleIds: ["TU-TT-D-150", "TU-TT-D-300"],
      candidates: [
        {
          id: "TU-TT-D-150",
          volume: "Daily 150MB",
          volumeMb: 150,
          price: 6,
          label: "TikTok Bundles - Once Off",
        },
        {
          id: "TU-TT-D-300",
          volume: "Daily 300MB",
          volumeMb: 300,
          price: 11,
          label: "TikTok Bundles - Once Off",
        },
      ],
      dwellTimeSec: 18,
      comparisonCount: 3,
      purchaseIntent: "HIGH",
      force: true,
    });
  }, [track]);

  const applyBundleGuide = useCallback((bundleId: string) => {
    const b = getTopUpBundle(bundleId);
    if (b) {
      setPortalShelfHint({
        product: b.product,
        bundleType: b.type,
        bundleId: b.id,
        nonce: Date.now(),
      });
      setGuidedBundleId(b.id);
    } else {
      const m = SUMMER_DEALS_OFFERS.find((x) => x.id === bundleId);
      if (!m) return;
      setGuidedBundleId(null);
      setSummerDealsOfferHint({ offerId: m.id, nonce: Date.now() });
    }
    setProactiveOpen(false);
    setChatOpen(false);
    setMessages([]);
  }, []);

  const clearPortalShelfHint = useCallback(() => {
    setPortalShelfHint(null);
  }, []);

  const clearSummerDealsOfferHint = useCallback(() => {
    setSummerDealsOfferHint(null);
  }, []);

  const fastForward = useCallback(async () => {
    if (
      typeof window !== "undefined" &&
      (window.location.pathname.includes("top-up") ||
        window.location.pathname.includes("summer-deals") ||
        window.location.pathname === "/")
    ) {
      await fastForwardWhatsApp();
      return;
    }
    await track("product_view", "/customer/data-bundles", "DATA-20GB");
    await track("product_view", "/customer/data-bundles", "DATA-50GB");
    await track("product_compare", "/customer/data-bundles", "DATA-50GB");
    await track("fast_forward", "/customer/data-bundles");
    await fetchProactive(true);
  }, [fastForwardWhatsApp, fetchProactive, track]);

  const acceptProactive = useCallback(async () => {
    setProactiveOpen(false);
    setChatOpen(true);
    await track("chat_open", window.location.pathname);
    // Checkout-gate / TikTok messages are already staged in setMessages.
    // Legacy data recommendation path still uses fetchProactive when messages empty.
    if (messages.length > 0) return;

    const res = await fetchProactive(true);
    const rec = res.recommendation as ProactiveRecommendation | undefined;
    const product = res.recommendedProduct as Product | null;
    const usageAvg =
      (res.customer as Customer | undefined)?.averageDataUsageGb ?? 31.8;
    const plan =
      (res.customer as Customer | undefined)?.currentPlanName ?? "20GB Data";
    const oob =
      (res.customer as Customer | undefined)?.outOfBundleSpend ?? 85;

    setMessages([
      {
        id: "m1",
        role: "bot",
        text: `I noticed you're comparing our data bundles. Based on your recent usage, I may have a better option for you.`,
      },
      {
        id: "m2",
        role: "user",
        text: "Yes, show me.",
      },
      {
        id: "m3",
        role: "bot",
        text: `You currently have a ${plan} plan, but you've used an average of ${usageAvg}GB per month over the last three months.\n\nYou've also had R${oob} in average out-of-bundle spending.\n\nI'd recommend the ${product?.name ?? "50GB option"}.`,
        recommendation: product,
        reasons: rec?.reasons,
        benefit: rec?.estimatedMonthlyBenefit,
      },
    ]);
  }, [fetchProactive, messages.length, track]);

  const dismissProactive = useCallback(() => {
    setProactiveOpen(false);
  }, []);

  const openChat = useCallback(() => {
    setChatOpen(true);
    setProactiveOpen(false);
    void track("chat_open", window.location.pathname);
  }, [track]);

  const closeChat = useCallback(() => {
    setChatOpen(false);
    void track("chat_close", window.location.pathname);
  }, [track]);

  const startCheckout = useCallback(
    async (productId: string) => {
      setCheckoutBusy(true);
      try {
        await track("checkout_start", "/customer/checkout", productId);
        await track("click_buy", "/customer/data-bundles", productId);
        const orderRes = await apiFetch("/api/orders", {
          method: "POST",
          body: JSON.stringify({ productId }),
        }).then((r) => r.json());
        if (!orderRes.order) return null;
        const payRes = await apiFetch("/api/payment/create", {
          method: "POST",
          body: JSON.stringify({
            orderId: orderRes.order.id,
            returnUrl: "/customer/checkout",
          }),
        }).then((r) => r.json());
        return payRes.payment?.checkoutUrl as string | null;
      } finally {
        setCheckoutBusy(false);
      }
    },
    [track],
  );

  /** Full mock purchase stays inside the chatbot (no host-page redirect). */
  const purchaseInChat = useCallback(
    async (productId: string) => {
      setCheckoutBusy(true);
      try {
        await track("checkout_start", window.location.pathname, productId);
        const orderRes = await apiFetch("/api/orders", {
          method: "POST",
          body: JSON.stringify({ productId }),
        }).then((r) => r.json());
        if (!orderRes.order) {
          setMessages((prev) => [
            ...prev,
            {
              id: `err_${Date.now()}`,
              role: "bot",
              text: "I couldn't start that order. Please try another bundle.",
            },
          ]);
          return;
        }
        const payRes = await apiFetch("/api/payment/create", {
          method: "POST",
          body: JSON.stringify({
            orderId: orderRes.order.id,
            returnUrl: window.location.pathname,
          }),
        }).then((r) => r.json());
        const paymentId = payRes.payment?.id as string | undefined;
        if (!paymentId) return;
        const status = await apiFetch("/api/payment/status", {
          method: "POST",
          body: JSON.stringify({ paymentId }),
        }).then((r) => r.json());
        setLastReceipt(status.receipt ?? null);
        if (status.customer) setCustomer(status.customer);
        setMessages((prev) => [
          ...prev,
          {
            id: `ok_${Date.now()}`,
            role: "bot",
            text: `Done — ${status.product?.name ?? "your bundle"} is loaded. Receipt ${status.receipt?.id ?? paymentId}. You can keep browsing; ask me anytime.`,
          },
        ]);
        await track("purchase_complete", window.location.pathname, productId);
        await refresh();
      } finally {
        setCheckoutBusy(false);
      }
    },
    [refresh, track],
  );

  const startDeviceUpgrade = useCallback(
    (opts?: {
      injectUser?: boolean;
      replace?: boolean;
      toast?: boolean;
      customerId?: string;
    }): boolean => {
      const who = opts?.customerId ? getCustomer(opts.customerId) : customer;
      const nbo = evaluateDeviceUpgrade(who);
      if (!nbo) return false;
      const first = customerGreetingName(who);
      setDeviceNbo({ ...nbo, status: "offered" });
      marketingConsumedRef.current.add("device_upgrade");
      const bot: ChatMessage = {
        id: `dev_${Date.now()}`,
        role: "bot",
        text: `You did — I can load a bundle in a moment. Your ${nbo.profile.currentDevice} has been on this line for ${nbo.profile.deviceAgeMonths} months, and your data use is high.\n\nYou may be ready for a new phone. Staying Huawei: ${nbo.deal.name} on contract, R${nbo.deal.monthlyRand} × ${nbo.deal.termMonths} months. New phone + data in one deal.`,
        deviceDeal: {
          currentDevice: nbo.profile.currentDevice,
          deviceAgeMonths: nbo.profile.deviceAgeMonths,
          offerName: nbo.deal.name,
          brand: nbo.deal.brand,
          monthlyRand: nbo.deal.monthlyRand,
          termMonths: nbo.deal.termMonths,
          shopUrl: nbo.deal.shopUrl,
          specs: nbo.deal.specs,
        },
        choices: [
          {
            id: "dev-see",
            label: "See this deal",
            meta: `R${nbo.deal.monthlyRand} × ${nbo.deal.termMonths}`,
            action: "device_see_deal",
            variant: "primary",
          },
          {
            id: "dev-data",
            label: "Just buy data",
            action: "device_buy_data",
            variant: "secondary",
          },
          {
            id: "dev-no",
            label: "No thanks",
            action: "device_decline",
            variant: "ghost",
          },
        ],
      };
      const userMsg: ChatMessage = {
        id: `u_dev_${Date.now()}`,
        role: "user",
        text: "I came here to buy data.",
      };
      if (opts?.replace) {
        setMessages(opts.injectUser ? [userMsg, bot] : [bot]);
      } else if (opts?.injectUser) {
        setMessages((prev) => [...prev, userMsg, bot]);
      } else {
        setMessages((prev) => [...prev, bot]);
      }
      if (opts?.toast) {
        setProactiveMessage(
          `${first}, you came to buy data — your ${nbo.profile.currentDevice} may be ready for an upgrade.`,
        );
        setProactiveOpen(true);
        setChatOpen(false);
      } else {
        setProactiveOpen(false);
        setChatOpen(true);
      }
      return true;
    },
    [customer],
  );

  const notifyPortalEvent = useCallback(
    (event: PortalEvent): boolean => {
      const plan = customer?.currentPlanName ?? "20GB Data";

      // Product browse only — no popup until Next (bundle_selected)
      if (event.kind === "topup_product") {
        return false;
      }

      if (event.kind === "bundle_selected") {
        const sceneKey = event.product;
        // Only Top-up / Summer Deals host pages may trigger marketing (not homepage chat)
        if (typeof window !== "undefined" && !event.force) {
          const path = window.location.pathname;
          const onMarketingHost =
            path.includes("/qr_portal/top-up") ||
            path.includes("/summer-deals");
          if (!onMarketingHost) return false;
        }
        // One interrupt per product scene; Presenter Fast Forward (force) may replay
        if (!event.force && marketingConsumedRef.current.has(sceneKey)) {
          return false;
        }

        const selected = toTopUpBundle(
          event.candidates.find((c) => c.id === event.selectedId) ??
            event.candidates[0]!,
          event.product,
          event.bundleType,
        );
        const candidates = event.candidates.map((c) =>
          toTopUpBundle(c, event.product, event.bundleType),
        );

        const tagged = Boolean(customer?.marketingEligible);
        const first = customerGreetingName(customer);
        const wantsTikTokInsight =
          tagged &&
          (event.product === "TikTok Bundles - Once Off" || event.force);

        // Thabo only: device contract. Sipho never has deviceProfile.
        if (
          evaluateDeviceUpgrade(customer) &&
          (event.force || !marketingConsumedRef.current.has("device_upgrade")) &&
          startDeviceUpgrade({
            injectUser: true,
            replace: true,
            toast: true,
          })
        ) {
          marketingConsumedRef.current.add(sceneKey);
          return true;
        }

        // Scene ② — TikTok personalized insight (Sipho / tagged only)
        if (wantsTikTokInsight && event.product === "TikTok Bundles - Once Off") {
          const upgrade =
            findAdjacentUpgrade(selected, candidates) ??
            [...candidates].sort((a, b) => b.price - a.price)[0]!;
          const usage = getAppUsage(customer?.id);
          const tiktokSlice = usage.slices.find((s) => s.app === "TikTok");
          const tiktokPct = tiktokSlice?.percent ?? 81;
          const delta =
            Math.round((upgrade.price - selected.price) * 100) / 100;
          marketingConsumedRef.current.add(sceneKey);
          setProactiveMessage(
            `${first}, TikTok is ~${tiktokPct}% of your data. ${upgrade.volume} may suit you better.`,
          );
          setProactiveOpen(true);
          setChatOpen(false);
          setMessages([
            {
              id: `tt_${Date.now()}`,
              role: "bot",
              text: `Hi ${first} — I noticed TikTok makes up about ${tiktokPct}% of your mobile data over the last 30 days (${usage.totalGb}GB total).\n\nYou're on ${plan}, and that usage is on the high side. A little more data can help you stay online without interruptions.`,
              showUsagePie: true,
            },
            {
              id: `tt_g_${Date.now() + 1}`,
              role: "bot",
              text:
                upgrade.id === selected.id
                  ? `I'd keep ${selected.volume} selected — tap Next when you're ready.`
                  : `${upgrade.volume} (R${upgrade.price.toFixed(2)}) gives you more headroom than ${selected.volume}${delta > 0 ? ` for just R${delta.toFixed(2)} more` : ""}.\n\nI can highlight it on the page for you — then tap Next to continue.`,
              upsell:
                upgrade.id === selected.id
                  ? undefined
                  : {
                      selectedId: selected.id,
                      upgradeId: upgrade.id,
                      selectedLabel: selected.volume,
                      upgradeLabel: upgrade.volume,
                      selectedPrice: selected.price,
                      upgradePrice: upgrade.price,
                      deltaPrice: delta,
                      product: event.product,
                    },
              guideBundleId: upgrade.id,
            },
          ]);
          return true;
        }

        // Sipho / untagged: adjacent data SKU when a cheaper pack was selected
        const action = evaluateCheckoutGate({
          selected,
          previouslyViewed: candidates.filter((c) =>
            event.viewedBundleIds.includes(c.id),
          ),
          candidates,
          dwellTimeSec: event.dwellTimeSec,
          comparisonCount: event.comparisonCount,
          purchaseIntent: event.purchaseIntent,
          force: event.force,
        });

        if (!action) {
          return false;
        }

        const { upgrade, deltaPrice } = action;
        marketingConsumedRef.current.add(sceneKey);
        setProactiveMessage(
          `${first}, for R${deltaPrice.toFixed(0)} more you could get ${upgrade.volume} instead of ${selected.volume}.`,
        );
        setProactiveOpen(true);
        setChatOpen(false);
        setMessages([
          {
            id: `gate_${Date.now()}`,
            role: "bot",
            text: `Hi ${first} — before you continue, for just R${deltaPrice.toFixed(2)} more you could get ${upgrade.volume} instead of ${selected.volume}.\n\nR${selected.price.toFixed(2)} → R${upgrade.price.toFixed(2)}\n\nI can select it for you on the page — then tap Next to pay.`,
            upsell: {
              selectedId: selected.id,
              upgradeId: upgrade.id,
              selectedLabel: selected.volume,
              upgradeLabel: upgrade.volume,
              selectedPrice: selected.price,
              upgradePrice: upgrade.price,
              deltaPrice,
              product: event.product,
            },
            guideBundleId: upgrade.id,
          },
        ]);
        return true;
      }

      if (event.kind === "summer_deals_compare" || event.kind === "summer_deals_checkout_intent") {
        const scored = event.candidates
          .filter((c) => c.volumeMb > 0)
          .map((c) => ({
            ...c,
            rpg: randPerGb(c.price, c.volumeMb),
          }))
          .sort((a, b) => a.rpg - b.rpg);
        const bestValue = scored[0];
        const premium = [...scored].sort((a, b) => b.price - a.price)[0];
        const pick =
          event.kind === "summer_deals_checkout_intent"
            ? premium ?? bestValue
            : bestValue;
        if (!pick) return false;
        const rows: CompareRow[] = scored.map((c) => ({
          id: c.id,
          title: c.title,
          price: c.price,
          meta: `R${c.rpg.toFixed(2)}/GB · ${c.validityDays}d`,
          recommended: c.id === pick.id,
        }));
        setProactiveOpen(false);
        setChatOpen(true);
        setMessages([
          {
            id: `m_${Date.now()}`,
            role: "bot",
            text: `Summer Deals ${event.category} — side-by-side on cost per GB. I'll highlight a pick on the page; you finish with Next.`,
            compareRows: rows,
            guideBundleId: pick.id,
          },
        ]);
        return true;
      }

      return false;
    },
    [customer, startDeviceUpgrade],
  );

  notifyPortalRef.current = notifyPortalEvent;



  const utterSim = useCallback(
    async (input: {
      step: string;
      event: string;
      firstName: string;
      fallback: string;
      facts?: Record<string, unknown>;
      allowedActions?: string[];
    }): Promise<string> => {
      try {
        const res = await apiFetch("/api/ai/sim-utterance", {
          method: "POST",
          body: JSON.stringify(input),
        });
        const data = (await res.json()) as { text?: string };
        return data.text?.trim() || input.fallback;
      } catch {
        return input.fallback;
      }
    },
    [],
  );

  const advanceSimChat = useCallback(
    async (
      text: string,
      opts?: { confirmed?: boolean; silent?: boolean },
    ): Promise<boolean> => {
      if (!simState || simState.locked || simState.step === "done" || simState.step === "idle") {
        return false;
      }
      if (!customer) return false;
      const trimmed = text.trim();
      const confirmed = Boolean(opts?.confirmed);
      const silent = Boolean(opts?.silent);
      const name = customerGreetingName(customer);
      if (!silent) {
        setMessages((prev) => [
          ...prev,
          { id: `u_${Date.now()}`, role: "user", text: trimmed },
        ]);
      }

      if (simState.step === "capture") {
        const digits = parseMsisdn(trimmed);
        if (!digits) {
          setMessages((prev) => {
            const copy = [...prev];
            for (let i = copy.length - 1; i >= 0; i--) {
              if (copy[i]?.role === "bot" && copy[i]?.inputWidget?.kind === "msisdn") {
                copy[i] = {
                  ...copy[i]!,
                  text: `${name}, that doesn't look like a 10-digit SA mobile number. Use the field below and tap Confirm.`,
                  inputWidget: {
                    kind: "msisdn",
                    prefill: trimmed.replace(/\D/g, "").slice(0, 10),
                  },
                };
                return copy;
              }
            }
            return [
              ...prev,
              {
                id: `b_${Date.now()}`,
                role: "bot",
                text: `${name}, please enter a valid 10-digit South African mobile number.`,
                inputWidget: { kind: "msisdn", prefill: "" },
              },
            ];
          });
          return true;
        }
        if (!confirmed) {
          setMessages((prev) => {
            const copy = [...prev];
            for (let i = copy.length - 1; i >= 0; i--) {
              if (copy[i]?.role === "bot" && copy[i]?.inputWidget?.kind === "msisdn") {
                copy[i] = {
                  ...copy[i]!,
                  text: `${name}, I read that as ${digits}. Confirm below if it's correct.`,
                  inputWidget: { kind: "msisdn", prefill: digits },
                };
                return copy;
              }
            }
            return [
              ...prev,
              {
                id: `b_${Date.now()}`,
                role: "bot",
                text: `${name}, I read that as ${digits}. Confirm below if it's correct.`,
                inputWidget: { kind: "msisdn", prefill: digits },
              },
            ];
          });
          return true;
        }
        const next = {
          ...simState,
          msisdn: digits,
          idNumber: customer.idNumber,
          address: customer.residentialAddress,
          step: "docs" as const,
        };
        setSimState(next);
        const fallback = `Thanks, ${name}. Let's verify your identity securely.`;
        const reply = await utterSim({
          step: "docs",
          event: "msisdn_captured",
          firstName: name,
          fallback,
          facts: { msisdnMasked: `${digits.slice(0, 3)}****${digits.slice(-4)}` },
        });
        setMessages((prev) => [
          ...prev,
          {
            id: `b_${Date.now()}`,
            role: "bot",
            text: reply,
            uploadCard: {
              step: 1,
              kind: "id",
              title: "Step 1 of 2: Upload your ID",
              body: "Please upload a clear photo or PDF of your passport or ID document.",
            },
          },
        ]);
        return true;
      }

      if (simState.step === "docs" || simState.step === "verify") {
        setMessages((prev) => [
          ...prev,
          {
            id: `b_${Date.now()}`,
            role: "bot",
            text: `${name}, please use the upload button on the card — I can't accept documents as text.`,
            uploadCard: !simState.idDocDataUrl
              ? {
                  step: 1 as const,
                  kind: "id" as const,
                  title: "Step 1 of 2: Upload your ID",
                  body: "Please upload a clear photo or PDF of your passport or ID document.",
                }
              : {
                  step: 2 as const,
                  kind: "por" as const,
                  title: "Step 2 of 2: Upload proof of residence",
                  body: "Please upload a recent proof of residence that shows your name and address.",
                },
          },
        ]);
        return true;
      }

      if (simState.step === "security") {
        let next = { ...simState };
        if (!next.lastRechargeDate) {
          const ymd = parseDateYmd(trimmed);
          if (!ymd) {
            setMessages((prev) => {
              const copy = [...prev];
              for (let i = copy.length - 1; i >= 0; i--) {
                if (copy[i]?.inputWidget?.kind === "date") {
                  copy[i] = {
                    ...copy[i]!,
                    text: `${name}, I couldn't read that date. Pick it below and tap Confirm.`,
                    inputWidget: {
                      kind: "date",
                      prefill: copy[i]!.inputWidget?.prefill ?? "",
                    },
                  };
                  return copy;
                }
              }
              return [
                ...prev,
                {
                  id: `b_${Date.now()}`,
                  role: "bot",
                  text: `${name}, please select the date of your last airtime recharge.`,
                  inputWidget: { kind: "date", prefill: "" },
                },
              ];
            });
            return true;
          }
          if (!confirmed) {
            setMessages((prev) => {
              const copy = [...prev];
              for (let i = copy.length - 1; i >= 0; i--) {
                if (copy[i]?.inputWidget?.kind === "date") {
                  copy[i] = {
                    ...copy[i]!,
                    text: `${name}, I read that as ${ymd}. Confirm below if it's correct.`,
                    inputWidget: { kind: "date", prefill: ymd },
                  };
                  return copy;
                }
              }
              return [
                ...prev,
                {
                  id: `b_${Date.now()}`,
                  role: "bot",
                  text: `${name}, I read that as ${ymd}. Confirm below if it's correct.`,
                  inputWidget: { kind: "date", prefill: ymd },
                },
              ];
            });
            return true;
          }
          next = { ...next, lastRechargeDate: ymd };
          setSimState(next);
          setMessages((prev) => [
            ...prev,
            {
              id: `b_${Date.now()}`,
              role: "bot",
              text: "Got it. What was the amount of that recharge in Rand?",
              inputWidget: { kind: "amount", prefill: "" },
            },
          ]);
          return true;
        }
        if (!next.lastRechargeAmount) {
          const amt = parseAmount(trimmed);
          if (!amt) {
            setMessages((prev) => {
              const copy = [...prev];
              for (let i = copy.length - 1; i >= 0; i--) {
                if (copy[i]?.inputWidget?.kind === "amount") {
                  copy[i] = {
                    ...copy[i]!,
                    text: "Please enter the recharge amount in Rand, then tap Confirm.",
                    inputWidget: {
                      kind: "amount",
                      prefill: trimmed.replace(/[^\d.]/g, ""),
                    },
                  };
                  return copy;
                }
              }
              return [
                ...prev,
                {
                  id: `b_${Date.now()}`,
                  role: "bot",
                  text: "Please enter the recharge amount in Rand, e.g. 100.",
                  inputWidget: { kind: "amount", prefill: "" },
                },
              ];
            });
            return true;
          }
          if (!confirmed) {
            setMessages((prev) => {
              const copy = [...prev];
              for (let i = copy.length - 1; i >= 0; i--) {
                if (copy[i]?.inputWidget?.kind === "amount") {
                  copy[i] = {
                    ...copy[i]!,
                    text: `I read R${amt}. Confirm below if that's right.`,
                    inputWidget: { kind: "amount", prefill: amt },
                  };
                  return copy;
                }
              }
              return [
                ...prev,
                {
                  id: `b_${Date.now()}`,
                  role: "bot",
                  text: `I read R${amt}. Confirm below if that's right.`,
                  inputWidget: { kind: "amount", prefill: amt },
                },
              ];
            });
            return true;
          }
          next = { ...next, lastRechargeAmount: amt };
          setSimState(next);
          setMessages((prev) => [
            ...prev,
            {
              id: `b_${Date.now()}`,
              role: "bot",
              text: "Last one — what was the last number you called from this SIM?",
              inputWidget: { kind: "phone", prefill: "" },
            },
          ]);
          return true;
        }

        const phone = parsePhone(trimmed) || trimmed.replace(/\D/g, "") || trimmed;
        if (!parsePhone(trimmed) && !confirmed) {
          setMessages((prev) => [
            ...prev,
            {
              id: `b_${Date.now()}`,
              role: "bot",
              text: "Please enter the last number called, then tap Confirm.",
              inputWidget: { kind: "phone", prefill: trimmed.replace(/\D/g, "") },
            },
          ]);
          return true;
        }
        if (!confirmed) {
          setMessages((prev) => {
            const copy = [...prev];
            for (let i = copy.length - 1; i >= 0; i--) {
              if (copy[i]?.inputWidget?.kind === "phone") {
                copy[i] = {
                  ...copy[i]!,
                  text: `I read ${phone}. Confirm below if that's right.`,
                  inputWidget: { kind: "phone", prefill: phone },
                };
                return copy;
              }
            }
            return [
              ...prev,
              {
                id: `b_${Date.now()}`,
                role: "bot",
                text: `I read ${phone}. Confirm below if that's right.`,
                inputWidget: { kind: "phone", prefill: phone },
              },
            ];
          });
          return true;
        }
        next = {
          ...next,
          lastCalledNumber: phone,
        };
        const check = securityMatches(next, customer);
        if (!check.ok) {
          const fails = simFailCount + 1;
          setSimFailCount(fails);
          if (fails >= 3) {
            setSimState({ ...next, locked: true, step: "locked" });
            setMessages((prev) => [
              ...prev,
              {
                id: `b_${Date.now()}`,
                role: "bot",
                text: `${name}, online SIM self-service is locked after three unsuccessful checks. Please continue at a Vodacom store — your progress is saved.`,
                simManual: buildSimManualCard(next, "security"),
                nearbyStores: nearbyCollectionStores(),
                choices: nearbyCollectionStores().map((s) => ({
                  id: s.id,
                  label: `Collect at ${s.name.replace(/^Vodacom\s+/i, "")}`,
                  action: "sim_store",
                  payload: s.id,
                })),
              },
            ]);
            return true;
          }
          setSimState({
            ...next,
            lastRechargeDate: "",
            lastRechargeAmount: "",
            lastCalledNumber: "",
          });
          setMessages((prev) => [
            ...prev,
            {
              id: `b_${Date.now()}`,
              role: "bot",
              text: `${name}, those answers didn't match. (${3 - fails} ${fails === 2 ? "try" : "tries"} left)\n\nLet's try again — confirm your last recharge date below.`,
              inputWidget: { kind: "date", prefill: "" },
              choices: [
                {
                  id: "retry",
                  label: "Retry security questions",
                  action: "sim_retry",
                },
              ],
            },
          ]);
          return true;
        }

        setSimFailCount(0);
        setSimState({ ...next, step: "locate" });
        const okText = await utterSim({
          step: "locate",
          event: "security_passed",
          firstName: name,
          fallback: `${name}, you're fully verified.`,
        });
        const fulfilText = await utterSim({
          step: "locate",
          event: "ask_fulfilment",
          firstName: name,
          fallback:
            "How would you like to finish the SIM swap? I can book a store visit for you, or you can go whenever it suits you — either way, any fee is paid at the counter (no OTP in chat).",
          allowedActions: ["sim_book_store", "sim_self_serve"],
        });
        setMessages((prev) => [
          ...prev,
          {
            id: `b_${Date.now()}`,
            role: "bot",
            text: okText,
            verifiedOk: true,
          },
          {
            id: `b_${Date.now() + 1}`,
            role: "bot",
            text: fulfilText,
            choices: [
              {
                id: "fulfil-book",
                label: "Book a store visit",
                meta: "Share your location — I'll find the nearest branch",
                action: "sim_book_store",
                variant: "primary",
              },
              {
                id: "fulfil-self",
                label: "I'll go later on my own",
                meta: "Browse all Vodacom stores yourself",
                action: "sim_self_serve",
                variant: "secondary",
              },
            ],
          },
        ]);
        return true;
      }

      if (simState.step === "locate") {
        const stores = nearbyCollectionStores();
        setMessages((prev) => [
          ...prev,
          {
            id: `b_${Date.now()}`,
            role: "bot",
            text: `Pick one of these nearby stores so I can hand your case to that branch. I need to know which store you're going to.`,
            storePick: true,
            nearbyStores: stores,
            choices: stores.map((s) => ({
              id: s.id,
              label: `Collect at ${s.name.replace(/^Vodacom\s+/i, "")}`,
              meta:
                typeof s.distanceKm === "number"
                  ? `${s.distanceKm} km`
                  : s.address,
              action: "sim_store",
              payload: s.id,
            })),
          },
        ]);
        return true;
      }

      return false;
    },
    [customer, simFailCount, simState, utterSim],
  );

  const completeSimDocs = useCallback(
    async (kind: "id" | "por", dataUrl: string, fileMeta?: { name: string; size: number }) => {
      if (!simState || !customer) return;
      const name = customerGreetingName(customer);
      const sizeLabel =
        fileMeta && fileMeta.size > 0
          ? fileMeta.size >= 1024 * 1024
            ? `${(fileMeta.size / (1024 * 1024)).toFixed(1)} MB`
            : `${Math.max(1, Math.round(fileMeta.size / 1024))} KB`
          : "Uploaded";
      const fileName =
        fileMeta?.name ||
        (kind === "id" ? "identity-document" : "proof-of-residence");

      const next = {
        ...simState,
        idDocDataUrl: kind === "id" ? dataUrl : simState.idDocDataUrl,
        porDocDataUrl: kind === "por" ? dataUrl : simState.porDocDataUrl,
        step: "verify" as const,
      };
      setSimState(next);

      const progressId = `vp_${Date.now()}`;
      const baseSteps =
        kind === "id"
          ? [
              { id: "up", label: "File uploaded", state: "done" as const },
              { id: "det", label: "Document detected", state: "active" as const },
              { id: "ext", label: "Extracting information", state: "pending" as const },
              { id: "match", label: "Matching with account", state: "pending" as const },
              { id: "final", label: "Final verification", state: "pending" as const },
            ]
          : [
              { id: "up", label: "File uploaded", state: "done" as const },
              { id: "det", label: "Address document detected", state: "active" as const },
              { id: "ext", label: "Reading address details", state: "pending" as const },
              { id: "match", label: "Matching with account", state: "pending" as const },
              { id: "final", label: "Final verification", state: "pending" as const },
            ];

      setMessages((prev) => [
        ...prev,
        {
          id: `u_${Date.now()}`,
          role: "user",
          text: kind === "id" ? "ID document uploaded" : "Proof of residence uploaded",
          uploadedFile: { name: fileName, sizeLabel, kind },
        },
        {
          id: progressId,
          role: "bot",
          text:
            kind === "id"
              ? `Thanks, ${name}! I've received your ID. I'm checking it now with our secure verification.`
              : `Thanks, ${name}. I've received your proof of residence — verifying it now.`,
          verifyProgress: { title: "Verification in progress", steps: baseSteps },
        },
      ]);

      const setStepStates = (doneThrough: number, activeIdx: number) => {
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id !== progressId || !m.verifyProgress) return m;
            return {
              ...m,
              verifyProgress: {
                ...m.verifyProgress,
                steps: baseSteps.map((s, i) => ({
                  ...s,
                  state:
                    i <= doneThrough
                      ? ("done" as const)
                      : i === activeIdx
                        ? ("active" as const)
                        : ("pending" as const),
                })),
              },
            };
          }),
        );
      };

      // No artificial sleeps — advance UI while Vision runs
      setStepStates(1, 2);

      let matchOk = false;
      let reasons: string[] = [];
      let extracted: Record<string, unknown> = {};
      let summary = "";
      try {
        const res = await apiFetch("/api/ai/verify-id", {
          method: "POST",
          body: JSON.stringify({
            customerId: customer.id,
            stage: kind === "id" ? "id" : "por",
            idDataUrl: kind === "id" ? next.idDocDataUrl : undefined,
            porDataUrl: kind === "por" ? next.porDocDataUrl : undefined,
          }),
        }).then((r) => r.json());
        matchOk = Boolean(res.match);
        reasons = Array.isArray(res.reasons) ? (res.reasons as string[]) : [];
        extracted = (res.extracted as Record<string, unknown>) ?? {};
        summary = (res.summary as string) || "";
      } catch (e) {
        reasons = [e instanceof Error ? e.message : "Verification failed"];
        matchOk = false;
      }

      if (!matchOk) {
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id !== progressId || !m.verifyProgress) return m;
            return {
              ...m,
              verifyProgress: {
                title: "Verification failed",
                steps: baseSteps.map((s, i) => ({
                  ...s,
                  state:
                    i <= 2
                      ? ("done" as const)
                      : ("failed" as const),
                })),
              },
            };
          }),
        );

        const fails = simFailCount + 1;
        setSimFailCount(fails);
        setSimState({
          ...next,
          failCount: fails,
          locked: fails >= 3,
          step: fails >= 3 ? "locked" : "docs",
          idDocDataUrl: kind === "id" ? null : next.idDocDataUrl,
          porDocDataUrl: kind === "por" ? null : next.porDocDataUrl,
        });

        if (fails >= 3) {
          setMessages((prev) => [
            ...prev,
            {
              id: `b_${Date.now()}`,
              role: "bot",
              text: `${name}, we couldn't verify your documents after 3 tries. Your request is ready for in-store completion.`,
              attemptBadge: { current: fails, max: 3 },
              simManual: buildSimManualCard(
                { ...next, failCount: fails, locked: true, step: "locked" },
                "docs",
              ),
              choices: [
                {
                  id: "find-store",
                  label: "Find a Store",
                  action: "open_store_locator",
                },
              ],
            },
          ]);
          return;
        }

        if (kind === "id") {
          setMessages((prev) => [
            ...prev,
            {
              id: `b_${Date.now()}`,
              role: "bot",
              text: `${name}, we couldn't match that ID to your account. Please upload a clearer photo of your passport or SA ID.`,
              attemptBadge: { current: fails, max: 3 },
              uploadCard: {
                step: 1,
                kind: "id",
                title: "Step 1 of 2: Upload your ID",
                body: "Please upload a clear photo or PDF of your passport or ID document.",
              },
            },
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              id: `b_${Date.now()}`,
              role: "bot",
              text: `${name}, we couldn't match that proof of residence. Please try another document.`,
              attemptBadge: { current: fails, max: 3 },
              uploadCard: {
                step: 2,
                kind: "por",
                title: "Step 2 of 2: Upload proof of residence",
                body: "Please upload a recent proof of residence that shows your name and address.",
              },
            },
          ]);
        }
        return;
      }

      setStepStates(4, -1);

      if (kind === "id") {
        setSimState({ ...next, step: "docs" });
        const fullName = String(extracted.fullName ?? customer.name);
        const idNumber = String(extracted.idNumber ?? customer.idNumber);
        const dob = String(extracted.dateOfBirth ?? "—");
        const docType = String(extracted.documentType ?? "Passport / ID");
        setMessages((prev) => [
          ...prev,
          {
            id: `b_${Date.now()}`,
            role: "bot",
            text: `Great news, ${name}! Your ID has been verified successfully.`,
            verifyResult: {
              title: "Identity verified",
              fields: [
                { label: "Name", value: fullName, ok: true },
                { label: "Document number", value: idNumber, ok: true },
                { label: "Date of birth", value: dob, ok: true },
                { label: "Document type", value: docType, ok: true },
                { label: "Customer match", value: "Matched", ok: true },
              ],
            },
          },
          {
            id: `b_${Date.now() + 1}`,
            role: "bot",
            text: "One more step — please upload your proof of residence.",
            uploadCard: {
              step: 2,
              kind: "por",
              title: "Step 2 of 2: Upload proof of residence",
              body: "Please upload a recent proof of residence that shows your name and address.",
            },
          },
        ]);
        return;
      }

      // PoR matched
      if (next.suspendOnly) {
        setSimState({ ...next, step: "done" });
        setMessages((prev) => [
          ...prev,
          {
            id: `b_${Date.now()}`,
            role: "bot",
            text: `${name}, you're all set — your SIM has been suspended. Message me anytime when you're ready to reactivate.`,
          },
        ]);
        return;
      }

      setSimState({
        ...next,
        step: "security",
        lastRechargeDate: "",
        lastRechargeAmount: "",
        lastCalledNumber: "",
      });
      const fallback = `${name}, address verified${summary ? ` — ${summary}` : ""}.\n\nFor your security, I need to confirm a few account details. Select the date of your last airtime recharge below.`;
      const text = await utterSim({
        step: "security",
        event: "ask_recharge_date",
        firstName: name,
        fallback,
        facts: { addressSummary: summary },
      });
      setMessages((prev) => [
        ...prev,
        {
          id: `b_${Date.now()}`,
          role: "bot",
          text,
          inputWidget: { kind: "date", prefill: "" },
        },
      ]);
    },
    [customer, simFailCount, simState, utterSim],
  );

  const startSimSelfCare = useCallback(
    async (opts?: { suspendOnly?: boolean; replace?: boolean }) => {
      const suspendOnly = Boolean(opts?.suspendOnly);
      const replace = opts?.replace !== false;
      let name = customerGreetingName(customer);
      let msisdnPrefill = customer?.sim.msisdn ?? "";
      if (customer?.kycMode === "reject" || customer?.id === "sipho") {
        await selectCustomer("shen");
        name = "Li";
        msisdnPrefill = getCustomer("shen")?.sim.msisdn ?? "0795731369";
      }
      setSimState(createSimState(suspendOnly));
      setSimFailCount(0);
      setCoverageState(IDLE_COVERAGE);
      setProactiveOpen(false);
      setChatOpen(true);
      const fallback = suspendOnly
        ? `Hi ${name} — I can suspend your SIM securely. Please confirm your mobile number below.`
        : `Hi ${name} — sorry about your lost SIM. I'll help you replace it and keep your number. Please confirm the mobile number on that SIM below.`;
      const text = await utterSim({
        step: "capture",
        event: "intro",
        firstName: name,
        fallback,
        allowedActions: ["confirm_msisdn"],
      });
      const intro = {
        id: `sim_${Date.now()}`,
        role: "bot" as const,
        text,
        inputWidget: { kind: "msisdn" as const, prefill: msisdnPrefill },
      };
      setMessages((prev) => (replace ? [intro] : [...prev, intro]));
    },
    [customer, selectCustomer, utterSim],
  );

  const seedChatMenu = useCallback(() => {
    const name = customerGreetingName(customer);
    setMessages([
      {
        id: `menu_${Date.now()}`,
        role: "bot",
        text: `Hi ${name} 👋\n\nHow can I help today?`,
        choices: [
          {
            id: "menu-topup",
            label: "Top-up / upgrade packages",
            meta: "Once-off bundles & plan upgrades",
            action: "menu_bundles",
          },
          {
            id: "menu-sim",
            label: "SIM self-care",
            meta: "Lost / replace / suspend SIM",
            action: "menu_sim",
          },
          {
            id: "menu-bill",
            label: "Billing",
            meta: "Explain my bill · view invoices",
            action: "menu_billing",
          },
          {
            id: "menu-coverage",
            label: "Check coverage",
            meta: "5G, LTE and Fibre at an address",
            action: "menu_coverage",
          },
          {
            id: "menu-agent",
            label: "Talk to an agent",
            meta: "Online chat · callback · 081 180",
            action: "menu_agent",
          },
          {
            id: "menu-faq",
            label: "Ask a FAQ",
            meta: "Type any Vodacom question below",
            action: "menu_faq",
          },
        ],
      },
    ]);
  }, [customer]);

  const startCoverageCheck = useCallback(
    (opts?: {
      focus?: CoverageFocus;
      replace?: boolean;
      skipChooser?: boolean;
    }) => {
      const focus = opts?.focus ?? "any";
      const replace = opts?.replace !== false;
      setSimState(null);
      setSimFailCount(0);
      setCoverageState({
        step: opts?.skipChooser ? "ask_location" : "idle",
        focus,
        location: null,
        result: null,
      });
      setProactiveOpen(false);
      setChatOpen(true);
      const intro: ChatMessage = opts?.skipChooser
        ? {
            id: `cov_${Date.now()}`,
            role: "bot",
            text: "Sure. I can check what's available at your location. What's the address you'd like me to check?",
            locationInput: {
              placeholder: "Search your address",
              suggestions: coverageSuggestions,
            },
          }
        : {
            id: `cov_${Date.now()}`,
            role: "bot",
            text: "Sure. I can check what's available at your location.",
            choices: [
              {
                id: "cov-any",
                label: "Check my coverage",
                action: "coverage_ask",
                payload: "any",
                variant: "primary",
              },
              {
                id: "cov-5g",
                label: "Check 5G",
                action: "coverage_ask",
                payload: "5g",
              },
              {
                id: "cov-fibre",
                label: "Check Fibre",
                action: "coverage_ask",
                payload: "fibre",
              },
            ],
          };
      setMessages((prev) => (replace ? [intro] : [...prev, intro]));
    },
    [],
  );

  const askCoverageAddress = useCallback((focus: CoverageFocus, injectUser?: string) => {
    setCoverageState((s) => ({
      ...s,
      focus,
      step: "ask_location",
      location: null,
      result: null,
    }));
    const userLine =
      injectUser ??
      (focus === "5g"
        ? "Check 5G"
        : focus === "fibre"
          ? "Check Fibre"
          : "Check my coverage");
    setMessages((prev) => [
      ...prev,
      { id: `u_${Date.now()}`, role: "user", text: userLine },
      {
        id: `b_${Date.now()}`,
        role: "bot",
        text: "What's the address you'd like me to check?",
        locationInput: {
          placeholder: "Search your address",
          suggestions: coverageSuggestions,
        },
      },
    ]);
  }, []);

  /** Enter coverage flow with a known place — skips chooser, straight to confirm. */
  const proposeCoverageLocation = useCallback(
    (query: string, focus: CoverageFocus = "any") => {
      const location = resolveCoverageLocation(query);
      setSimState(null);
      setSimFailCount(0);
      setCoverageState({ step: "location_entered", focus, location, result: null });
      setProactiveOpen(false);
      setChatOpen(true);
      setMessages((prev) => [
        ...prev,
        {
          id: `b_${Date.now()}`,
          role: "bot",
          text: `I hear you — ${location.formatted}. Please confirm this is the location you want me to check, or drag the pin on the map to adjust.`,
          locationCard: location,
        },
      ]);
    },
    [],
  );

  const submitCoverageAddress = useCallback((query: string) => {
    const location = resolveCoverageLocation(query);
    setCoverageState((s) => ({
      ...s,
      step: "location_entered",
      location,
      result: null,
    }));
    setMessages((prev) => [
      ...prev,
      { id: `u_${Date.now()}`, role: "user", text: query },
      {
        id: `b_${Date.now()}`,
        role: "bot",
        text: "Please confirm this is the location you want me to check.",
        locationCard: location,
      },
    ]);
  }, []);

  /** Browser geolocation granted — snap to the nearest real address and confirm. */
  const proposeCoverageByCoords = useCallback((lat: number, lng: number) => {
    const location = resolveCoverageByCoords(lat, lng);
    setCoverageState((s) => ({
      ...s,
      step: "location_entered",
      location,
      result: null,
    }));
    setMessages((prev) => [
      ...prev,
      { id: `u_${Date.now()}`, role: "user", text: "Use my current location" },
      {
        id: `b_${Date.now()}`,
        role: "bot",
        text:
          location.scenarioId === "complex"
            ? "I got your device location, but this exact spot needs the official checker. Confirm the pin, or drag it on the map to adjust."
            : `From your device location — ${location.formatted}. Confirm this is the location you want me to check, or drag the pin on the map to adjust.`,
        locationCard: location,
      },
    ]);
  }, []);

  /** Geolocation denied/unavailable — stay on the address input. */
  const coverageGeoFailed = useCallback(() => {
    setMessages((prev) => [
      ...prev,
      {
        id: `b_${Date.now()}`,
        role: "bot",
        text: "I couldn't get your device location. No problem — type the address above, or pick one of the suggestions.",
      },
    ]);
  }, []);

  /** Pin dragged on the confirm map — re-resolve the address live. */
  const adjustCoverageLocation = useCallback((lat: number, lng: number) => {
    const location = resolveCoverageByCoords(lat, lng);
    setCoverageState((s) =>
      s.step === "location_entered" ? { ...s, location } : s,
    );
    setMessages((prev) => {
      const idx = [...prev].reverse().findIndex((m) => m.locationCard);
      if (idx === -1) return prev;
      const real = prev.length - 1 - idx;
      const next = [...prev];
      next[real] = { ...next[real], locationCard: location };
      return next;
    });
  }, []);

  const runCoverageCheck = useCallback(
    async (location: CoverageLocation, focus: CoverageFocus) => {
      setCoverageState((s) => ({ ...s, step: "checking", location, focus }));
      setMessages((prev) => [
        ...prev,
        {
          id: `chk_${Date.now()}`,
          role: "bot",
          text: "Checking what's available at your location.",
          coverageChecking: { address: location.formatted },
        },
      ]);
      try {
        const params = new URLSearchParams({
          lat: String(location.lat),
          lng: String(location.lng),
          address: location.formatted,
        });
        const res = await apiFetch(`/api/coverage/check?${params.toString()}`, {
          // Hotspot-proof: never hang the "checking" state forever
          signal: AbortSignal.timeout(12_000),
        });
        if (!res.ok) throw new Error("fail");
        const data = (await res.json()) as CoverageCheckResponse;
        // Deliberate pacing — let the user see the per-technology checks happen
        await new Promise((r) => setTimeout(r, 2000));
        if (data.status === "COMPLEX" || data.requiresOfficialCheck) {
          setCoverageState({
            step: "complex",
            focus,
            location,
            result: data,
          });
          setMessages((prev) => [
            ...prev,
            {
              id: `b_${Date.now()}`,
              role: "bot",
              text: coverageResultCopy(data),
              coverageFallback: { kind: "complex" },
            },
          ]);
          return;
        }
        setCoverageState({
          step: "available",
          focus,
          location,
          result: data,
        });
        setMessages((prev) => [
          ...prev,
          {
            id: `b_${Date.now()}`,
            role: "bot",
            text: `${coverageResultCopy(data)}\n\n${coverageNextStepCopy()}`,
            coverageResult: {
              address: data.address || location.formatted,
              line1: location.line1,
              suburb: location.suburb,
              city: location.city,
              result: data,
            },
            choices: [
              {
                id: "ex-5g",
                label: "Explore 5G Internet",
                action: "coverage_explore_5g",
                variant: "primary",
              },
              {
                id: "ex-fibre",
                label: "Explore Fibre",
                action: "coverage_explore_fibre",
              },
              {
                id: "ex-again",
                label: "Check another address",
                action: "coverage_another",
                variant: "ghost",
              },
            ],
          },
        ]);
      } catch {
        setCoverageState({
          step: "error",
          focus,
          location,
          result: null,
        });
        setMessages((prev) => [
          ...prev,
          {
            id: `b_${Date.now()}`,
            role: "bot",
            text: "Sorry, I couldn't complete the coverage check right now.",
            coverageFallback: { kind: "error" },
          },
        ]);
      }
    },
    [],
  );

  const startBillingAssist = useCallback(
    async (opts?: { fromEmail?: boolean; replace?: boolean }) => {
      const replace = opts?.replace !== false;
      if (customer?.id !== "shen") {
        await apiFetch("/api/session", {
          method: "POST",
          body: JSON.stringify({ action: "select", customerId: "shen" }),
        });
        setProactiveOpen(false);
        setProactiveFetched(false);
        marketingConsumedRef.current.clear();
        await refresh();
      }
      const inv = getLatestInvoice("shen");
      const amount = inv?.totalDue ?? 1544.58;
      const month = inv?.month ?? "July";
      const name = "Li";
      setSimState(null);
      setSimFailCount(0);
      setCoverageState(IDLE_COVERAGE);
      setProactiveOpen(false);
      setChatOpen(true);
      void track("chat_open", window.location.pathname, undefined, {
        source: opts?.fromEmail ? "bill_email" : "billing_menu",
      });
      const intro: ChatMessage = {
        id: `bill_${Date.now()}`,
        role: "bot",
        text: opts?.fromEmail
          ? `Hi ${name} 👋\n\nYour ${month} bill is ready.\n\nAmount due\nR${amount.toFixed(2)}\n\nI've also noticed something that may help you reduce your monthly data costs.\n\nWould you like me to explain?`
          : `Hi ${name} 👋\n\nI can walk you through your latest bill (R${amount.toFixed(2)} due) or open your invoices.`,
        choices: [
          {
            id: "bill-explain",
            label: "Yes, explain my bill",
            action: "bill_explain",
          },
          {
            id: "bill-view",
            label: "View my invoice",
            action: "bill_view",
          },
        ],
      };
      setMessages((prev) => (replace ? [intro] : [...prev, intro]));
    },
    [customer?.id, refresh, track],
  );

  const handleChatAction = useCallback(
    async (action: string, payload?: string) => {
      if (action === "guide_bundle" && payload) {
        // Soft-nav from ChatAssistant (router.push) so portalShelfHint survives.
        applyBundleGuide(payload);
        return;
      }
      if (action === "menu_faq") {
        setMessages((prev) => [
          ...prev,
          {
            id: `u_${Date.now()}`,
            role: "user",
            text: "Ask a FAQ",
          },
          {
            id: `b_${Date.now()}`,
            role: "bot",
            text: "Sure — ask me anything about Vodacom products, billing, fibre, mobile, or self-service. I'll answer from our FAQ knowledge base.",
          },
        ]);
        return;
      }
      if (action === "menu_sim") {
        setMessages((prev) => [
          ...prev,
          { id: `u_${Date.now()}`, role: "user", text: "SIM self-care" },
        ]);
        await startSimSelfCare({ replace: false });
        return;
      }
      if (action === "menu_agent") {
        setMessages((prev) => [
          ...prev,
          { id: `u_${Date.now()}`, role: "user", text: "Talk to an agent" },
        ]);
        await handleChatAction("handoff", "Customer opened Talk to an agent");
        return;
      }
      if (action === "menu_billing") {
        setMessages((prev) => [
          ...prev,
          { id: `u_${Date.now()}`, role: "user", text: "Billing" },
        ]);
        await startBillingAssist({ fromEmail: false, replace: false });
        return;
      }
      if (action === "menu_coverage") {
        setMessages((prev) => [
          ...prev,
          { id: `u_${Date.now()}`, role: "user", text: "Check coverage" },
        ]);
        startCoverageCheck({ replace: false, skipChooser: false });
        return;
      }
      if (action === "menu_bundles") {
        setMessages((prev) => [
          ...prev,
          {
            id: `u_${Date.now()}`,
            role: "user",
            text: "I came here to buy data.",
          },
        ]);
        if (startDeviceUpgrade({ injectUser: false, replace: false })) {
          return;
        }
        setMessages((prev) => [
          ...prev,
          {
            id: `b_${Date.now()}`,
            role: "bot",
            text: "Sure — tell me what you need (WhatsApp, TikTok, or general LTE data), or open Top-up on the site.",
            choices: [
              {
                id: "open-topup",
                label: "Open Top-up",
                action: "bill_open_topup",
              },
            ],
          },
        ]);
        return;
      }
      if (action === "device_see_deal") {
        const url =
          deviceNbo?.deal.shopUrl ??
          evaluateDeviceUpgrade(customer)?.deal.shopUrl;
        setDeviceNbo((prev) =>
          prev ? { ...prev, status: "accepted" } : prev,
        );
        setProactiveOpen(false);
        setChatOpen(true);
        setMessages((prev) => [
          ...prev,
          {
            id: `u_${Date.now()}`,
            role: "user",
            text: "See this deal",
          },
          {
            id: `b_${Date.now()}`,
            role: "bot",
            text: "HUAWEI nova 15 Max 8/256GB on contract — a new Huawei phone with data on one 36-month deal. Open the official Vodacom shop page to continue.",
            verifiedOk: true,
            okBadge: "DEVICE_UPGRADE",
            choices: url
              ? [
                  {
                    id: "dev-shop-again",
                    label: "Open HUAWEI nova 15 Max deal",
                    action: "device_open_shop",
                    variant: "primary",
                  },
                ]
              : undefined,
          },
        ]);
        return;
      }
      if (action === "device_open_shop") {
        const url =
          deviceNbo?.deal.shopUrl ??
          evaluateDeviceUpgrade(customer)?.deal.shopUrl;
        if (url && typeof window !== "undefined") {
          window.open(url, "_blank", "noopener,noreferrer");
        }
        return;
      }
      if (action === "device_buy_data") {
        setDeviceNbo((prev) =>
          prev ? { ...prev, status: "data_only" } : prev,
        );
        setProactiveOpen(false);
        setChatOpen(false);
        setMessages([]);
        return;
      }
      if (action === "device_decline") {
        setDeviceNbo((prev) =>
          prev ? { ...prev, status: "declined" } : prev,
        );
        setProactiveOpen(false);
        setMessages((prev) => [
          ...prev,
          {
            id: `u_${Date.now()}`,
            role: "user",
            text: "No thanks",
          },
          {
            id: `b_${Date.now()}`,
            role: "bot",
            text: "Understood — your data checkout stays as-is. Ask anytime if you want the Huawei deal later.",
            verifiedOk: true,
            okBadge: "Data only",
          },
        ]);
        return;
      }
      if (action === "bill_open_topup") {
        if (typeof window !== "undefined") {
          window.location.href = "/qr_portal/top-up/data";
        }
        return;
      }
      if (action === "bill_explain") {
        const saving = Math.max(0, Math.round(SHEN_LTE_AVG - 349));
        setMessages((prev) => [
          ...prev,
          {
            id: `u_${Date.now()}`,
            role: "user",
            text: "Yes, explain my bill",
          },
          {
            id: `b_${Date.now()}`,
            role: "bot",
            text: `Here's what stands out on your 20GB monthly data line:\n\n${SHEN_DATA_USAGE.map((r) => `${r.month} 2026 — ${r.gb}GB used · R${r.lteCharge.toFixed(2)} paid`).join("\n")}\n\nThree-month average: 35GB and R${SHEN_LTE_AVG.toFixed(2)} per month. Your excess usage was covered by 1.5GB daily bundles at Vodacom's published R32 price.\n\nA 50GB monthly bundle is R349. It covers your average usage with 15GB spare and would save about R${saving} per month.`,
            showDataUsageChart: true,
            showUsagePie: true,
            choices: [
              {
                id: "bill-upgrade",
                label: "Upgrade to 50GB",
                meta: "Vodacom monthly bundle · R349",
                action: "bill_upgrade",
                variant: "primary",
              },
              {
                id: "bill-agent",
                label: "Talk to an agent",
                meta: "Not sure yet — prefer a human",
                action: "bill_handoff",
                variant: "secondary",
              },
              {
                id: "bill-keep",
                label: "No thanks",
                meta: "Keep my current 20GB plan",
                action: "bill_keep",
                variant: "ghost",
              },
            ],
          },
        ]);
        return;
      }
      if (action === "bill_view") {
        const inv = getLatestInvoice(customer?.id === "shen" ? "shen" : customer?.id || "shen");
        setMessages((prev) => [
          ...prev,
          {
            id: `u_${Date.now()}`,
            role: "user",
            text: "View my invoice",
          },
          {
            id: `b_${Date.now()}`,
            role: "bot",
            text: inv
              ? `${inv.month} statement · ${inv.id}\nDue ${inv.dueDate}\nTotal R${inv.totalDue.toFixed(2)}\n\n${inv.lineItems.map((li) => `· ${li.label}: R${li.amount.toFixed(2)}`).join("\n")}\n\nOpen the full billing page for downloads and past months.`
              : "I couldn't load invoices for this account.",
            choices: inv
              ? [
                  {
                    id: "bill-open-page",
                    label: "Open billing page",
                    action: "bill_open_page",
                  },
                  {
                    id: "bill-explain-2",
                    label: "Explain charges with AI",
                    action: "bill_explain",
                  },
                ]
              : undefined,
          },
        ]);
        return;
      }
      if (action === "bill_open_page") {
        if (typeof window !== "undefined") {
          window.location.href = "/customer/billing";
        }
        return;
      }
      if (action === "bill_upgrade") {
        const shopUrl =
          "https://www.vodacom.co.za/vodacom/shopping/plans/prepaid-plans";
        setMessages((prev) => [
          ...prev,
          {
            id: `u_${Date.now()}`,
            role: "user",
            text: "Upgrade to the 50GB monthly bundle",
          },
          {
            id: `b_${Date.now()}`,
            role: "bot",
            text: "Great choice — I'm opening Vodacom's official data plan page so you can review the 50GB monthly bundle. If the tab doesn't open, use the button below.",
            choices: [
              {
                id: "bill-shop-again",
                label: "Open Vodacom 50GB plans",
                action: "bill_open_shop",
              },
            ],
          },
        ]);
        if (typeof window !== "undefined") {
          window.open(shopUrl, "_blank", "noopener,noreferrer");
        }
        return;
      }
      if (action === "bill_open_shop") {
        if (typeof window !== "undefined") {
          window.open(
            "https://www.vodacom.co.za/vodacom/shopping/plans/prepaid-plans",
            "_blank",
            "noopener,noreferrer",
          );
        }
        return;
      }
      if (action === "bill_handoff") {
        const issue =
          "50GB monthly data upgrade — customer wants a human before deciding";
        setMessages((prev) => [
          ...prev,
          {
            id: `u_${Date.now()}`,
            role: "user",
            text: "Talk to an agent",
          },
          {
            id: `h_${Date.now()}`,
            role: "bot",
            text: "I can transfer you to a Vodacom online agent with your account context, or book a callback.",
            careOffer: {
              phone: VODACOM_CARE_PHONE,
              issue,
            },
            choices: [
              {
                id: "online-agent-bill",
                label: "Chat with an online agent",
                meta: "Vodacom Get Help",
                action: "handoff_online",
                payload: issue,
                variant: "primary",
              },
              {
                id: "cb-yes",
                label: "Request a callback",
                action: "offer_callback",
                payload: issue,
                variant: "secondary",
              },
              {
                id: "cb-no",
                label: `I'll call ${VODACOM_CARE_PHONE}`,
                action: "care_number_ack",
                payload: VODACOM_CARE_PHONE,
                variant: "ghost",
              },
            ],
          },
        ]);
        return;
      }
      if (action === "bill_keep") {
        setMessages((prev) => [
          ...prev,
          {
            id: `u_${Date.now()}`,
            role: "user",
            text: "No thanks",
          },
          {
            id: `b_${Date.now()}`,
            role: "bot",
            text: "No problem — you'll stay on the 20GB monthly bundle. If you change your mind or want to talk it through with someone, just ask.",
            verifiedOk: true,
            okBadge: "Plan unchanged",
          },
        ]);
        return;
      }
      if (action === "coverage_ask") {
        const focus = (payload === "5g" || payload === "fibre" ? payload : "any") as CoverageFocus;
        askCoverageAddress(focus);
        return;
      }
      if (action === "coverage_confirm") {
        const loc = coverageState.location;
        if (!loc) return;
        setCoverageState((s) => ({
          ...s,
          step: "location_confirmed",
          location: loc,
        }));
        setMessages((prev) => [
          ...prev,
          {
            id: `u_${Date.now()}`,
            role: "user",
            text: "Confirm location",
          },
        ]);
        await runCoverageCheck(loc, coverageState.focus);
        return;
      }
      if (action === "coverage_retry") {
        const loc = coverageState.location;
        if (!loc) {
          askCoverageAddress(coverageState.focus, "Try again");
          return;
        }
        await runCoverageCheck(loc, coverageState.focus);
        return;
      }
      if (action === "coverage_another") {
        askCoverageAddress(coverageState.focus, "Check another address");
        return;
      }
      if (action === "coverage_back") {
        setCoverageState((s) => ({ ...s, step: "idle" }));
        seedChatMenu();
        return;
      }
      if (action === "coverage_explore_5g") {
        if (typeof window !== "undefined") {
          window.open(VODACOM_5G_EXPLORE_URL, "_blank", "noopener,noreferrer");
        }
        return;
      }
      if (action === "coverage_explore_fibre") {
        if (typeof window !== "undefined") {
          window.open(VODACOM_FIBRE_EXPLORE_URL, "_blank", "noopener,noreferrer");
        }
        return;
      }
      if (action === "coverage_open_map") {
        if (typeof window !== "undefined") {
          window.open(VODACOM_COVERAGE_MAP_URL, "_blank", "noopener,noreferrer");
        }
        return;
      }
      if (action === "handoff") {
        const issue = payload || "Customer requested human help";
        setMessages((prev) => [
          ...prev,
          {
            id: `h_${Date.now()}`,
            role: "bot",
            text: "I can transfer you to a Vodacom online agent with your account context, or book a callback.",
            careOffer: {
              phone: VODACOM_CARE_PHONE,
              issue,
            },
            choices: [
              {
                id: "online-agent",
                label: "Chat with an online agent",
                meta: "Vodacom Get Help",
                action: "handoff_online",
                payload: issue,
                variant: "primary",
              },
              {
                id: "cb-yes",
                label: "Request a callback",
                action: "offer_callback",
                payload: issue,
                variant: "secondary",
              },
              {
                id: "cb-no",
                label: `I'll call ${VODACOM_CARE_PHONE}`,
                action: "care_number_ack",
                payload: VODACOM_CARE_PHONE,
                variant: "ghost",
              },
            ],
          },
        ]);
        return;
      }
      if (action === "handoff_online" || action === "handoff_open_chat") {
        if (!agentDeskOpen) return;
        const issue = payload || "Customer requested online agent";
        if (action === "handoff_open_chat") {
          if (typeof window !== "undefined") {
            window.open(VODACOM_ONLINE_CHAT_URL, "_blank", "noopener,noreferrer");
          }
          return;
        }
        const turns = messages
          .filter((m) => m.role !== "system" && m.text)
          .slice(-8)
          .map((m) => ({ role: m.role, text: m.text }));
        const briefing = buildAgentBriefing({
          customerName: customer?.name ?? "Unknown",
          issue,
          turns,
        });
        const lastMessages = turns.slice(-4).map((m) => {
          const who = m.role === "user" ? "Customer" : "Bot";
          return `${who}: ${m.text.slice(0, 90)}`;
        });
        const packet: AgentHandoffPacket = {
          channel: "online_chat",
          reference: `TK-CHAT-${Date.now().toString().slice(-6)}`,
          customerName: customer?.name ?? "Unknown",
          msisdn: customer?.sim.msisdn ?? "",
          accountNumber: customer?.accountNumber ?? "—",
          plan: customer?.currentPlanName ?? "—",
          page:
            typeof window !== "undefined" ? window.location.pathname : "/",
          issue,
          lastMessages,
          summary: briefing.summary,
          requestedAction: briefing.requestedAction,
          crmNotes: [
            customer?.deviceProfile
              ? `Device ${customer.deviceProfile.currentDevice} · ${customer.deviceProfile.deviceAgeMonths} mo · propensity ${customer.deviceProfile.upgradePropensity}%`
              : "No handset CRM",
            customer?.marketingEligible
              ? "Tag: TikTok / adjacent SKU upsell"
              : "Tag: no data-bundle upsell",
            customer?.id === "thabo"
              ? "NBO path: DEVICE_UPGRADE"
              : customer?.id === "sipho"
                ? "NBO path: incremental_upsell"
                : "Journey: SIM / billing",
          ],
        };
        setAgentHandoff(packet);
        setProactiveOpen(false);
        setChatOpen(true);
        setMessages((prev) => [
          ...prev,
          {
            id: `u_${Date.now()}`,
            role: "user",
            text: "Chat with an online agent",
          },
          {
            id: `b_${Date.now()}`,
            role: "bot",
            text: `I've summarised this chat for the agent so they can pick up where we left off. Reference ${packet.reference}.`,
            verifiedOk: true,
            okBadge: "Ready for agent",
            agentBrief: {
              reference: packet.reference,
              summary: packet.summary,
              requestedAction: packet.requestedAction,
              lastTurns: packet.lastMessages,
            },
            choices: [
              {
                id: "open-help-again",
                label: "Open Vodacom Get Help",
                action: "handoff_open_chat",
                payload: issue,
                variant: "ghost",
              },
            ],
          },
        ]);
        return;
      }
      if (action === "offer_callback") {
        const reason = payload || "General enquiry";
        setMessages((prev) => [
          ...prev,
          {
            id: `u_${Date.now()}`,
            role: "user",
            text: "Yes — please call me back",
          },
          {
            id: `h_${Date.now()}`,
            role: "bot",
            text: "Sure — pick a preferred time and confirm the number we'll call.",
            callbackForm: {
              reason,
              defaultNumber: customer?.sim?.msisdn
                ? `+27 ${customer.sim.msisdn.replace(/^0/, "").replace(/(\d{2})(\d{3})(\d{4})/, "$1 $2 $3")}`
                : "",
            },
          },
        ]);
        return;
      }
      if (action === "care_number_ack") {
        setMessages((prev) => [
          ...prev,
          {
            id: `u_${Date.now()}`,
            role: "user",
            text: `I'll call ${payload || VODACOM_CARE_PHONE}`,
          },
          {
            id: `b_${Date.now()}`,
            role: "bot",
            text: `You can reach Vodacom Customer Care on ${payload || VODACOM_CARE_PHONE} (24/7). I'm here if you need anything else.`,
          },
        ]);
        return;
      }
      if (action === "submit_callback" && payload) {
        let parsed: {
          reason?: string;
          preferredTime?: string;
          contactNumber?: string;
        } = {};
        try {
          parsed = JSON.parse(payload) as typeof parsed;
        } catch {
          parsed = {};
        }
        const timeLabel =
          parsed.preferredTime === "14-16"
            ? "Today 14:00 – 16:00"
            : parsed.preferredTime === "16-18"
              ? "Today 16:00 – 18:00"
              : "As soon as possible";
        setMessages((prev) => [
          ...prev,
          {
            id: `u_${Date.now()}`,
            role: "user",
            text: "Request callback",
          },
          {
            id: `b_${Date.now()}`,
            role: "bot",
            text: `Callback booked.\n\nReason: ${parsed.reason || "Enquiry"}\nPreferred time: ${timeLabel}\nWe'll call: ${parsed.contactNumber || "your number"}\n\nReference: CB-${Date.now().toString().slice(-6)}`,
          },
        ]);
        return;
      }
      if (action === "sim_find_store" || action === "open_store_locator") {
        const stores = nearbyCollectionStores();
        setMessages((prev) => [
          ...prev,
          {
            id: `u_${Date.now()}`,
            role: "user",
            text: "Find a Vodacom Store",
          },
          {
            id: `b_${Date.now()}`,
            role: "bot",
            text: `Here are nearby stores. Pick one so I can brief that branch — we can't take payment on a lost SIM (no OTP).`,
            storePick: true,
            nearbyStores: stores,
            choices: stores.map((s) => ({
              id: s.id,
              label: `Collect at ${s.name.replace(/^Vodacom\s+/i, "")}`,
              meta:
                typeof s.distanceKm === "number"
                  ? `${s.distanceKm} km · ${s.address}`
                  : s.address,
              action: "sim_store",
              payload: s.id,
            })),
          },
        ]);
        if (!simState?.locked) {
          setSimState((s) => (s ? { ...s, step: "locate" } : s));
        }
        return;
      }
      if (action === "sim_store_continue") {
        const stores = nearbyCollectionStores();
        setMessages((prev) => [
          ...prev,
          {
            id: `u_${Date.now()}`,
            role: "user",
            text: "I've chosen a store — continue",
          },
          {
            id: `b_${Date.now()}`,
            role: "bot",
            text: "Which store? I need the branch name so staff get your file.",
            nearbyStores: stores,
            choices: stores.map((s) => ({
              id: s.id,
              label: `Collect at ${s.name.replace(/^Vodacom\s+/i, "")}`,
              action: "sim_store",
              payload: s.id,
            })),
          },
        ]);
        return;
      }
      if (action === "sim_book_store") {
        setSimState((s) => (s ? { ...s, fulfillMode: "store" } : s));
        setMessages((prev) => [
          ...prev,
          { id: `u_${Date.now()}`, role: "user", text: "Book a store visit" },
          {
            id: `b_${Date.now()}`,
            role: "bot",
            text: "To find the branch closest to you, may I use your current location? I'll only use it to rank nearby stores.",
            choices: [
              {
                id: "geo-share",
                label: "Share my location",
                meta: "Nearest branches, ranked by distance",
                action: "sim_geo",
                variant: "primary",
              },
              {
                id: "geo-refuse",
                label: "Rather not share",
                meta: "Browse the Vodacom store finder instead",
                action: "sim_self_serve",
                payload: "geo_refuse",
                variant: "ghost",
              },
            ],
          },
        ]);
        return;
      }
      if (action === "sim_self_serve") {
        setSimState((s) => (s ? { ...s, fulfillMode: "self_serve" } : s));
        setMessages((prev) => [
          ...prev,
          {
            id: `u_${Date.now()}`,
            role: "user",
            text:
              payload === "geo_refuse"
                ? "Rather not share my location"
                : "I'll go later on my own",
          },
          {
            id: `b_${Date.now()}`,
            role: "bot",
            text: "No problem. Your verification is saved — bring your ID to any Vodacom store and pay at the counter (no OTP needed). You can browse all branches and hours on the official store finder.",
            choices: [
              {
                id: "store-locator",
                label: "Open Vodacom store finder",
                meta: "vodacom.co.za/find-a-store",
                action: "open_store_locator",
                variant: "primary",
              },
            ],
          },
        ]);
        return;
      }
      if (action === "sim_geo" || action === "sim_geo_fail" || action === "sim_locate_type") {
        if (action === "sim_geo_fail") {
          // Browser denied / unavailable → fall back to the official finder
          setMessages((prev) => [
            ...prev,
            {
              id: `b_${Date.now()}`,
              role: "bot",
              text: "I couldn't get your location. No problem — browse all Vodacom stores on the official store finder, or type an area name and I'll suggest branches.",
              choices: [
                {
                  id: "store-locator",
                  label: "Open Vodacom store finder",
                  meta: "vodacom.co.za/find-a-store",
                  action: "open_store_locator",
                  variant: "primary",
                },
              ],
            },
          ]);
          return;
        }
        let stores = nearbyCollectionStores();
        if (action === "sim_geo" && payload) {
          const [lat, lng] = payload.split(",").map(Number);
          if (Number.isFinite(lat) && Number.isFinite(lng)) {
            stores = rankStoresByLocation(lat, lng, 4);
            setSimState((s) => (s ? { ...s, userLat: lat, userLng: lng } : s));
          }
        }
        setMessages((prev) => [
          ...prev,
          ...(action === "sim_geo"
            ? [
                {
                  id: `u_${Date.now()}`,
                  role: "user" as const,
                  text: "Share my location",
                },
              ]
            : []),
          {
            id: `b_${Date.now()}`,
            role: "bot",
            text: "Here are the branches nearest to you. Pick one so I can brief that branch before you arrive.",
            storePick: true,
            nearbyStores: stores,
            choices: stores.map((s) => ({
              id: s.id,
              label: `Collect at ${s.name.replace(/^Vodacom\s+/i, "")}`,
              meta:
                typeof s.distanceKm === "number"
                  ? `${s.distanceKm} km · ${s.address}`
                  : s.address,
              action: "sim_store",
              payload: s.id,
            })),
          },
        ]);
        return;
      }
      if (action === "sim_store" && payload) {
        const store = SIM_STORES.find((s) => s.id === payload);
        const ref = `SIM-${Date.now().toString().slice(-6)}`;
        const storeName = store?.name ?? payload;
        setMessages((prev) => [
          ...prev,
          {
            id: `u_${Date.now()}`,
            role: "user",
            text: `Collect at ${storeName}`,
          },
          {
            id: `b_${Date.now()}`,
            role: "bot",
            text: `I've handed your SIM replacement to ${storeName}.\n\nStaff there already have your verified details. Bring your ID and quote the reference — they'll deactivate the lost SIM and issue a new one on the spot. Any store fee is paid at the counter (no OTP needed).`,
            storeHandoff: {
              storeName,
              address: store?.address ?? "",
              reference: ref,
            },
            verifiedOk: true,
            okBadge: `Handed to ${storeName.replace(/^Vodacom\s+/i, "")}`,
          },
        ]);
        setSimState((s) =>
          s
            ? {
                ...s,
                step: "done",
                fulfillMode: "store",
                storeId: payload,
                paid: false,
              }
            : s,
        );
        return;
      }
      if (action === "sim_delivery") {
        setMessages((prev) => [
          ...prev,
          {
            id: `b_${Date.now()}`,
            role: "bot",
            text: "Courier delivery isn't available yet. Please choose a nearby store so I can brief that branch.",
          },
        ]);
        return;
      }
      if (action === "sim_retry") {
        setSimState((s) =>
          s
            ? {
                ...s,
                step: "security",
                lastRechargeDate: "",
                lastRechargeAmount: "",
                lastCalledNumber: "",
              }
            : s,
        );
        setMessages((prev) => [
          ...prev,
          {
            id: `b_${Date.now()}`,
            role: "bot",
            text: "Let's retry security questions. Confirm your last recharge date below.",
            inputWidget: { kind: "date", prefill: "" },
          },
        ]);
      }
    },
    [
      applyBundleGuide,
      customer,
      deviceNbo,
      messages,
      simFailCount,
      simState,
      startBillingAssist,
      startCoverageCheck,
      askCoverageAddress,
      runCoverageCheck,
      coverageState,
      seedChatMenu,
      startDeviceUpgrade,
      startSimSelfCare,
      agentDeskOpen,
    ],
  );

    const completePayment = useCallback(
    async (paymentId: string) => {
      setCheckoutBusy(true);
      try {
        const res = await apiFetch("/api/payment/status", {
          method: "POST",
          body: JSON.stringify({ paymentId }),
        }).then((r) => r.json());
        setLastReceipt(res.receipt ?? null);
        if (res.customer) setCustomer(res.customer);
        setMessages((prev) => [
          ...prev,
          {
            id: `ok_${Date.now()}`,
            role: "bot",
            text: `Purchase confirmed. Your plan is now ${res.product?.name ?? "updated"}. Receipt ${res.receipt?.id ?? ""}.`,
          },
        ]);
        await refresh();
      } finally {
        setCheckoutBusy(false);
      }
    },
    [refresh],
  );

  const value = useMemo(
    () => ({
      customer,
      products,
      usage,
      aggregate,
      journey,
      chatOpen,
      proactiveOpen,
      proactiveMessage,
      recommendation,
      recommendedProduct,
      messages,
      setMessages,
      showTechnical,
      checkoutBusy,
      lastReceipt,
      refresh,
      selectCustomer,
      resetJourney,
      fastForward,
      track,
      acceptProactive,
      dismissProactive,
      openChat,
      closeChat,
      setShowTechnical,
      startCheckout,
      purchaseInChat,
      completePayment,
      notifyPortalEvent,
      fastForwardWhatsApp,
      fastForwardTikTok,
      applyBundleGuide,
      portalShelfHint,
      clearPortalShelfHint,
      portalSelection,
      setPortalSelection,
      guidedBundleId,
      summerDealsOfferHint,
      clearSummerDealsOfferHint,
      startSimSelfCare,
      startBillingAssist,
      seedChatMenu,
      startCoverageCheck,
      submitCoverageAddress,
      proposeCoverageLocation,
      proposeCoverageByCoords,
      coverageGeoFailed,
      adjustCoverageLocation,
      handleChatAction,
      advanceSimChat,
      completeSimDocs,
      simFailCount,
      simActive: Boolean(
        simState &&
          !simState.locked &&
          simState.step !== "done" &&
          simState.step !== "idle",
      ),
      simState,
      deviceNbo,
      startDeviceUpgrade,
      agentHandoff,
      coverageState,
      coverageActive:
        coverageState.step === "ask_location" ||
        coverageState.step === "location_entered" ||
        coverageState.step === "location_confirmed" ||
        coverageState.step === "checking",
      clockPreset,
      setClockPreset,
      demoNow,
      agentDeskOpen,
    }),
    [
      customer,
      products,
      usage,
      aggregate,
      journey,
      chatOpen,
      proactiveOpen,
      proactiveMessage,
      recommendation,
      recommendedProduct,
      messages,
      showTechnical,
      checkoutBusy,
      lastReceipt,
      refresh,
      selectCustomer,
      resetJourney,
      fastForward,
      fastForwardWhatsApp,
      fastForwardTikTok,
      track,
      acceptProactive,
      dismissProactive,
      openChat,
      closeChat,
      startCheckout,
      purchaseInChat,
      completePayment,
      notifyPortalEvent,
      applyBundleGuide,
      portalShelfHint,
      clearPortalShelfHint,
      portalSelection,
      setPortalSelection,
      guidedBundleId,
      summerDealsOfferHint,
      clearSummerDealsOfferHint,
      startSimSelfCare,
      startBillingAssist,
      seedChatMenu,
      startCoverageCheck,
      submitCoverageAddress,
      proposeCoverageLocation,
      proposeCoverageByCoords,
      coverageGeoFailed,
      adjustCoverageLocation,
      handleChatAction,
      advanceSimChat,
      completeSimDocs,
      simFailCount,
      simState,
      deviceNbo,
      startDeviceUpgrade,
      agentHandoff,
      coverageState,
      clockPreset,
      demoNow,
      agentDeskOpen,
    ],
  );

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo() {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error("useDemo must be used within DemoProvider");
  return ctx;
}
