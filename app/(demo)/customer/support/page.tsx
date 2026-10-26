"use client";

import { useCustomerBehavior } from "@/hooks/useCustomerBehavior";
import { useDemo } from "@/hooks/useDemo";

export default function SupportStub() {
  useCustomerBehavior();
  const { customer } = useDemo();
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-2xl font-semibold">Support & SIM</h1>
      <p className="text-sm text-[var(--muted)]">
        FAQ RAG, fault image diagnosis, and human handover tickets are stubbed. SIM
        self-care seed is ready for the SIM-swap journey.
      </p>
      {customer && (
        <div className="rounded-2xl border border-[var(--line)] bg-white p-5 text-sm shadow-sm">
          <h2 className="font-semibold">SIM dashboard seed</h2>
          <ul className="mt-2 space-y-1 text-[var(--slate)]">
            <li>MSISDN: {customer.sim.msisdn}</li>
            <li>Status: {customer.sim.status}</li>
            <li>Radio: {customer.sim.radio}</li>
            <li>Plan: {customer.currentPlanName}</li>
            <li>Data: {customer.dataBalanceGb}GB</li>
          </ul>
          <div className="mt-3 flex flex-wrap gap-2">
            {["Check Balance", "Manage SIM", "Get Help"].map((label) => (
              <button
                key={label}
                type="button"
                disabled
                className="rounded-full border border-[var(--line)] px-3 py-1.5 text-xs opacity-60"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
