"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useCustomerBehavior } from "@/hooks/useCustomerBehavior";
import { useDemo } from "@/hooks/useDemo";
import { apiFetch } from "@/lib/api/client";

function CheckoutInner() {
  useCustomerBehavior();
  const params = useSearchParams();
  const paymentId = params.get("paymentId");
  const orderId = params.get("orderId");
  const { completePayment, checkoutBusy, lastReceipt, customer } = useDemo();
  const [info, setInfo] = useState<{
    payment?: { amount: number; status: string; id: string };
    order?: { productId: string; amount: number };
  } | null>(null);

  useEffect(() => {
    if (!paymentId) return;
    void apiFetch(`/api/payment/status?paymentId=${paymentId}`)
      .then((r) => r.json())
      .then(setInfo);
  }, [paymentId]);

  if (!paymentId) {
    return (
      <p className="text-[var(--muted)]">
        No payment in progress. Start from Bundles or the assistant recommendation.
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <section>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--blue-deep)]">
          Checkout
        </p>
        <h1 className="mt-1 text-2xl font-semibold">Confirm payment</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          MockPaymentProvider sandbox — no real card or banking details collected.
        </p>
      </section>

      <div className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm">
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-[var(--muted)]">Customer</dt>
            <dd className="font-medium">{customer?.name}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[var(--muted)]">Order</dt>
            <dd className="font-mono text-xs">{orderId}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[var(--muted)]">Product</dt>
            <dd className="font-medium">{info?.order?.productId ?? "…"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[var(--muted)]">Amount</dt>
            <dd className="text-lg font-semibold">
              R{info?.payment?.amount ?? info?.order?.amount ?? "…"}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[var(--muted)]">Status</dt>
            <dd className="capitalize">{info?.payment?.status ?? "loading"}</dd>
          </div>
        </dl>

        {!lastReceipt ? (
          <button
            type="button"
            disabled={checkoutBusy}
            onClick={() => void completePayment(paymentId)}
            className="mt-5 w-full rounded-full bg-[var(--lime)] py-3 text-sm font-bold text-[var(--ink)]"
          >
            {checkoutBusy ? "Processing…" : "Pay with mock gateway"}
          </button>
        ) : (
          <div className="mt-5 rounded-xl bg-[var(--panel)] p-4 text-sm">
            <p className="font-semibold text-[var(--blue-deep)]">Payment successful</p>
            <p className="mt-1">Receipt: {(lastReceipt as { id?: string }).id}</p>
            <p className="mt-1 text-[var(--muted)]">
              {(lastReceipt as { note?: string }).note}
            </p>
            <a
              href="/customer"
              className="mt-3 inline-flex rounded-full bg-[var(--blue)] px-4 py-2 text-xs font-semibold text-white"
            >
              Back to account
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<p>Loading checkout…</p>}>
      <CheckoutInner />
    </Suspense>
  );
}
