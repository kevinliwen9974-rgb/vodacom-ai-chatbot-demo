"use client";

import { useEffect, useRef, useState } from "react";

function maskMsisdn(msisdn: string) {
  const d = msisdn.replace(/\D/g, "");
  if (d.length < 6) return msisdn;
  return `${d.slice(0, 3)}****${d.slice(-4)}`;
}

type Props = {
  open: boolean;
  msisdn: string;
  title?: string;
  productLabel: string;
  amountLabel: string;
  /** e.g. "successfully loaded to" vs "successfully charged to" */
  successVerb?: string;
  onClose: () => void;
  onSuccess: () => void;
};

/** Shared OTP verify + success modals (Top-up host + SIM fee). Demo accepts any 4 digits. */
export function PaymentVerifyModals({
  open,
  msisdn,
  title = "Verify account",
  productLabel,
  amountLabel,
  successVerb = "successfully charged to",
  onClose,
  onSuccess,
}: Props) {
  const [otpDigits, setOtpDigits] = useState(["", "", "", ""]);
  const [otpOpen, setOtpOpen] = useState(true);
  const [successOpen, setSuccessOpen] = useState(false);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (!open) return;
    setOtpDigits(["", "", "", ""]);
    setOtpOpen(true);
    setSuccessOpen(false);
    const t = window.setTimeout(() => otpRefs.current[0]?.focus(), 50);
    return () => window.clearTimeout(t);
  }, [open]);

  if (!open) return null;

  const setOtpAt = (i: number, raw: string) => {
    const digits = raw.replace(/\D/g, "");
    if (digits.length > 1) {
      // Paste / autofill support
      const chars = digits.slice(0, 4).split("");
      setOtpDigits((prev) => {
        const next = [...prev];
        for (let j = 0; j < 4; j += 1) next[j] = chars[j] ?? "";
        return next;
      });
      const focusAt = Math.min(chars.length, 3);
      otpRefs.current[focusAt]?.focus();
      return;
    }
    const v = digits.slice(-1);
    setOtpDigits((prev) => {
      const next = [...prev];
      next[i] = v;
      return next;
    });
    if (v && i < 3) otpRefs.current[i + 1]?.focus();
  };

  const otpComplete = otpDigits.every((d) => d.length === 1);

  const submitOtp = () => {
    if (!otpComplete) return;
    setOtpOpen(false);
    setSuccessOpen(true);
  };

  return (
    <>
      {otpOpen && (
        <div
          className="pointer-events-auto fixed inset-0 z-[200] flex items-center justify-center bg-black/45 px-4"
          role="dialog"
          aria-modal="true"
          aria-label={title}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="relative w-full max-w-[420px] rounded-[12px] bg-white p-6 shadow-2xl md:p-8">
            <button
              type="button"
              className="absolute right-4 top-3 text-2xl leading-none text-[#5c6b76]"
              aria-label="Close"
              onClick={() => {
                setOtpOpen(false);
                onClose();
              }}
            >
              ×
            </button>
            <h3 className="text-[22px] font-bold text-[#002e4d]">{title}</h3>
            <p className="mt-2 text-[13px] text-[#5c6b76]">
              {productLabel} · {amountLabel}
            </p>
            <p className="mt-3 text-[14px] leading-relaxed text-[#002e4d]">
              Please enter the OTP we&apos;ve sent to your mobile number{" "}
              {maskMsisdn(msisdn)}
            </p>
            <p className="mt-1 text-[12px] text-[#5c6b76]">
              Demo: enter any 4 digits (e.g. 1234)
            </p>
            <div className="mt-6 flex justify-center gap-3">
              {otpDigits.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    otpRefs.current[i] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  autoComplete={i === 0 ? "one-time-code" : "off"}
                  maxLength={4}
                  value={d}
                  onChange={(e) => setOtpAt(i, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Backspace" && !otpDigits[i] && i > 0) {
                      otpRefs.current[i - 1]?.focus();
                    }
                    if (e.key === "Enter" && otpComplete) submitOtp();
                  }}
                  onFocus={(e) => e.target.select()}
                  className="h-14 w-12 rounded-[8px] border border-[#dadee0] bg-[#f3f6f9] text-center text-[22px] font-semibold text-[#002e4d] outline-none focus:border-[#0a97ff]"
                  aria-label={`OTP digit ${i + 1}`}
                />
              ))}
            </div>
            <button
              type="button"
              className="mt-4 text-[14px] font-semibold text-[#0a97ff]"
              onClick={() => {
                setOtpDigits(["", "", "", ""]);
                otpRefs.current[0]?.focus();
              }}
            >
              Resend OTP
            </button>
            <button
              type="button"
              disabled={!otpComplete}
              onClick={submitOtp}
              className={`mt-6 w-full rounded-[8px] py-3 text-[15px] font-bold text-white transition ${
                otpComplete
                  ? "bg-[#0a97ff] hover:bg-[#0086e6]"
                  : "cursor-not-allowed bg-[#9aa3ad]"
              }`}
            >
              Submit
            </button>
          </div>
        </div>
      )}

      {successOpen && (
        <div
          className="pointer-events-auto fixed inset-0 z-[200] flex items-center justify-center bg-black/45 px-4"
          role="dialog"
          aria-modal="true"
          aria-label="Payment successful"
        >
          <div className="w-full max-w-[440px] rounded-[12px] bg-white p-7 text-center shadow-2xl md:p-9">
            <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-[#91e200] text-2xl font-bold text-[#002e4d]">
              ✓
            </div>
            <h3 className="text-[24px] font-bold text-[#002e4d]">
              Payment successful
            </h3>
            <p className="mt-5 text-[15px] leading-relaxed text-[#002e4d]">
              <span className="font-semibold">{productLabel}</span>
              <br />
              {successVerb}
              <br />
              <span className="mt-1 inline-block text-[18px] font-bold">
                {msisdn}
              </span>
            </p>
            <p className="mt-2 text-[14px] font-semibold text-[#002e4d]">
              {amountLabel}
            </p>
            <p className="mt-4 text-[14px] text-[#5c6b76]">
              Thank you for your payment
            </p>
            <button
              type="button"
              className="mt-7 w-full rounded-[8px] bg-[#91e200] py-3 text-[15px] font-bold uppercase tracking-wide text-[#002e4d]"
              onClick={() => {
                setSuccessOpen(false);
                onSuccess();
              }}
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </>
  );
}
