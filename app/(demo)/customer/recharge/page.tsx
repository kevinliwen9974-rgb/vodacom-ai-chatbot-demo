"use client";

import { useCustomerBehavior } from "@/hooks/useCustomerBehavior";
import { useDemo } from "@/hooks/useDemo";

export default function RechargeStub() {
  useCustomerBehavior();
  const { customer } = useDemo();
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-2xl font-semibold">Recharge</h1>
      <p className="text-sm text-[var(--muted)]">
        Current airtime: <strong>R{customer?.airtimeBalance.toFixed(2)}</strong>. Full
        R50/R100/R200 flow uses MockPaymentProvider in a later iteration.
      </p>
      <div className="flex flex-wrap gap-2">
        {[50, 100, 200].map((n) => (
          <button
            key={n}
            type="button"
            className="rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold opacity-60"
            disabled
          >
            R{n}
          </button>
        ))}
      </div>
    </div>
  );
}
