"use client";

import Link from "next/link";
import { ASSET } from "./catalog";

export function QrHeader() {
  return (
    <header className="relative mb-px flex items-center bg-white py-[15px]">
      <div className="container mx-auto h-10 px-6 lg:px-10">
        <Link href="/" className="inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/vodacom-logo.svg"
            alt="Vodacom In Store Portal"
            width={140}
            height={50}
            className="h-10 w-auto"
          />
        </Link>
      </div>
    </header>
  );
}

export function QrStepBar({
  title,
  step,
  total = 2,
  label = "Specify amount",
}: {
  title: string;
  step: number;
  total?: number;
  label?: string;
}) {
  const pct = Math.round((step / total) * 100);
  return (
    <div className="bg-white py-5">
      <div className="container mx-auto px-6 lg:px-10">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-8">
          <div className="border-r border-black/10 pr-4 lg:col-span-2">
            <h1 className="text-[22px] font-bold leading-9 text-[var(--qr-blue-text)]">
              {title}
            </h1>
          </div>
          <div className="flex items-center lg:col-span-6 lg:pl-4">
            <div className="w-full">
              <h2 className="text-[14px] font-bold text-[var(--qr-blue-text)]">
                <span className="mr-3 text-[12px] font-light leading-8">
                  Step {step} of {total}
                </span>
                <span className="mr-3 text-[12px] font-light text-[var(--qr-muted)]">
                  |
                </span>
                {label}
              </h2>
              <div className="relative mt-1 h-1 rounded bg-[var(--qr-track)]">
                <div
                  className="absolute left-0 top-0 h-1 rounded bg-[var(--qr-green)] transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function QrFooterNav({
  onBack,
  onNext,
  nextDisabled,
  nextLabel = "Next",
}: {
  onBack?: () => void;
  onNext?: () => void;
  nextDisabled?: boolean;
  nextLabel?: string;
}) {
  return (
    <div className="sticky bottom-0 z-20 mt-4 rounded-t-[20px] bg-white p-6 shadow-[0_-8px_50px_rgba(8,45,108,0.15)] lg:rounded-none">
      <div className="container mx-auto grid grid-cols-2">
        <div>
          <button type="button" className="qr-btn-back" onClick={onBack}>
            Back
          </button>
        </div>
        <div className="ml-auto">
          <button
            type="button"
            className="qr-btn-next"
            disabled={nextDisabled}
            onClick={onNext}
          >
            {nextLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function QrSiteFooter() {
  return (
    <footer className="mt-auto bg-[var(--qr-blue)] text-white">
      <div className="container mx-auto px-6 py-10 lg:px-10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <div className="flex items-center gap-3">
          <img src="/brand/vodacom-logo.svg" alt="Vodacom" width={24} height={24} className="h-6 w-6" />
          <strong className="text-base">Further together</strong>
        </div>
        <ul className="mt-8 flex flex-col gap-3 md:flex-row md:gap-6">
          {[
            ["Chat to us", "chat-icon.png"],
            ["Get help", "get-help-icon.png"],
            ["Check coverage", "coverage-icon.png"],
            ["Find a store", "store-icon.png"],
          ].map(([label, icon]) => (
            <li key={label} className="flex items-center gap-3 text-sm font-semibold">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`${ASSET}/images/icons/${icon}`}
                alt=""
                width={23}
                height={23}
              />
              {label}
            </li>
          ))}
        </ul>
      </div>
      <div className="border-t border-white/20 px-6 py-6 text-[11px] lg:px-10">
        <p>
          © Vodacom SA SOC Limited. 2026 All Rights Reserved. Demo clone — not
          production.
        </p>
      </div>
    </footer>
  );
}
