"use client";

import dynamic from "next/dynamic";
import { createPortal } from "react-dom";
import type { CoverageLocation } from "@/lib/coverage/types";

const LeafletMap = dynamic(() => import("./LeafletMap"), { ssr: false });

type Props = {
  location: CoverageLocation;
  address: string;
  /** Live-adjust the pin; parent re-resolves the address */
  onRelocate?: (lat: number, lng: number) => void;
  onClose: () => void;
  onUse: () => void;
};

export function LocationMapModal({ location, address, onRelocate, onClose, onUse }: Props) {
  const node = (
    <div
      className="chat-assist fixed inset-0 z-[80] flex items-end justify-center bg-[rgba(0,46,77,0.45)] p-3 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="coverage-map-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl bg-white text-[var(--ca-ink)] shadow-[0_24px_60px_rgba(0,46,77,0.28)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-[var(--line)] px-4 py-3">
          <div>
            <h2 id="coverage-map-title" className="text-sm font-semibold">
              Confirm on map
            </h2>
            <p className="mt-0.5 text-xs leading-snug text-[var(--muted)]">
              {address}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-2 py-1 text-xs font-semibold text-[var(--muted)] hover:bg-[#f3f6f9]"
          >
            Close
          </button>
        </div>
        <div className="relative h-56 overflow-hidden bg-[#e8eef3]">
          <LeafletMap
            location={location}
            draggable={Boolean(onRelocate)}
            onRelocate={onRelocate}
          />
          {onRelocate && (
            <div className="pointer-events-none absolute inset-x-0 top-0 z-[500] bg-white/95 px-3 py-1 text-[0.65rem] font-semibold text-[var(--ca-blue-deep)]">
              Drag the pin to adjust the location
            </div>
          )}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[500] bg-white/95 px-3 py-1 text-[0.65rem] text-[var(--muted)]">
            Map data © OpenStreetMap contributors
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-4 py-3">
          <button
            type="button"
            onClick={onUse}
            className="chat-assist__cta rounded-full bg-[var(--ca-lime)] px-3 py-1.5 text-xs font-semibold text-[var(--ca-ink)]"
          >
            Use this location
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return node;
  return createPortal(node, document.body);
}
