import type { Customer } from "@/types";
import type { BehaviorAggregate } from "@/types";
import type { CoverageState } from "@/lib/coverage/types";
import { VODACOM_COVERAGE_MAP_URL } from "@/lib/coverage/types";
import type { SimState } from "@/lib/sim/flow";
import { SIM_STORES } from "@/lib/sim/stores";
import type {
  AgentHandoffPacket,
  ChatMessage,
  DeviceNboView,
} from "@/hooks/useDemo";
import { getLatestInvoice, SHEN_LTE_AVG } from "@/data/billing";
import { HUAWEI_NOVA_Y74 } from "@/data/devices/nbo";
import { formatSastClock } from "@/lib/care/hours";
import { TOPUP_BUNDLES, type TopUpBundle } from "@/components/sites/qr-telkom-co-za-50a80143/shared/catalog";
import { findAdjacentUpgrade } from "@/lib/marketing/rules";

/** One sidebar framework — every scenario maps onto these six stages. */
export type WfState = "pending" | "active" | "done";

export type WfRow = {
  label: string;
  value: string;
  tone?: "default" | "good" | "bad" | "mono";
};

export type WfStep = {
  key: string;
  /** Stage tag, e.g. Understand / Retrieve / Analyse / Decide / Act / Handover */
  stage: string;
  title: string;
  state: WfState;
  /** Decision details live inside the step they belong to. */
  rows?: WfRow[];
  note?: string;
};

export type ScenarioId =
  | "topup"
  | "device"
  | "sim"
  | "billing"
  | "coverage"
  | "handoff";

export type ScenarioWorkflow = {
  id: ScenarioId | null;
  title: string;
  steps: WfStep[];
};

export type WorkflowCtx = {
  customer: Customer | null;
  messages: ChatMessage[];
  simState: SimState | null;
  simFailCount: number;
  deviceNbo: DeviceNboView | null;
  agentHandoff: AgentHandoffPacket | null;
  agentDeskOpen: boolean;
  coverageState: CoverageState;
  demoNow: Date;
  /** Current route — lets the workflow show page-entry background work. */
  pathname?: string;
  aggregate?: BehaviorAggregate | null;
  /** Live mirror of the bundle selected on the top-up page (page-reported). */
  portalSelection?: TopUpBundle | null;
  /** Last chat-guided bundle — persists after guide messages are cleared. */
  guidedBundleId?: string | null;
};

/** The customer is browsing the online top-up page (no QR portal in this demo). */
function onTopUpPage(pathname?: string): boolean {
  if (!pathname) return false;
  return (
    pathname.startsWith("/qr_portal/top-up") ||
    pathname.startsWith("/monice")
  );
}

/** Walk messages from the end — the latest scenario marker wins. */
export function detectScenario(ctx: WorkflowCtx): ScenarioId | null {
  const { messages, coverageState, simState, deviceNbo, agentHandoff } = ctx;
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m.agentBrief) return "handoff";
    if (
      m.coverageResult ||
      m.coverageChecking ||
      m.coverageFallback ||
      m.locationCard ||
      m.locationInput
    )
      return "coverage";
    if (
      m.uploadCard ||
      m.uploadedFile ||
      m.verifyProgress ||
      m.verifyResult ||
      m.attemptBadge ||
      m.simManual ||
      m.nearbyStores ||
      m.storePick ||
      m.storeHandoff ||
      m.paySim ||
      m.inputWidget
    )
      return "sim";
    // NOTE: verifiedOk is deliberately NOT a SIM marker — the device NBO
    // "See this deal" reply also uses it for its green badge.
    if (
      m.showDataUsageChart ||
      m.id.startsWith("bill_") ||
      m.choices?.some((c) => c.action?.startsWith("bill_"))
    )
      return "billing";
    if (m.deviceDeal) return "device";
    if (m.upsell || m.showUsagePie || m.guideBundleId) return "topup";
  }
  // State-machine fallback for the moment before the first card renders.
  if (coverageState.step !== "idle") return "coverage";
  if (simState && simState.step !== "idle") return "sim";
  if (deviceNbo) return "device";
  if (agentHandoff) return "handoff";
  // Page-entry fallback: the moment the customer lands on the top-up page the
  // background pipeline starts, even before any chat message exists.
  if (onTopUpPage(ctx.pathname)) {
    return ctx.customer?.deviceProfile ? "device" : "topup";
  }
  return null;
}

/* ---------------------------------- idle ---------------------------------- */

function idleWorkflow(): ScenarioWorkflow {
  const s = (stage: string, title: string, note: string): WfStep => ({
    key: stage,
    stage,
    title,
    state: "pending",
    note,
  });
  return {
    id: null,
    title: "Assistant workflow",
    steps: [
      s("Understand", "Intent from text, voice or page event", "LLM collects intent only — never guesses facts"),
      s("Retrieve", "Profile, plan, usage, invoice, CRM", "Mock CRM in demo · swap-ready for real services"),
      s("Analyse / Verify", "Usage mix · KYC match · coverage flags", "Deterministic checks decide, not the model"),
      s("Decide", "Rules + eligibility", "One marketing logic per persona — never mixed"),
      s("Act", "Card, guide or offer in chat", "Checkout and payment stay on official Vodacom pages"),
      s("Handover", "Official page or agent brief", "Summary + requested action · no auto-jump"),
    ],
  };
}

/* --------------------------------- top-up --------------------------------- */

function topupWorkflow(ctx: WorkflowCtx): ScenarioWorkflow {
  const { customer, messages, aggregate, pathname } = ctx;
  const upsell = [...messages].reverse().find((m) => m.upsell)?.upsell;
  const hasPie = messages.some((m) => m.showUsagePie);
  // Guided stays latched even after applyBundleGuide clears the chat messages.
  const guided =
    messages.some((m) => m.guideBundleId) || Boolean(ctx.guidedBundleId);
  const onPage = onTopUpPage(pathname) || Boolean(upsell || hasPie || guided);
  const loggedIn = Boolean(ctx.aggregate?.portalLoggedIn);
  const started = loggedIn || Boolean(upsell || hasPie || guided);

  // The bundle currently selected on the page — reported live by the page
  // itself, so the panel can never disagree with what the customer sees.
  // Fallback: last *bundle* id in the behaviour stream (product_view events
  // carry product names, so filter them out).
  const aggViewedId = aggregate?.productsViewed
    .filter((id) => TOPUP_BUNDLES.some((b) => b.id === id))
    .at(-1);
  const viewed =
    ctx.portalSelection ??
    (aggViewedId != null
      ? TOPUP_BUNDLES.find((b) => b.id === aggViewedId) ?? null
      : null);
  const adjacent = viewed
    ? findAdjacentUpgrade(
        viewed,
        TOPUP_BUNDLES.filter(
          (b) => b.product === viewed.product && b.type === viewed.type,
        ),
      )
    : null;

  return {
    id: "topup",
    title: "Top-up upgrade",
    steps: [
      {
        key: "understand",
        stage: "Understand",
        title: "Customer lands on top-up page",
        state: started ? "done" : onPage ? "active" : "pending",
        rows: started
          ? [{ label: "Page", value: pathname ?? "/qr_portal/top-up/data", tone: "mono" }]
          : undefined,
        note: started
          ? "Mobile number confirmed — customer session started"
          : onPage
            ? "Waiting for the customer to enter a mobile number and tap Next"
            : "Waiting for the customer to open the top-up page",
      },
      {
        key: "retrieve",
        stage: "Retrieve",
        title: "Plan + usage profile",
        state: started ? "done" : "pending",
        rows:
          started && customer
            ? [
                { label: "Plan", value: customer.currentPlanName },
                { label: "Avg usage", value: `${customer.averageDataUsageGb} GB / mo` },
                { label: "OOB spend", value: `R${customer.outOfBundleSpend}` },
              ]
            : undefined,
        note: started ? "CRM profile loaded after login" : undefined,
      },
      {
        key: "analyse",
        stage: "Analyse",
        title: "App usage mix",
        state: started ? (hasPie || upsell || viewed ? "done" : "active") : "pending",
        rows:
          started && customer
            ? [
                {
                  label: "TikTok share",
                  value: `${customer.appMix.tiktokPct}%`,
                  tone: "good",
                },
              ]
            : undefined,
        note:
          started && !(hasPie || upsell || viewed)
            ? "Analysing usage while the customer browses"
            : undefined,
      },
      {
        key: "decide",
        stage: "Decide",
        title: "Adjacent SKU on same shelf",
        state: upsell ? "done" : viewed ? "active" : started ? "active" : "pending",
        rows: upsell
          ? [
              {
                label: "Selected",
                value: `${upsell.selectedLabel} · R${upsell.selectedPrice}`,
              },
              {
                label: "Upgrade",
                value: `${upsell.upgradeLabel} · R${upsell.upgradePrice} (+R${upsell.deltaPrice})`,
                tone: "good",
              },
            ]
          : viewed
            ? [
                {
                  label: "Selected",
                  value: `${viewed.volume} · R${viewed.price.toFixed(2)}`,
                },
                ...(adjacent
                  ? [
                      {
                        label: "Adjacent candidate",
                        value: `${adjacent.volume} · R${adjacent.price.toFixed(2)} (+R${(adjacent.price - viewed.price).toFixed(2)})`,
                        tone: "good" as const,
                      },
                    ]
                  : []),
              ]
            : undefined,
        note:
          !upsell && !viewed && started
            ? "Ready — tap a bundle on the page and the adjacent SKU is computed on click"
            : undefined,
      },
      {
        key: "act",
        stage: "Act",
        title: "Guide selection on the page",
        state: guided ? "done" : upsell ? "active" : "pending",
        note: "Chat highlights the SKU on the top-up page — guide-only",
      },
      {
        key: "handover",
        stage: "Handover",
        title: "Pay on the top-up page",
        state: guided ? "active" : "pending",
        note: "No payment inside chat",
      },
    ],
  };
}

/* --------------------------------- device --------------------------------- */

function deviceWorkflow(ctx: WorkflowCtx): ScenarioWorkflow {
  const { customer, deviceNbo, pathname } = ctx;
  const device = customer?.deviceProfile;
  const status = deviceNbo?.status;
  const onPage = onTopUpPage(pathname) || Boolean(deviceNbo);
  const loggedIn = Boolean(ctx.aggregate?.portalLoggedIn) || Boolean(deviceNbo);
  const offerState: WfState =
    status === "accepted" || status === "data_only" || status === "declined"
      ? "done"
      : deviceNbo
        ? "active"
        : "pending";
  return {
    id: "device",
    title: "Device next best offer",
    steps: [
      {
        key: "understand",
        stage: "Understand",
        title: "Purchase intent",
        state: deviceNbo ? "done" : loggedIn || onPage ? "active" : "pending",
        rows: deviceNbo
          ? [{ label: "Event", value: "Buy data", tone: "mono" }]
          : undefined,
        note:
          !deviceNbo && loggedIn
            ? "Customer is logged in — waiting for the Data selection"
            : !deviceNbo && onPage
            ? "Waiting for the customer to enter a mobile number and tap Next"
            : undefined,
      },
      {
        key: "retrieve",
        stage: "Retrieve",
        title: "Customer profile + device CRM",
        state: loggedIn ? "done" : "pending",
        rows:
          loggedIn && customer
            ? [
                { label: "Customer", value: customer.name },
                { label: "Plan", value: customer.currentPlanName },
              ]
            : undefined,
        note: loggedIn ? "Loaded after mobile-number login" : undefined,
      },
      {
        key: "analyse",
        stage: "Analyse",
        title: "Tenure + device + usage",
        state: device && loggedIn ? "done" : "pending",
        rows:
          device && loggedIn
            ? [
                { label: "Tenure", value: `${device.tenureMonths} months` },
                { label: "Device", value: `${device.currentDevice} · ${device.deviceAgeMonths} mo` },
                { label: "Data usage", value: device.dataUsageBand, tone: "good" },
              ]
            : undefined,
      },
      {
        key: "score",
        stage: "Analyse",
        title: "Upgrade propensity",
        state: device && loggedIn ? "done" : "pending",
        rows:
          device && loggedIn
            ? [
                { label: "Propensity", value: `${device.upgradePropensity}%`, tone: "good" },
                { label: "Brand affinity", value: device.brandAffinity },
              ]
            : undefined,
      },
      {
        key: "match",
        stage: "Decide",
        title: "Match product catalogue",
        state: device && loggedIn ? "done" : "pending",
        rows:
          device && loggedIn
            ? [
                {
                  label: HUAWEI_NOVA_Y74.name,
                  value: `R${HUAWEI_NOVA_Y74.monthlyRand} × ${HUAWEI_NOVA_Y74.termMonths}`,
                  tone: "good",
                },
              ]
            : undefined,
        note:
          device && loggedIn && !deviceNbo
            ? "Offer pre-computed — fires the moment the customer shows purchase intent"
            : undefined,
      },
      {
        key: "act",
        stage: "Act",
        title: "Show personalised offer",
        state: offerState,
        rows: deviceNbo
          ? [{ label: "Status", value: status!.replaceAll("_", " "), tone: "mono" }]
          : undefined,
        note: "Opens the official Vodacom device page — never mixed with SKU upsell",
      },
    ],
  };
}

/* ----------------------------------- sim ----------------------------------- */

const SIM_STAGE: Record<string, number> = {
  capture: 1,
  docs: 1,
  suspend_only: 1,
  verify: 2,
  security: 3,
  locate: 4,
  fulfill: 4,
  pay: 4,
  done: 6,
  locked: 3,
};

function simWorkflow(ctx: WorkflowCtx): ScenarioWorkflow {
  const { simState, simFailCount } = ctx;
  const cur = simState ? (SIM_STAGE[simState.step] ?? 0) : 0;
  const at = (i: number): WfState =>
    simState?.step === "done" || cur > i
      ? "done"
      : cur === i
        ? "active"
        : "pending";
  const store = simState?.storeId
    ? SIM_STORES.find((s) => s.id === simState.storeId)?.name
    : null;
  const docs =
    (simState?.idDocDataUrl ? 1 : 0) + (simState?.porDocDataUrl ? 1 : 0);
  return {
    id: "sim",
    title: "SIM self-care",
    steps: [
      {
        key: "understand",
        stage: "Understand",
        title: "SIM request",
        state: "done",
        note: simState?.suspendOnly
          ? "Suspend / block SIM"
          : "Lost or damaged SIM replacement",
      },
      {
        key: "capture",
        stage: "Retrieve",
        title: "Capture MSISDN + documents",
        state: at(1),
        rows: [
          ...(simState?.msisdn
            ? [{ label: "MSISDN", value: simState.msisdn, tone: "mono" as const }]
            : []),
          { label: "Documents", value: `${docs}/2 uploaded` },
        ],
      },
      {
        key: "verify",
        stage: "Analyse",
        title: "Vision match vs CRM docs",
        state: at(2),
        rows: [
          ...(simState?.visionSummary
            ? [{ label: "Vision", value: simState.visionSummary }]
            : []),
          {
            label: "Attempts",
            value: `${simFailCount}/3`,
            tone: simFailCount > 0 ? ("bad" as const) : ("default" as const),
          },
        ],
        note:
          simState?.step === "locked"
            ? "Locked after failed attempts — routed to a store"
            : undefined,
      },
      {
        key: "security",
        stage: "Verify",
        title: "Security answers vs CRM",
        state: at(3),
        note: "Last recharge date · amount · last number called",
      },
      {
        key: "fulfil",
        stage: "Decide",
        title: "Fulfilment — nearest store",
        state: at(4),
        rows: store ? [{ label: "Store", value: store, tone: "good" }] : undefined,
      },
      {
        key: "handover",
        stage: "Handover",
        title: "Store staff brief",
        state: at(5),
        note: "Bring your ID · pay at counter · no OTP or payment in chat",
      },
    ],
  };
}

/* --------------------------------- billing --------------------------------- */

function billingWorkflow(ctx: WorkflowCtx): ScenarioWorkflow {
  const { messages } = ctx;
  const inv = getLatestInvoice("shen");
  const explained = messages.some((m) => m.showDataUsageChart);
  const upgraded = messages.some((m) =>
    m.text.includes("opening Vodacom's official data plan page"),
  );
  const saving = Math.max(0, Math.round(SHEN_LTE_AVG - 349));
  return {
    id: "billing",
    title: "Billing intelligence",
    steps: [
      {
        key: "understand",
        stage: "Understand",
        title: "Bill question",
        state: "done",
        rows: [{ label: "Intent", value: "BILLING · explain", tone: "mono" }],
      },
      {
        key: "read",
        stage: "Read",
        title: "Read invoice",
        state: "done",
        rows: inv
          ? [
              { label: "Invoice", value: inv.id, tone: "mono" },
              { label: "Total due", value: `R${inv.totalDue.toFixed(2)}` },
            ]
          : undefined,
      },
      {
        key: "retrieve",
        stage: "Retrieve",
        title: "Billing + usage history",
        state: "done",
        rows: [
          { label: "Data charges", value: "Aug–Oct 2026" },
          { label: "3-mo average", value: `≈ R${SHEN_LTE_AVG.toFixed(2)} / mo` },
        ],
      },
      {
        key: "analyse",
        stage: "Analyse",
        title: "Analyse charges vs plan",
        state: explained ? "done" : "active",
        rows: explained
          ? [
              {
                label: "Avg charge vs plan fee",
                value: `R${SHEN_LTE_AVG.toFixed(0)} > R349`,
                tone: "bad",
              },
            ]
          : undefined,
        note: explained
          ? undefined
          : "Waiting for “Yes, explain my bill”",
      },
      {
        key: "decide",
        stage: "Decide",
        title: "Plan-fit decision",
        state: explained ? "done" : "pending",
        rows: explained
          ? [
              { label: "Current", value: "20GB · R229 + top-ups" },
              { label: "Fit", value: `50GB · R349 (save ~R${saving})`, tone: "good" },
            ]
          : undefined,
      },
      {
        key: "act",
        stage: "Act",
        title: "Recommend action",
        state: upgraded ? "done" : explained ? "active" : "pending",
        note: upgraded
          ? "Opened official Vodacom 50GB plan page"
          : "Offer: Upgrade to 50GB monthly data · payment stays with Vodacom",
      },
    ],
  };
}

/* --------------------------------- coverage -------------------------------- */

const COV_STAGE: Record<string, number> = {
  ask_location: 1,
  location_entered: 1,
  location_confirmed: 2,
  checking: 2,
  available: 6,
  complex: 6,
  error: 3,
};

function coverageWorkflow(ctx: WorkflowCtx): ScenarioWorkflow {
  const { coverageState: cov } = ctx;
  const cur = COV_STAGE[cov.step] ?? 0;
  const loc = cov.location;
  const c = cov.result?.coverage;
  const complex = cov.step === "complex";
  const errored = cov.step === "error";
  const avail = cov.step === "available";
  return {
    id: "coverage",
    title: "Coverage check",
    steps: [
      {
        key: "understand",
        stage: "Understand",
        title: "Location intent",
        state: "done",
        rows: [
          {
            label: "Focus",
            value: cov.focus === "any" ? "5G / LTE / Fibre" : cov.focus.toUpperCase(),
            tone: "mono",
          },
        ],
      },
      {
        key: "resolve",
        stage: "Resolve",
        title: "Resolve address",
        state: loc ? (cur > 1 ? "done" : "active") : cur === 1 ? "active" : "pending",
        rows: loc
          ? [
              { label: "Address", value: loc.line1 },
              { label: "Area", value: `${loc.suburb}, ${loc.city}` },
            ]
          : undefined,
      },
      {
        key: "query",
        stage: "Query",
        title: "Query coverage API",
        state:
          cov.step === "checking"
            ? "active"
            : avail || complex || errored
              ? "done"
              : "pending",
        rows: [
          { label: "GET", value: "/api/coverage/check", tone: "mono" },
          {
            label: "Source",
            value:
              cov.result?.source === "live"
                ? "Vodacom GIS (live)"
                : cov.result
                  ? "Demo scenario"
                  : "Vodacom GIS · mock fallback",
            tone: cov.result?.source === "live" ? "good" : "default",
          },
        ],
        note: errored ? "API error — retry or official map" : undefined,
      },
      {
        key: "evaluate",
        stage: "Analyse",
        title: "Evaluate 5G / LTE / Fibre",
        state: avail ? "done" : complex ? "active" : "pending",
        rows:
          avail && c
            ? [
                { label: "5G", value: c["5g"] ? "Available" : "Not available", tone: c["5g"] ? "good" : "bad" },
                { label: "4G / LTE", value: c.lte || c["4g"] ? "Available" : "Not available", tone: c.lte || c["4g"] ? "good" : "bad" },
                { label: "Fibre", value: c.fibre ? "Available" : "Not available", tone: c.fibre ? "good" : "bad" },
              ]
            : undefined,
        note: complex
          ? "Complex address — the API cannot decide here"
          : "Availability comes from the API, never the LLM",
      },
      {
        key: "decide",
        stage: "Decide",
        title: "Recommend option",
        state: avail ? "done" : complex ? "active" : "pending",
        note: avail
          ? "Show available connectivity options"
          : complex
            ? "Hand off to the official checker"
            : undefined,
      },
      {
        key: "handover",
        stage: "Handover",
        title: "Open Vodacom journey",
        state: avail || complex ? "done" : "pending",
        rows:
          avail || complex
            ? [{ label: "URL", value: VODACOM_COVERAGE_MAP_URL.replace("https://www.", ""), tone: "mono" }]
            : undefined,
      },
    ],
  };
}

/* --------------------------------- handoff --------------------------------- */

function handoffWorkflow(ctx: WorkflowCtx): ScenarioWorkflow {
  const { agentHandoff: h, agentDeskOpen, demoNow } = ctx;
  return {
    id: "handoff",
    title: "Human handoff",
    steps: [
      {
        key: "understand",
        stage: "Understand",
        title: "Issue",
        state: "done",
        rows: h ? [{ label: "Issue", value: h.issue }] : undefined,
      },
      {
        key: "retrieve",
        stage: "Retrieve",
        title: "Customer context",
        state: "done",
        rows: h
          ? [
              { label: "Customer", value: h.customerName },
              { label: "MSISDN", value: h.msisdn, tone: "mono" },
              { label: "Plan", value: h.plan },
              { label: "Page", value: h.page, tone: "mono" },
            ]
          : undefined,
      },
      {
        key: "classify",
        stage: "Analyse",
        title: "Classify issue",
        state: "done",
        rows: h?.summary ? [{ label: "Summary", value: h.summary }] : undefined,
      },
      {
        key: "availability",
        stage: "Verify",
        title: "Check service availability",
        state: "done",
        rows: [
          {
            label: "Agent desk",
            value: agentDeskOpen ? "Open" : "Closed",
            tone: agentDeskOpen ? "good" : "bad",
          },
          { label: "SAST", value: formatSastClock(demoNow), tone: "mono" },
        ],
      },
      {
        key: "channel",
        stage: "Decide",
        title: "Select channel",
        state: "done",
        rows: h
          ? [{ label: "Channel", value: h.channel.replace("_", " "), tone: "good" }]
          : undefined,
        note: "Online chat only inside desk hours — callback or 081 180 after hours",
      },
      {
        key: "summary",
        stage: "Handover",
        title: "Create handover summary",
        state: "done",
        rows: h
          ? [
              { label: "Reference", value: h.reference, tone: "mono" },
              { label: "Agent should", value: h.requestedAction },
            ]
          : undefined,
        note: "Open Vodacom Get Help stays optional — no auto-jump",
      },
    ],
  };
}

/* --------------------------------- public --------------------------------- */

export function buildWorkflow(ctx: WorkflowCtx): ScenarioWorkflow {
  switch (detectScenario(ctx)) {
    case "topup":
      return topupWorkflow(ctx);
    case "device":
      return deviceWorkflow(ctx);
    case "sim":
      return simWorkflow(ctx);
    case "billing":
      return billingWorkflow(ctx);
    case "coverage":
      return coverageWorkflow(ctx);
    case "handoff":
      return handoffWorkflow(ctx);
    default:
      return idleWorkflow();
  }
}
