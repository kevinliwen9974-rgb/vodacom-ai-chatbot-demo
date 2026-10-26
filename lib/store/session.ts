import type {
  BehaviorAggregate,
  BehaviorEvent,
  JourneyStep,
  Order,
  Payment,
} from "@/types";
import { CUSTOMERS, DEFAULT_CUSTOMER_ID } from "@/data/customers";

/** In-memory demo session store (single-process). */

const sessions = new Map<
  string,
  {
    customerId: string;
    events: BehaviorEvent[];
    sessionStartedAt: number;
    showTechnical: boolean;
  }
>();

export const orders = new Map<string, Order>();
export const payments = new Map<string, Payment>();

export function getOrCreateSession(sessionId: string) {
  let s = sessions.get(sessionId);
  if (!s) {
    s = {
      customerId: DEFAULT_CUSTOMER_ID,
      events: [],
      sessionStartedAt: Date.now(),
      showTechnical: false,
    };
    sessions.set(sessionId, s);
  }
  return s;
}

export function resetSession(sessionId: string, customerId?: string) {
  const id = customerId ?? DEFAULT_CUSTOMER_ID;
  // restore Sipho plan if mutated
  if (CUSTOMERS.sipho) {
    CUSTOMERS.sipho.currentPlanId = "DATA-20GB";
    CUSTOMERS.sipho.currentPlanName = "20GB Data";
    CUSTOMERS.sipho.dataBalanceGb = 4.2;
    CUSTOMERS.sipho.airtimeBalance = 48.5;
  }
  sessions.set(sessionId, {
    customerId: id,
    events: [],
    sessionStartedAt: Date.now(),
    showTechnical: sessions.get(sessionId)?.showTechnical ?? false,
  });
  return sessions.get(sessionId)!;
}

export function setCustomer(sessionId: string, customerId: string) {
  const s = getOrCreateSession(sessionId);
  s.customerId = customerId;
  s.events = [];
  s.sessionStartedAt = Date.now();
  return s;
}

export function appendEvent(event: BehaviorEvent) {
  const s = getOrCreateSession(event.sessionId);
  s.events.push(event);
  return s;
}

export function aggregateBehavior(sessionId: string): BehaviorAggregate {
  const s = getOrCreateSession(sessionId);
  const events = s.events;
  const now = Date.now();
  const dwellTimeSec = Math.floor((now - s.sessionStartedAt) / 1000);

  const productsViewed = [
    ...new Set(
      events
        .filter((e) => e.eventType === "product_view" || e.eventType === "product_detail")
        .map((e) => e.productId)
        .filter(Boolean) as string[],
    ),
  ];
  const productsCompared = [
    ...new Set(
      events
        .filter((e) => e.eventType === "product_compare")
        .map((e) => e.productId)
        .filter(Boolean) as string[],
    ),
  ];

  const lastPage =
    [...events].reverse().find((e) => e.eventType === "page_view")?.page ?? "/customer";

  return {
    dwellTimeSec,
    productsViewed,
    productsCompared,
    recentActions: events.slice(-12).map((e) => e.eventType),
    currentPage: lastPage,
    chatOpened: events.some((e) => e.eventType === "chat_open"),
    portalLoggedIn: events.some((e) => e.eventType === "portal_login"),
    checkoutStarted: events.some((e) => e.eventType === "checkout_start"),
    purchaseComplete: events.some((e) => e.eventType === "purchase_complete"),
    fastForwarded: events.some((e) => e.eventType === "fast_forward"),
  };
}

export function shouldTriggerProactive(agg: BehaviorAggregate): boolean {
  if (agg.chatOpened || agg.checkoutStarted || agg.purchaseComplete) return false;
  if (agg.fastForwarded) return true;
  return (
    agg.dwellTimeSec > 20 &&
    agg.productsViewed.length >= 2 &&
    (agg.productsCompared.length >= 1 || agg.productsViewed.length >= 2)
  );
}

export function buildJourneySteps(agg: BehaviorAggregate): JourneyStep[] {
  const intent = shouldTriggerProactive(agg) || agg.chatOpened;
  const rec = agg.chatOpened || agg.checkoutStarted || agg.purchaseComplete;
  return [
    { id: "browsing", label: "Customer browsing", state: "done" },
    { id: "profile_loaded", label: "Customer profile loaded", state: "done" },
    { id: "plan_retrieved", label: "Current plan retrieved", state: "done" },
    { id: "usage_retrieved", label: "Usage history retrieved", state: "done" },
    {
      id: "intent_detected",
      label: "Purchase intent detected",
      state: intent ? "done" : agg.productsViewed.length > 0 ? "active" : "pending",
    },
    {
      id: "ai_recommendation",
      label: "AI recommendation",
      state: rec ? "done" : intent ? "active" : "pending",
    },
    {
      id: "product_catalogue",
      label: "Product catalogue",
      state: agg.checkoutStarted || agg.purchaseComplete ? "done" : rec ? "active" : "pending",
    },
    {
      id: "purchase",
      label: "Purchase",
      state: agg.purchaseComplete ? "done" : agg.checkoutStarted ? "active" : "pending",
    },
  ];
}
