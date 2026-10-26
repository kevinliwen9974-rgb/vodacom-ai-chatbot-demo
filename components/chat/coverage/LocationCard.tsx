"use client";

import { useState } from "react";
import type { CoverageLocation } from "@/lib/coverage/types";
import { LocationMapModal } from "./LocationMapModal";

type Props = {
  location: CoverageLocation;
  disabled?: boolean;
  onConfirm: () => void;
  /** Pin dragged on the map — parent re-resolves the address */
  onRelocate?: (lat: number, lng: number) => void;
};

export function LocationPinMark() {
  return (
    <span
      className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[rgba(10,151,255,0.12)]"
      aria-hidden
    >
      <span className="block h-2.5 w-2.5 rounded-full bg-[var(--ca-blue)] ring-4 ring-[rgba(10,151,255,0.28)]" />
    </span>
  );
}

export function LocationCard({ location, disabled, onConfirm, onRelocate }: Props) {
  const [mapOpen, setMapOpen] = useState(false);

  return (
    <div className="mt-3 space-y-3 rounded-xl bg-white p-3 text-[var(--ca-ink)]">
      <div className="flex gap-3">
        <LocationPinMark />
        <div className="min-w-0">
          <div className="text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[var(--ca-blue-deep)]">
            Location
          </div>
          <p className="mt-0.5 text-sm font-semibold leading-snug">
            {location.line1}
          </p>
          <p className="text-xs text-[var(--muted)]">
            {location.suburb}, {location.city}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setMapOpen(true)}
          className="chat-assist__cta rounded-full border border-[var(--line)] bg-[#f3f6f9] px-3 py-2 text-xs font-semibold disabled:opacity-50"
        >
          View on map
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={onConfirm}
          className="chat-assist__cta rounded-full bg-[var(--ca-lime)] px-3 py-2 text-xs font-semibold text-[var(--ca-ink)] disabled:opacity-50"
        >
          Confirm location
        </button>
      </div>
      {mapOpen && (
        <LocationMapModal
          location={location}
          address={`${location.line1}, ${location.suburb}, ${location.city}`}
          onRelocate={disabled ? undefined : onRelocate}
          onClose={() => setMapOpen(false)}
          onUse={() => {
            setMapOpen(false);
            onConfirm();
          }}
        />
      )}
    </div>
  );
}
