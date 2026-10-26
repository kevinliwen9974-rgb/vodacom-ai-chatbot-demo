"use client";

import type { WfRow, WfState, WfStep } from "@/lib/journey/workflow";

function circleClass(state: WfState): string {
  if (state === "done")
    return "bg-[var(--lime)] text-[var(--ink)]";
  if (state === "active")
    return "bg-[var(--blue)] text-white animate-pulse";
  return "bg-[var(--line)] text-[var(--muted)]";
}

function rowValueClass(tone: WfRow["tone"]): string {
  switch (tone) {
    case "good":
      return "font-semibold text-[#2a6a00]";
    case "bad":
      return "font-semibold text-[#b42318]";
    case "mono":
      return "font-mono text-[0.65rem] text-[var(--ink)]";
    default:
      return "font-medium text-[var(--ink)]";
  }
}

/**
 * One sidebar framework for every scenario:
 * numbered vertical rail, stage tag per step, decision details inside the
 * step they belong to.
 */
export function WorkflowStepper({ steps }: { steps: WfStep[] }) {
  return (
    <ol className="rounded-2xl border border-[var(--line)] bg-white p-4 shadow-sm">
      {steps.map((s, i) => {
        const last = i === steps.length - 1;
        const hasDetail = Boolean(s.rows?.length) || Boolean(s.note);
        return (
          <li key={s.key} className={`relative flex gap-3 ${last ? "" : "pb-4"}`}>
            {!last && (
              <span
                aria-hidden
                className={`absolute left-[11px] top-6 h-[calc(100%-1.25rem)] w-px ${
                  s.state === "done" ? "bg-[var(--lime)]" : "bg-[var(--line)]"
                }`}
              />
            )}
            <span
              className={`z-10 mt-0.5 inline-flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full text-[0.65rem] font-bold ${circleClass(
                s.state,
              )}`}
            >
              {s.state === "done" ? "✓" : i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p
                className={`text-[0.58rem] font-bold uppercase tracking-[0.14em] ${
                  s.state === "active"
                    ? "text-[var(--blue-deep)]"
                    : "text-[var(--muted)]"
                }`}
              >
                {s.stage}
              </p>
              <p
                className={`text-[0.8rem] font-semibold leading-snug ${
                  s.state === "pending" ? "text-[var(--muted)]" : "text-[var(--ink)]"
                }`}
              >
                {s.title}
              </p>
              {s.state !== "pending" && hasDetail && (
                <div className="mt-1.5 space-y-1 rounded-lg bg-[#f3f6f9] px-2.5 py-2">
                  {s.rows?.map((r, ri) => (
                    <div
                      key={`${r.label}-${ri}`}
                      className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-2 text-[0.7rem]"
                    >
                      <span className="min-w-0 break-words text-[var(--muted)]">{r.label}</span>
                      <span className={`max-w-[6.5rem] break-words text-right ${rowValueClass(r.tone)}`}>
                        {r.value}
                      </span>
                    </div>
                  ))}
                  {s.note && (
                    <p className="text-[0.65rem] leading-snug text-[var(--slate)]">
                      {s.note}
                    </p>
                  )}
                </div>
              )}
              {s.state === "pending" && s.note && (
                <p className="mt-0.5 text-[0.65rem] leading-snug text-[var(--muted)]">
                  {s.note}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
