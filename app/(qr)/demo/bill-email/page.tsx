"use client";

/**
 * Demo entry for Shen's Vodacom invoice mailer (extracted from live EML).
 * Keeps Presenter chrome; mailer itself is static HTML with remote Vodacom assets.
 */
export default function ShenBillEmailPage() {
  return (
    <div className="flex min-h-[calc(100dvh-3rem)] flex-col bg-[#e8eef3]">
      <div className="flex flex-wrap items-center gap-3 bg-white px-4 py-2 text-xs text-[var(--muted)]">
        <span className="font-semibold text-[var(--ink)]">Demo inbox</span>
        <span>
          From: Vodacom Billing &lt;ebilling@vodacom.co.za&gt;
        </span>
        <span>To: Mr Li Wen</span>
        <span className="truncate">
          Subject: Vodacom Tax Invoice &amp; Statement - Account: 908214455 - Oct 2026
        </span>
        <a
          href="/demo/shen-telkom-invoice.html"
          target="_blank"
          rel="noreferrer"
          className="ml-auto font-semibold text-[var(--blue)] underline"
        >
          Open full page
        </a>
      </div>
      <iframe
        title="Vodacom invoice email — Li Wen"
        src="/demo/shen-telkom-invoice.html"
        className="min-h-0 w-full flex-1 border-0 bg-white"
      />
    </div>
  );
}
