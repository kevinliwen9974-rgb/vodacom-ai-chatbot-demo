"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useCustomerBehavior } from "@/hooks/useCustomerBehavior";
import { useDemo } from "@/hooks/useDemo";
import type { Product } from "@/types";

export default function DataBundlesInner() {
  const { viewProduct, compareProduct, openDetail } = useCustomerBehavior();
  const { products, customer, startCheckout, checkoutBusy } = useDemo();
  const params = useSearchParams();
  const highlighted = params.get("recommended");
  const [detail, setDetail] = useState<Product | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);

  const sorted = useMemo(
    () => [...products].sort((a, b) => a.price - b.price),
    [products],
  );

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <section>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--blue-deep)]">
          Bundles
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Data bundles</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Current plan: <strong>{customer?.currentPlanName}</strong>. Demo offers marked
          clearly — not live Vodacom pricing guarantees.
        </p>
      </section>

      <div className="grid gap-3">
        {sorted.map((p) => {
          const isRec = highlighted === p.id;
          const inCompare = compareIds.includes(p.id);
          return (
            <article
              key={p.id}
              className={`rounded-2xl border bg-white p-4 shadow-sm transition ${
                isRec
                  ? "border-[var(--lime)] ring-2 ring-[var(--lime)]/40"
                  : "border-[var(--line)]"
              }`}
              onMouseEnter={() => void viewProduct(p.id)}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">{p.name}</h2>
                  <p className="text-sm text-[var(--muted)]">{p.tagline}</p>
                  {p.promotionalStatus === "demo_offer" && (
                    <span className="mt-2 inline-block rounded-full bg-[var(--lime)]/20 px-2 py-0.5 text-[0.65rem] font-bold uppercase text-[var(--ink)]">
                      Demo offer
                    </span>
                  )}
                  {isRec && (
                    <span className="mt-2 ml-2 inline-block rounded-full bg-[var(--blue)] px-2 py-0.5 text-[0.65rem] font-bold uppercase text-white">
                      Recommended for you
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-2xl font-semibold">R{p.price}</div>
                  <div className="text-[0.7rem] text-[var(--muted)]">
                    {p.validityDays} days · {p.dataAllowanceGb}GB
                  </div>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-full border border-[var(--line)] px-3 py-1.5 text-xs font-semibold"
                  onClick={() => {
                    setDetail(p);
                    void openDetail(p.id);
                  }}
                >
                  Details
                </button>
                <button
                  type="button"
                  className="rounded-full border border-[var(--line)] px-3 py-1.5 text-xs font-semibold"
                  onClick={() => {
                    setCompareIds((ids) =>
                      ids.includes(p.id)
                        ? ids.filter((x) => x !== p.id)
                        : [...ids, p.id].slice(-2),
                    );
                    void compareProduct(p.id);
                  }}
                >
                  {inCompare ? "Compared" : "Compare"}
                </button>
                <button
                  type="button"
                  disabled={checkoutBusy}
                  className="rounded-full bg-[var(--blue)] px-3 py-1.5 text-xs font-semibold text-white"
                  onClick={async () => {
                    const url = await startCheckout(p.id);
                    if (url) window.location.href = url;
                  }}
                >
                  Buy
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {compareIds.length === 2 && (
        <section className="rounded-2xl border border-[var(--line)] bg-white p-4 text-sm shadow-sm">
          <h3 className="font-semibold">Comparing</h3>
          <div className="mt-2 grid grid-cols-2 gap-3">
            {compareIds.map((id) => {
              const p = products.find((x) => x.id === id);
              if (!p) return null;
              return (
                <div key={id}>
                  <div className="font-medium">{p.name}</div>
                  <div>R{p.price}</div>
                  <div>{p.dataAllowanceGb}GB</div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {detail && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <h3 className="text-lg font-semibold">{detail.name}</h3>
            <p className="mt-2 text-sm text-[var(--muted)]">{detail.tagline}</p>
            <ul className="mt-3 space-y-1 text-sm">
              <li>Price: R{detail.price}</li>
              <li>Data: {detail.dataAllowanceGb}GB</li>
              <li>Validity: {detail.validityDays} days</li>
              <li>Eligibility: {detail.eligibility.join(", ")}</li>
            </ul>
            <button
              type="button"
              className="mt-4 rounded-full bg-[var(--ink)] px-4 py-2 text-sm text-white"
              onClick={() => setDetail(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
