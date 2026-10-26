"use client";

import { useEffect, useState } from "react";

export type CallbackFormValues = {
  reason: string;
  preferredTime: "asap" | "14-16" | "16-18";
  contactNumber: string;
};

type Props = {
  reason: string;
  defaultNumber?: string;
  disabled?: boolean;
  onSubmit: (values: CallbackFormValues) => void;
};

const TIMES: Array<{ id: CallbackFormValues["preferredTime"]; label: string }> =
  [
    { id: "asap", label: "As soon as possible" },
    { id: "14-16", label: "Today 14:00 – 16:00" },
    { id: "16-18", label: "Today 16:00 – 18:00" },
  ];

export function CallbackRequestWidget({
  reason,
  defaultNumber = "",
  disabled,
  onSubmit,
}: Props) {
  const [preferredTime, setPreferredTime] =
    useState<CallbackFormValues["preferredTime"]>("asap");
  const [contactNumber, setContactNumber] = useState(defaultNumber);

  useEffect(() => {
    if (defaultNumber) setContactNumber(defaultNumber);
  }, [defaultNumber]);

  return (
    <div
      lang="en-ZA"
      className="mt-3 space-y-3 rounded-xl bg-white p-3 text-[var(--ca-ink)]"
    >
      <div className="text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[var(--ca-blue-deep)]">
        Request a callback
      </div>

      <div>
        <div className="text-[0.65rem] font-semibold text-[var(--muted)]">
          Reason
        </div>
        <div className="mt-0.5 text-sm font-semibold">{reason}</div>
      </div>

      <fieldset className="space-y-1.5">
        <legend className="text-[0.65rem] font-semibold text-[var(--muted)]">
          Preferred time
        </legend>
        {TIMES.map((t) => (
          <label
            key={t.id}
            className="flex cursor-pointer items-center gap-2 text-sm"
          >
            <input
              type="radio"
              name="callback-time"
              checked={preferredTime === t.id}
              disabled={disabled}
              onChange={() => setPreferredTime(t.id)}
              className="accent-[var(--ca-blue)]"
            />
            {t.label}
          </label>
        ))}
      </fieldset>

      <label className="block space-y-1">
        <span className="text-[0.65rem] font-semibold text-[var(--muted)]">
          Contact number
        </span>
        <input
          type="tel"
          lang="en-ZA"
          inputMode="tel"
          value={contactNumber}
          disabled={disabled}
          onChange={(e) => setContactNumber(e.target.value)}
          placeholder="+27 XX XXX XXXX"
          className="w-full rounded-lg border border-[var(--line)] bg-[#f3f6f9] px-3 py-2 text-sm outline-none focus:border-[var(--ca-blue)]"
        />
      </label>

      <button
        type="button"
        disabled={disabled || !contactNumber.trim()}
        onClick={() =>
          onSubmit({
            reason,
            preferredTime,
            contactNumber: contactNumber.trim(),
          })
        }
        className="chat-assist__cta w-full rounded-full bg-[var(--ca-blue)] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
      >
        Request callback
      </button>
    </div>
  );
}
