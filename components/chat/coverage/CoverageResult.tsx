"use client";

import type { CoverageCheckResponse } from "@/lib/coverage/types";
import { LocationPinMark } from "./LocationCard";
import { CoverageStatus } from "./CoverageStatus";

type Props = {
  address: string;
  line1?: string;
  suburb?: string;
  city?: string;
  result: CoverageCheckResponse;
};

export function CoverageResult({ address, line1, suburb, city, result }: Props) {
  const coverage = result.coverage;
  if (!coverage) return null;

  return (
    <div className="mt-3 space-y-2 rounded-xl bg-white p-3 text-[var(--ca-ink)]">
      <div className="flex gap-3">
        <LocationPinMark />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <div className="text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[var(--ca-blue-deep)]">
              Coverage at your location
            </div>
            {result.source && (
              <span
                className={`rounded-full px-1.5 py-px text-[0.58rem] font-bold uppercase tracking-wide ${
                  result.source === "live"
                    ? "bg-[var(--ca-lime)] text-[var(--ca-ink)]"
                    : "bg-[#f3f6f9] text-[var(--muted)]"
                }`}
                title={
                  result.source === "live"
                    ? "Vodacom coverage result"
                    : "Demo data — mock scenario"
                }
              >
                {result.source === "live" ? "Live · Vodacom GIS" : "Demo data"}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-sm font-semibold leading-snug">
            {line1 ?? address}
          </p>
          {(suburb || city) && (
            <p className="text-xs text-[var(--muted)]">
              {[suburb, city].filter(Boolean).join(", ")}
            </p>
          )}
        </div>
      </div>
      <div className="divide-y divide-[var(--line)]">
        <CoverageStatus label="5G" available={coverage["5g"]} />
        <CoverageStatus label="4G / LTE" available={coverage.lte || coverage["4g"]} />
        <CoverageStatus label="Fibre" available={coverage.fibre} />
      </div>
    </div>
  );
}
