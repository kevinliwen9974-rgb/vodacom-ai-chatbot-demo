"use client";

import { useEffect, useMemo, useState } from "react";

export type SimInputKind = "msisdn" | "date" | "amount" | "phone";

type Props = {
  kind: SimInputKind;
  prefill?: string;
  label?: string;
  onConfirm: (value: string) => void;
  disabled?: boolean;
};

const MONTHS = [
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

function parseYmd(v: string): { y: string; m: string; d: string } {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v.trim());
  if (!m) return { y: "", m: "", d: "" };
  return { y: m[1]!, m: m[2]!, d: m[3]! };
}

function EnglishDateFields({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (ymd: string) => void;
  disabled?: boolean;
}) {
  const initial = parseYmd(value);
  const [y, setY] = useState(initial.y);
  const [m, setM] = useState(initial.m);
  const [d, setD] = useState(initial.d);

  useEffect(() => {
    const p = parseYmd(value);
    if (p.y) setY(p.y);
    if (p.m) setM(p.m);
    if (p.d) setD(p.d);
  }, [value]);

  const years = useMemo(() => {
    const now = new Date().getFullYear();
    const out: number[] = [];
    for (let i = now; i >= now - 10; i -= 1) out.push(i);
    return out;
  }, []);

  const daysInMonth = useMemo(() => {
    if (!y || !m) return 31;
    return new Date(Number(y), Number(m), 0).getDate();
  }, [y, m]);

  useEffect(() => {
    if (d && Number(d) > daysInMonth) setD(String(daysInMonth).padStart(2, "0"));
  }, [daysInMonth, d]);

  useEffect(() => {
    if (y && m && d) onChange(`${y}-${m}-${d}`);
    else onChange("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [y, m, d]);

  const selectClass =
    "ca-native-select w-full rounded-lg border border-[var(--line)] bg-white px-2 py-2 text-sm text-[var(--ca-ink)] outline-none focus:border-[var(--ca-blue)]";

  return (
    <div lang="en-ZA" className="grid grid-cols-3 gap-2">
      <label className="space-y-1">
        <span className="block text-[0.65rem] font-semibold text-[var(--muted)]">
          Day
        </span>
        <select
          className={selectClass}
          value={d}
          disabled={disabled}
          onChange={(e) => setD(e.target.value)}
        >
          <option value="">Day</option>
          {Array.from({ length: daysInMonth }, (_, i) => {
            const v = String(i + 1).padStart(2, "0");
            return (
              <option key={v} value={v}>
                {i + 1}
              </option>
            );
          })}
        </select>
      </label>
      <label className="space-y-1">
        <span className="block text-[0.65rem] font-semibold text-[var(--muted)]">
          Month
        </span>
        <select
          className={selectClass}
          value={m}
          disabled={disabled}
          onChange={(e) => setM(e.target.value)}
        >
          <option value="">Month</option>
          {MONTHS.map((mo) => (
            <option key={mo.value} value={mo.value}>
              {mo.label}
            </option>
          ))}
        </select>
      </label>
      <label className="space-y-1">
        <span className="block text-[0.65rem] font-semibold text-[var(--muted)]">
          Year
        </span>
        <select
          className={selectClass}
          value={y}
          disabled={disabled}
          onChange={(e) => setY(e.target.value)}
        >
          <option value="">Year</option>
          {years.map((yy) => (
            <option key={yy} value={String(yy)}>
              {yy}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

export function SimInputWidget({
  kind,
  prefill = "",
  label,
  onConfirm,
  disabled,
}: Props) {
  const [value, setValue] = useState(prefill);

  useEffect(() => {
    if (prefill) setValue(prefill);
  }, [prefill]);

  const titles: Record<SimInputKind, string> = {
    msisdn: label ?? "Mobile number",
    date: label ?? "Last recharge date",
    amount: label ?? "Recharge amount (R)",
    phone: label ?? "Last number called",
  };

  return (
    <div
      lang="en-ZA"
      className="mt-3 space-y-2 rounded-xl bg-white p-3 text-[var(--ca-ink)]"
    >
      <div className="text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[var(--ca-blue-deep)]">
        {titles[kind]}
      </div>
      {kind === "date" ? (
        <EnglishDateFields
          value={value}
          onChange={setValue}
          disabled={disabled}
        />
      ) : kind === "amount" ? (
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[var(--muted)]">R</span>
          <input
            type="number"
            inputMode="decimal"
            min={1}
            step={1}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            disabled={disabled}
            lang="en-ZA"
            className="w-full rounded-lg border border-[var(--line)] bg-[#f3f6f9] px-3 py-2 text-sm outline-none focus:border-[var(--ca-blue)]"
            placeholder="100"
          />
        </div>
      ) : (
        <input
          type="tel"
          inputMode="numeric"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={disabled}
          lang="en-ZA"
          className="w-full rounded-lg border border-[var(--line)] bg-[#f3f6f9] px-3 py-2 text-sm outline-none focus:border-[var(--ca-blue)]"
          placeholder="0XXXXXXXXX"
        />
      )}
      <button
        type="button"
        disabled={disabled || !value.trim()}
        onClick={() => onConfirm(value.trim())}
        className="chat-assist__cta w-full rounded-full bg-[var(--ca-blue)] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
      >
        Confirm
      </button>
    </div>
  );
}
