import type { Customer } from "@/types";
import { SIM_STORES } from "@/lib/sim/stores";

export type SimStep =
  | "idle"
  | "capture"
  | "docs"
  | "verify"
  | "security"
  | "locate"
  | "fulfill"
  | "pay"
  | "done"
  | "locked"
  | "suspend_only";

export type SimFulfillMode = "store" | "delivery_soon" | "self_serve" | null;

export interface SimState {
  step: SimStep;
  msisdn: string;
  idNumber: string;
  address: string;
  lastRechargeDate: string;
  lastRechargeAmount: string;
  lastCalledNumber: string;
  idDocDataUrl: string | null;
  porDocDataUrl: string | null;
  failCount: number;
  locked: boolean;
  fulfillMode: SimFulfillMode;
  storeId: string | null;
  visionSummary: string | null;
  suspendOnly: boolean;
  paid: boolean;
  userLat: number | null;
  userLng: number | null;
}

export { SIM_STORES };

export function createSimState(suspendOnly = false): SimState {
  return {
    step: "capture",
    msisdn: "",
    idNumber: "",
    address: "",
    lastRechargeDate: "",
    lastRechargeAmount: "",
    lastCalledNumber: "",
    idDocDataUrl: null,
    porDocDataUrl: null,
    failCount: 0,
    locked: false,
    fulfillMode: null,
    storeId: null,
    visionSummary: null,
    suspendOnly,
    paid: false,
    userLat: null,
    userLng: null,
  };
}

export function securityMatches(
  state: SimState,
  customer: Customer,
): { ok: boolean; reasons: string[] } {
  const reasons: string[] = [];
  const a = customer.securityAnswers;
  if (state.lastRechargeDate.trim() !== a.lastRechargeDate) {
    reasons.push(`Last recharge date should be ${a.lastRechargeDate}.`);
  }
  const amt = Number(state.lastRechargeAmount);
  if (!Number.isFinite(amt) || amt !== a.lastRechargeAmount) {
    reasons.push(`Last recharge amount should be R${a.lastRechargeAmount}.`);
  }
  const called = state.lastCalledNumber.replace(/\D/g, "");
  const expected = a.lastCalledNumber.replace(/\D/g, "");
  if (called !== expected) {
    reasons.push(`Last number called should be ${a.lastCalledNumber}.`);
  }
  return { ok: reasons.length === 0, reasons };
}

export function identityMatches(
  state: SimState,
  customer: Customer,
  extracted?: { idNumber?: string; addressHint?: string },
): { ok: boolean; reasons: string[] } {
  const reasons: string[] = [];
  const id = (extracted?.idNumber || state.idNumber).replace(/\s/g, "");
  if (id !== customer.idNumber.replace(/\s/g, "")) {
    reasons.push("ID / passport number does not match Vodacom customer data.");
  }
  const addr = (extracted?.addressHint || state.address).toLowerCase();
  const expected = customer.residentialAddress.toLowerCase();
  const cityToken = expected.split(",").map((s) => s.trim())[1] ?? "";
  if (cityToken && !addr.includes(cityToken.toLowerCase().slice(0, 6))) {
    reasons.push("Residential address does not align with CRM record.");
  }
  const msisdn = state.msisdn.replace(/\D/g, "");
  const crm = customer.sim.msisdn.replace(/\D/g, "");
  if (msisdn && crm && !msisdn.endsWith(crm.slice(-7))) {
    reasons.push("Mobile number does not match the SIM on file.");
  }
  return { ok: reasons.length === 0, reasons };
}
