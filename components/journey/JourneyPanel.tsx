"use client";

import { usePathname } from "next/navigation";
import { useDemo } from "@/hooks/useDemo";
import { SIM_STORES } from "@/lib/sim/stores";
import { buildWorkflow } from "@/lib/journey/workflow";
import { WorkflowStepper } from "./WorkflowStepper";

const SCENARIO_TAG: Record<string, string> = {
  topup: "Sipho · commerce intercept",
  device: "Thabo · CRM next best offer",
  sim: "Li Wen · KYC + store handoff",
  billing: "Li Wen · bill to plan",
  coverage: "Any persona · API-decided",
  handoff: "Any persona · hours-aware",
};

export function JourneyPanel() {
  const {
    customer,
    messages,
    simState,
    simFailCount,
    deviceNbo,
    agentHandoff,
    agentDeskOpen,
    coverageState,
    demoNow,
    showTechnical,
    aggregate,
    portalSelection,
    guidedBundleId,
  } = useDemo();
  const pathname = usePathname();

  const wf = buildWorkflow({
    customer,
    messages,
    simState,
    simFailCount,
    deviceNbo,
    agentHandoff,
    agentDeskOpen,
    coverageState,
    demoNow,
    pathname,
    aggregate,
    portalSelection,
    guidedBundleId,
  });

  const showDemoAnswers =
    customer &&
    (customer.personaFocus === "selfcare" ||
      customer.id === "shen" ||
      Boolean(simState));

  return (
    <aside className="flex h-full flex-col gap-4 overflow-y-auto bg-[var(--panel)] p-5 text-[var(--ink)]">
      <div>
        <p className="text-[0.7rem] font-bold uppercase tracking-[0.14em] text-[var(--blue-deep)]">
          AI workflow
        </p>
        <h2 className="mt-1 text-lg font-semibold">{wf.title}</h2>
        <p className="mt-0.5 text-[0.65rem] text-[var(--muted)]">
          {wf.id
            ? SCENARIO_TAG[wf.id]
            : "One framework for every scenario — start a journey from the presenter bar or the chat menu."}
        </p>
      </div>

      {customer && (
        <div className="flex items-center justify-between gap-2 rounded-2xl border border-[var(--line)] bg-white px-4 py-3 shadow-sm">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{customer.name}</p>
            <p className="text-[0.65rem] text-[var(--muted)]">
              {customer.currentPlanName}
            </p>
          </div>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[0.65rem] font-bold uppercase ${
              customer.marketingEligible
                ? "bg-[var(--lime)] text-[var(--ink)]"
                : "bg-[var(--line)] text-[var(--muted)]"
            }`}
          >
            {customer.deviceProfile
              ? "Device NBO"
              : customer.id === "sipho" && customer.marketingEligible
                ? "TikTok / SKU"
                : "Base"}
          </span>
        </div>
      )}

      <WorkflowStepper steps={wf.steps} />

      {showDemoAnswers && customer && (
        <div className="rounded-2xl border border-dashed border-[var(--blue)] bg-[#e8f5ff] p-4 shadow-sm">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[var(--blue-deep)]">
            Demo answers · presenter only
          </p>
          <p className="mt-1 text-[0.65rem] text-[var(--slate)]">
            Not shown in the customer chat — use these during the live demo.
          </p>
          <dl className="mt-3 space-y-1.5 text-xs text-[var(--slate)]">
            <div className="flex justify-between gap-2">
              <dt>MSISDN</dt>
              <dd className="font-mono font-semibold text-[var(--ink)]">
                {customer.sim.msisdn}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Passport / ID</dt>
              <dd className="text-right font-mono font-semibold text-[var(--ink)]">
                {customer.idNumber}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Last recharge date</dt>
              <dd className="font-mono font-semibold text-[var(--ink)]">
                {customer.securityAnswers.lastRechargeDate}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Last recharge amount</dt>
              <dd className="font-semibold text-[var(--ink)]">
                R{customer.securityAnswers.lastRechargeAmount}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Last number called</dt>
              <dd className="font-mono font-semibold text-[var(--ink)]">
                {customer.securityAnswers.lastCalledNumber}
              </dd>
            </div>
            {simState?.storeId ? (
              <div className="flex justify-between gap-2">
                <dt>Handoff store</dt>
                <dd className="text-right font-semibold text-[var(--ink)]">
                  {SIM_STORES.find((s) => s.id === simState.storeId)?.name ??
                    simState.storeId}
                </dd>
              </div>
            ) : null}
          </dl>
        </div>
      )}

      {showTechnical && (
        <div className="rounded-2xl border border-dashed border-[var(--line)] bg-white/70 p-4 font-mono text-[0.7rem] leading-relaxed text-[var(--slate)]">
          <p className="mb-2 font-sans text-xs font-bold uppercase tracking-wide text-[var(--ink)]">
            Technical view
          </p>
          Two marketing users, never mixed on one Next: Sipho +
          marketingEligible → TikTok pie / adjacent SKU. Thabo + device CRM →
          DEVICE_UPGRADE (nova 15 Max R369×36) only. Talk to an agent → briefing stays
          in chat. Open Vodacom Get Help is optional. Online chat only in SAST
          hours (Mon–Fri 8–5, Sat 8–1). Coverage availability comes from GET
          /api/coverage/check, not the LLM.
          <br />
          <br />
          Li Wen → SIM KYC vs CRM docs; Sipho KYC mode = reject
        </div>
      )}
    </aside>
  );
}
