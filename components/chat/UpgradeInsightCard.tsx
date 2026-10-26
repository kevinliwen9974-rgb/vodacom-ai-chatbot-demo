"use client";

import { SHEN_DATA_USAGE, SHEN_LTE_AVG } from "@/data/billing";

type Props = {
  planGb?: number;
  recommendedGb?: number;
  currentPrice?: number;
  recommendedPrice?: number;
  avgSpend?: number;
};

/**
 * Lightweight billing upsell card — SVG + Tailwind only (no chart lib).
 * Persuasion: overage vs plan · spend already high · small delta for headroom.
 */
export function UpgradeInsightCard({
  planGb = 20,
  recommendedGb = 50,
  currentPrice = 229,
  recommendedPrice = 349,
  avgSpend = SHEN_LTE_AVG,
}: Props) {
  const saving = Math.max(0, Math.round(avgSpend - recommendedPrice));
  const avgGb = Math.round(
    SHEN_DATA_USAGE.reduce((s, r) => s + r.gb, 0) / SHEN_DATA_USAGE.length,
  );
  const overAvg = Math.max(0, avgGb - planGb);
  const monthsOver = SHEN_DATA_USAGE.filter((r) => r.gb > planGb).length;

  const max = 50;
  const h = 108;
  const w = 280;
  const padL = 8;
  const padR = 8;
  const padT = 18;
  const padB = 22;
  const points = SHEN_DATA_USAGE.map((r, i) => {
    const x =
      padL + (i * (w - padL - padR)) / Math.max(1, SHEN_DATA_USAGE.length - 1);
    const y = padT + (1 - r.gb / max) * (h - padT - padB);
    return { ...r, x, y };
  });
  const planY = padT + (1 - planGb / max) * (h - padT - padB);
  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  const barMax = recommendedGb;
  const curPct = (planGb / barMax) * 100;
  const avgPct = Math.min(100, (avgGb / barMax) * 100);

  return (
    <div className="mt-3 overflow-hidden rounded-2xl border border-[#d5e6f5] bg-white text-[var(--ca-ink)] shadow-[0_8px_24px_rgba(0,46,77,0.12)]">
      {/* Header */}
      <div className="flex items-start gap-2.5 border-b border-[#e8f0f7] px-3 py-2.5">
        <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#0a97ff] text-white">
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
            <path
              d="M2 12 L5 7 L8 9 L11 4 L14 6"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="text-[0.8rem] font-bold leading-snug text-[#002e4d]">
              Your data usage is outgrowing your plan
            </p>
            <span className="rounded-full bg-[#e8f5ff] px-1.5 py-0.5 text-[0.58rem] font-bold uppercase tracking-wide text-[#0a97ff]">
              ★ AI tip
            </span>
          </div>
          <p className="mt-0.5 text-[0.65rem] text-[var(--muted)]">
            Analysed last 3 months · 20GB monthly → 50GB monthly
          </p>
        </div>
      </div>

      <div className="space-y-3 px-3 py-3">
        {/* Trend chart */}
        <div>
          <p className="text-[0.7rem] font-bold text-[#002e4d]">
            Your data usage trend
          </p>
          <p className="text-[0.6rem] text-[var(--muted)]">Last 3 months (GB)</p>
          <svg
            viewBox={`0 0 ${w} ${h}`}
            className="mt-1 w-full"
            role="img"
            aria-label="Usage exceeded the 20GB plan in August, September and October"
          >
            <line
              x1={padL}
              x2={w - padR}
              y1={planY}
              y2={planY}
              stroke="#0a97ff"
              strokeDasharray="4 3"
              strokeWidth={1.5}
            />
            <text
              x={w - padR}
              y={planY - 4}
              textAnchor="end"
              fill="#0a97ff"
              fontSize={9}
              fontWeight={600}
            >
              Plan {planGb}GB
            </text>
            {/* overage fill under line above plan */}
            <path
              d={`${linePath} L ${points[points.length - 1]!.x} ${planY} L ${points[0]!.x} ${planY} Z`}
              fill="rgba(226, 60, 60, 0.12)"
            />
            <path
              d={linePath}
              fill="none"
              stroke="#002e4d"
              strokeWidth={2}
              strokeLinejoin="round"
            />
            {points.map((p) => (
              <g key={p.month}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={5}
                  fill={p.gb > planGb ? "#e23c3c" : "#002e4d"}
                  stroke="#fff"
                  strokeWidth={1.5}
                />
                <text
                  x={p.x}
                  y={p.y - 9}
                  textAnchor="middle"
                  fontSize={10}
                  fontWeight={700}
                  fill="#002e4d"
                >
                  {p.gb}GB
                </text>
                <text
                  x={p.x}
                  y={h - 4}
                  textAnchor="middle"
                  fontSize={10}
                  fill="#6b7c8a"
                >
                  {p.month}
                </text>
              </g>
            ))}
          </svg>
          <p className="mt-1 flex items-center gap-1.5 text-[0.65rem] text-[#0a97ff]">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#e23c3c]" />
            Exceeded {planGb}GB in {monthsOver} of {SHEN_DATA_USAGE.length}{" "}
            months
          </p>
        </div>

        {/* Plan compare + CSS progress */}
        <div className="rounded-xl bg-[#f4f8fc] p-2.5">
          <div className="flex items-center justify-between gap-2 text-[0.65rem] font-semibold">
            <span className="text-[#0a97ff]">
              Current {planGb}GB · R{currentPrice}/mo
            </span>
            <span className="text-[var(--muted)]">→</span>
            <span className="text-[#2a9a3c]">
              Rec. {recommendedGb}GB · R{recommendedPrice}/mo
            </span>
          </div>
          <div className="relative mt-3 h-3 overflow-hidden rounded-full bg-white">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-[#0a97ff]"
              style={{ width: `${curPct}%` }}
            />
            <div
              className="absolute inset-y-0 rounded-full bg-[#91e200]"
              style={{ left: `${curPct}%`, width: `${100 - curPct}%` }}
            />
            <div
              className="absolute top-1/2 z-10 h-5 w-0.5 -translate-y-1/2 bg-[#002e4d]"
              style={{ left: `${avgPct}%` }}
              title={`${avgGb}GB avg`}
            />
          </div>
          <div className="relative mt-1 h-4 text-[0.58rem]">
            <span
              className="absolute -translate-x-1/2 font-semibold text-[#002e4d]"
              style={{ left: `${avgPct}%` }}
            >
              {avgGb}GB avg
            </span>
          </div>
          <div className="mt-1 flex flex-wrap gap-1.5">
            <span className="rounded-md bg-[#fde8e8] px-1.5 py-0.5 text-[0.6rem] font-semibold text-[#c0392b]">
              ~{overAvg}GB over plan on average
            </span>
            <span className="rounded-md bg-[#eaf8e4] px-1.5 py-0.5 text-[0.6rem] font-semibold text-[#2a9a3c]">
              +{recommendedGb - planGb}GB more headroom
            </span>
          </div>
        </div>

        {/* Spend pitch */}
        <div className="rounded-xl bg-[#e8f5ff] px-2.5 py-2 text-[0.7rem] leading-snug text-[#002e4d]">
          <p>
            You&apos;re currently spending{" "}
            <strong>~R{avgSpend.toFixed(0)}/month</strong> on this data line.
          </p>
          <p className="mt-1">
            Move to 50GB and save about{" "}
            <strong className="text-[#0a97ff]">R{saving}/month</strong> with{" "}
            <span className="inline-block rounded-md border border-[#91e200] bg-[#f4ffd6] px-1.5 py-0.5 font-bold text-[#2a6a00]">
              15GB above average usage
            </span>
          </p>
        </div>
      </div>

      <p className="border-t border-[#e8f0f7] px-3 py-1.5 text-[0.55rem] text-[var(--muted)]">
        Vodacom published bundle prices · VAT included · plan terms apply
      </p>
    </div>
  );
}
