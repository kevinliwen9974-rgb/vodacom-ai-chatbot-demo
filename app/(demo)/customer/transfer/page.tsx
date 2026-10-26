"use client";

import { useCustomerBehavior } from "@/hooks/useCustomerBehavior";

export default function TransferStub() {
  useCustomerBehavior();
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-2xl font-semibold">Transfer</h1>
      <p className="text-sm text-[var(--muted)]">
        Data / airtime transfer to synthetic numbers is stubbed. Transaction records will
        post to <code>/api/transfer</code> next.
      </p>
    </div>
  );
}
