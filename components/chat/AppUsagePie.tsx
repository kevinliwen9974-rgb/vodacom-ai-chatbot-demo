"use client";

import { motion } from "framer-motion";
import { getAppUsage } from "@/data/usage/app-breakdown";
import { useDemo } from "@/hooks/useDemo";

/** Animated donut for chatbot only. */
export function AppUsagePie({
  highlight = "TikTok",
}: {
  highlight?: string;
}) {
  const { customer } = useDemo();
  const { slices, totalGb } = getAppUsage(customer?.id);
  const size = 148;
  const stroke = 26;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;

  return (
    <motion.div
      className="overflow-hidden rounded-2xl bg-white/95 p-3.5 text-[var(--ink)] shadow-[0_8px_28px_rgba(0,46,77,0.12)]"
      initial={{ opacity: 0, y: 10, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 380, damping: 28, delay: 0.08 }}
    >
      <div className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[var(--blue-deep)]">
        App usage breakdown — October
      </div>
      <p className="mt-1 text-[0.65rem] leading-snug text-[var(--muted)]">
        Detailed share of the 38GB used this month.
      </p>
      <div className="mt-3 flex items-center gap-3">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="#E6EBF2"
            strokeWidth={stroke}
          />
          {slices.map((slice, i) => {
            const len = (slice.percent / 100) * c;
            const dash = `${len} ${c - len}`;
            const currentOffset = offset;
            offset += len;
            return (
              <motion.circle
                key={slice.app}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={slice.color}
                strokeWidth={slice.app === highlight ? stroke + 2 : stroke}
                strokeDasharray={dash}
                strokeLinecap="butt"
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
                initial={{ strokeDashoffset: c, opacity: 0 }}
                animate={{
                  strokeDashoffset: -currentOffset,
                  opacity: slice.app === highlight ? 1 : 0.72,
                }}
                transition={{
                  strokeDashoffset: {
                    duration: 0.95,
                    delay: 0.1 + i * 0.09,
                    ease: [0.16, 1, 0.3, 1],
                  },
                  opacity: { duration: 0.35, delay: 0.1 + i * 0.09 },
                }}
              />
            );
          })}
          <motion.text
            x="50%"
            y="47%"
            textAnchor="middle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55 }}
            style={{ fill: "#002e4d", fontSize: 13, fontWeight: 700 }}
          >
            {totalGb}GB
          </motion.text>
          <text
            x="50%"
            y="58%"
            textAnchor="middle"
            style={{ fill: "#516471", fontSize: 9 }}
          >
            total
          </text>
        </svg>
        <ul className="min-w-0 flex-1 space-y-1.5 text-[0.7rem]">
          {slices.map((s, i) => (
            <motion.li
              key={s.app}
              className="flex items-center justify-between gap-2"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.06 }}
            >
              <span className="flex items-center gap-1.5 font-medium">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ background: s.color }}
                />
                {s.app}
              </span>
              <span className="tabular-nums text-[var(--muted)]">
                {s.gb}GB · {s.percent}%
              </span>
            </motion.li>
          ))}
        </ul>
      </div>
      <p className="mt-2.5 text-[0.62rem] italic text-[var(--muted)]">
        Demo data — not real customer usage.
      </p>
    </motion.div>
  );
}
