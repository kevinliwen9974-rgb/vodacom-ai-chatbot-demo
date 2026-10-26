"use client";

import { VODACOM_COVERAGE_MAP_URL } from "@/lib/coverage/types";

type Props = {
  kind: "complex" | "error";
  onRetry?: () => void;
  onBack?: () => void;
};

export function CoverageFallback({ kind, onRetry, onBack }: Props) {
  const title =
    kind === "complex"
      ? "Detailed coverage check required"
      : "Coverage check unavailable";
  const body =
    kind === "complex"
      ? "This location needs a more detailed coverage assessment. For the most accurate result, continue to Vodacom's official coverage checker."
      : "Sorry, I couldn't complete the coverage check right now.";

  return (
    <div className="mt-3 space-y-3 rounded-xl bg-white p-3 text-[var(--ca-ink)]">
      <div>
        <div className="text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[var(--ca-blue-deep)]">
          {title}
        </div>
        <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">{body}</p>
      </div>
      <a
        href={VODACOM_COVERAGE_MAP_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="chat-assist__cta flex w-full items-center justify-center rounded-full bg-[var(--ca-lime)] px-3 py-2 text-xs font-semibold text-[var(--ca-ink)]"
      >
        Open Vodacom Coverage Map
      </a>
      {kind === "error" && onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="chat-assist__cta w-full rounded-full border border-[var(--line)] bg-[#f3f6f9] px-3 py-2 text-xs font-semibold"
        >
          Try again
        </button>
      ) : null}
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="chat-assist__cta w-full rounded-full border border-[var(--line)] bg-white px-3 py-2 text-xs font-semibold"
        >
          Back to chat
        </button>
      ) : null}
    </div>
  );
}
