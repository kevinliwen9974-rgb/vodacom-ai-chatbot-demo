"use client";

import { useState } from "react";

export type LocationSuggestion = {
  id: string;
  label: string;
};

type Props = {
  placeholder?: string;
  suggestions?: LocationSuggestion[];
  disabled?: boolean;
  onSubmit: (value: string) => void;
  /** Browser geolocation — resolves to the nearest real address */
  onLocate?: () => void;
  locateBusy?: boolean;
};

export function LocationInput({
  placeholder = "Search your address",
  suggestions = [],
  disabled,
  onSubmit,
  onLocate,
  locateBusy,
}: Props) {
  const [value, setValue] = useState("");

  const submit = (next: string) => {
    const trimmed = next.trim();
    if (!trimmed || disabled) return;
    onSubmit(trimmed);
  };

  return (
    <form
      className="mt-3 space-y-2 rounded-xl bg-white p-3 text-[var(--ca-ink)]"
      onSubmit={(e) => {
        e.preventDefault();
        submit(value);
      }}
    >
      <label className="block space-y-1">
        <span className="text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[var(--ca-blue-deep)]">
          Address
        </span>
        <input
          type="text"
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          autoComplete="street-address"
          onChange={(e) => setValue(e.target.value)}
          className="w-full rounded-lg border border-[var(--line)] bg-[#f3f6f9] px-3 py-2 text-sm text-[var(--ca-ink)] outline-none placeholder:text-[#7a8b96] focus:border-[var(--ca-blue)]"
        />
      </label>
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {suggestions.map((s) => (
            <button
              key={s.id}
              type="button"
              disabled={disabled}
              onClick={() => submit(s.label)}
              className="chat-assist__cta rounded-full border border-[var(--line)] bg-[#f3f6f9] px-2.5 py-1 text-[0.7rem] font-semibold text-[var(--ca-ink)] disabled:opacity-50"
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
      {onLocate && (
        <button
          type="button"
          disabled={disabled || locateBusy}
          onClick={onLocate}
          className="chat-assist__cta w-full rounded-full border border-[var(--ca-blue)] bg-white px-3 py-2 text-xs font-semibold text-[var(--ca-blue-deep)] disabled:opacity-50"
        >
          {locateBusy ? "Getting your location…" : "Use my current location"}
        </button>
      )}
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        className="chat-assist__cta w-full rounded-full bg-[var(--ca-blue)] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
      >
        Use this address
      </button>
    </form>
  );
}
