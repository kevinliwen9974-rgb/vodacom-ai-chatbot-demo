"use client";

import { useCallback, useEffect, useState } from "react";
import { useCustomerBehavior } from "@/hooks/useCustomerBehavior";
import { useDemo } from "@/hooks/useDemo";
import type { Invoice } from "@/types";

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("read failed"));
    reader.readAsDataURL(file);
  });
}

export default function BillingPage() {
  useCustomerBehavior();
  const { customer } = useDemo();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [preview, setPreview] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!customer?.id) return;
    void fetch(`/api/customer/${customer.id}/billing`)
      .then((r) => r.json())
      .then((d: { invoices?: Invoice[] }) => setInvoices(d.invoices ?? []))
      .catch(() => setInvoices([]));
  }, [customer?.id]);

  const onFile = useCallback(async (file: File | null) => {
    if (!file) return;
    setError(null);
    setAnalysis(null);
    if (!file.type.startsWith("image/")) {
      setError("Please upload a bill photo (PNG, JPG, or WebP).");
      return;
    }
    if (file.size > 6_000_000) {
      setError("Image must be under 6MB.");
      return;
    }
    const dataUrl = await fileToDataUrl(file);
    setPreview(dataUrl);
  }, []);

  const analyze = useCallback(async () => {
    if (!preview) return;
    setBusy(true);
    setError(null);
    setAnalysis(null);
    try {
      const res = await fetch("/api/ai/analyze-bill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageDataUrl: preview,
          customerId: customer?.id,
        }),
      });
      const data = (await res.json()) as { summary?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Analysis failed");
      setAnalysis(data.summary ?? "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setBusy(false);
    }
  }, [preview, customer?.id]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <section>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--blue-deep)]">
          Billing
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[var(--ink)]">
          Invoices &amp; bill scan
        </h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Synthetic invoices below. Upload a bill photo for vision analysis —
          amounts come only from what is visible in the image.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Recent invoices</h2>
        {invoices.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No invoices for this persona.</p>
        ) : (
          invoices.map((inv) => (
            <article
              key={inv.id}
              className="rounded-2xl border border-[var(--line)] bg-white p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-semibold">{inv.month} 2026</h3>
                <span className="text-lg font-semibold text-[var(--blue-deep)]">
                  R{inv.totalDue.toFixed(2)}
                </span>
              </div>
              <p className="mt-1 text-xs text-[var(--muted)]">
                Issued {inv.invoiceDate} · Due {inv.dueDate} · {inv.id}
              </p>
              <ul className="mt-3 space-y-1 text-sm">
                {inv.lineItems.map((li) => (
                  <li key={li.label} className="flex justify-between gap-4">
                    <span>{li.label}</span>
                    <span className="tabular-nums">R{li.amount.toFixed(2)}</span>
                  </li>
                ))}
                <li className="flex justify-between gap-4 border-t border-[var(--line)] pt-1 text-[var(--muted)]">
                  <span>VAT</span>
                  <span className="tabular-nums">R{inv.vat.toFixed(2)}</span>
                </li>
              </ul>
            </article>
          ))
        )}
      </section>

      <section className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold">Scan a bill photo</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Take a photo of a printed or PDF bill screenshot. The assistant extracts
          visible line items only.
        </p>

        <label className="mt-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--line)] bg-[var(--surface)] px-4 py-8 text-sm hover:border-[var(--blue)]">
          <span className="font-medium text-[var(--ink)]">Choose image</span>
          <span className="text-[var(--muted)]">PNG · JPG · WebP · max 6MB</span>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            onChange={(e) => void onFile(e.target.files?.[0] ?? null)}
          />
        </label>

        {preview && (
          <div className="mt-4 space-y-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Bill preview"
              className="max-h-64 w-full rounded-xl border border-[var(--line)] object-contain bg-[var(--surface)]"
            />
            <button
              type="button"
              disabled={busy}
              onClick={() => void analyze()}
              className="rounded-full bg-[var(--blue)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {busy ? "Analysing…" : "Analyse bill"}
            </button>
          </div>
        )}

        {error && (
          <p className="mt-3 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        {analysis && (
          <div className="mt-4 rounded-xl bg-[var(--surface)] p-4 text-sm leading-relaxed whitespace-pre-wrap text-[var(--ink)]">
            {analysis}
          </div>
        )}
      </section>
    </div>
  );
}
