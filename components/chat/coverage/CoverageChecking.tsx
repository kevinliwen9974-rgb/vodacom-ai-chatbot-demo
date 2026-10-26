"use client";

import { LocationPinMark } from "./LocationCard";

export function CoverageChecking({ address }: { address: string }) {
  return (
    <div className="mt-3 space-y-3 rounded-xl bg-white p-3 text-[var(--ca-ink)]">
      <div className="flex gap-3">
        <LocationPinMark />
        <div className="min-w-0">
          <div className="text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[var(--ca-blue-deep)]">
            Checking coverage
          </div>
          <p className="mt-0.5 text-sm font-semibold leading-snug">{address}</p>
        </div>
      </div>
      <div className="space-y-2">
        {["5G", "4G / LTE", "Fibre"].map((label) => (
          <div
            key={label}
            className="flex items-center justify-between gap-3 rounded-lg bg-[#f3f6f9] px-3 py-2"
          >
            <span className="h-3 w-16 animate-pulse rounded bg-[#d5dee5]" />
            <span className="h-3 w-20 animate-pulse rounded bg-[#d5dee5]" />
            <span className="sr-only">Checking {label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
