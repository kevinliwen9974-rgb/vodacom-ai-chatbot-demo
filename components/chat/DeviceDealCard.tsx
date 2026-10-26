"use client";

type Props = {
  currentDevice: string;
  deviceAgeMonths: number;
  offerName: string;
  brand: string;
  monthlyRand: number;
  termMonths: number;
  specs: string;
};

export function DeviceDealCard({
  currentDevice,
  deviceAgeMonths,
  offerName,
  brand,
  monthlyRand,
  termMonths,
  specs,
}: Props) {
  return (
    <div className="mt-3 overflow-hidden rounded-2xl border border-[#d5e6f5] bg-white text-[var(--ca-ink)] shadow-[0_8px_24px_rgba(0,46,77,0.12)]">
      <div className="flex items-start gap-2.5 border-b border-[#e8f0f7] px-3 py-2.5">
        <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#0a97ff] text-white">
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
            <rect
              x="4"
              y="1.5"
              width="8"
              height="13"
              rx="1.4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <circle cx="8" cy="12.2" r="0.7" fill="currentColor" />
          </svg>
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="text-[0.8rem] font-bold leading-snug text-[#002e4d]">
              You may be ready for a new phone
            </p>
            <span className="rounded-full bg-[#e8f5ff] px-1.5 py-0.5 text-[0.58rem] font-bold uppercase tracking-wide text-[#0a97ff]">
              Next best offer
            </span>
          </div>
          <p className="mt-0.5 text-[0.65rem] text-[var(--muted)]">
            {brand} → {brand} · stay on the brand you already use
          </p>
        </div>
      </div>

      <div className="space-y-2.5 px-3 py-3">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <div className="rounded-xl bg-[#f4f8fc] px-2.5 py-2">
            <p className="text-[0.55rem] font-bold uppercase tracking-wide text-[var(--muted)]">
              Current
            </p>
            <p className="text-[0.75rem] font-semibold text-[#002e4d]">
              {currentDevice}
            </p>
            <p className="text-[0.6rem] text-[var(--muted)]">
              {deviceAgeMonths} months on this line
            </p>
          </div>
          <span className="text-sm font-bold text-[#0a97ff]" aria-hidden>
            →
          </span>
          <div className="rounded-xl border border-[#91e200] bg-[#f4ffd6] px-2.5 py-2">
            <p className="text-[0.55rem] font-bold uppercase tracking-wide text-[#2a6a00]">
              Recommended
            </p>
            <p className="text-[0.75rem] font-semibold text-[#002e4d]">
              {offerName}
            </p>
            <p className="text-[0.6rem] text-[#2a6a00]">{specs}</p>
          </div>
        </div>

        <div className="flex items-end justify-between rounded-xl bg-[#e8f5ff] px-2.5 py-2">
          <div>
            <p className="text-[0.55rem] font-bold uppercase tracking-wide text-[#0a97ff]">
              Contract
            </p>
            <p className="text-[1.15rem] font-bold leading-none text-[#002e4d]">
              R{monthlyRand}
              <span className="text-[0.7rem] font-semibold text-[var(--muted)]">
                {" "}
                × {termMonths}
              </span>
            </p>
          </div>
          <p className="text-right text-[0.6rem] leading-snug text-[#002e4d]">
            New phone + data
            <br />
            in one deal
          </p>
        </div>
      </div>
    </div>
  );
}
