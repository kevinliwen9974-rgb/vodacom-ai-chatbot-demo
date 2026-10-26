"use client";

import { useRouter } from "next/navigation";
import { useDemo } from "@/hooks/useDemo";

export function PresenterBar() {
  const router = useRouter();
  const {
    customer,
    selectCustomer,
    resetJourney,
  } = useDemo();

  const journeyTopUp = async () => {
    await selectCustomer("sipho");
    router.push("/qr_portal/top-up/data");
  };

  const journeyDevice = async () => {
    await selectCustomer("thabo");
    router.push("/qr_portal/top-up/data");
  };

  const journeySim = async () => {
    await selectCustomer("shen");
    router.push("/");
  };

  const journeyBill = async () => {
    await selectCustomer("shen");
    router.push("/demo/bill-email");
  };

  const reset = async () => {
    await resetJourney();
    router.push("/");
  };

  return (
    <div className="flex flex-wrap items-center gap-2 bg-[var(--ink)] px-4 py-2 text-xs text-white">
      <span className="font-semibold tracking-wide opacity-80">PRESENTER</span>
      <label className="flex items-center gap-1.5">
        Customer
        <select
          className="presenter-select rounded-md border-0 bg-white/15 px-2 py-1 text-white outline-none"
          value={customer?.id ?? "sipho"}
          onChange={(e) => void selectCustomer(e.target.value)}
        >
          <option value="sipho" className="bg-white text-[var(--ink)]">
            Sipho · Top-up upgrade
          </option>
          <option value="thabo" className="bg-white text-[var(--ink)]">
            Thabo · Device deal
          </option>
          <option value="shen" className="bg-white text-[var(--ink)]">
            Li Wen · SIM self-care
          </option>
        </select>
      </label>
      <span className="mx-1 opacity-40">|</span>
      <span className="opacity-70">User journey</span>
      <button
        type="button"
        onClick={() => void journeyTopUp()}
        className="rounded-md bg-[var(--lime)] px-2.5 py-1 font-semibold text-[var(--ink)] hover:brightness-105"
      >
        1 · Top-up upgrade
      </button>
      <button
        type="button"
        onClick={() => void journeyDevice()}
        className="rounded-md bg-[var(--blue)] px-2.5 py-1 font-semibold text-white hover:brightness-105"
        title="Thabo — buy data → HUAWEI nova 15 Max contract"
      >
        2 · Data → phone
      </button>
      <button
        type="button"
        onClick={() => void journeySim()}
        className="rounded-md bg-[var(--lime)] px-2.5 py-1 font-semibold text-[var(--ink)] hover:brightness-105"
      >
        3 · SIM self-care
      </button>
      <button
        type="button"
        onClick={() => void journeyBill()}
        className="rounded-md bg-[var(--blue)] px-2.5 py-1 font-semibold text-white hover:brightness-105"
      >
        4 · Bill intelligence
      </button>
      <span className="mx-1 opacity-40">|</span>
      <button
        type="button"
        onClick={() => void reset()}
        className="rounded-md bg-white/15 px-2.5 py-1 hover:bg-white/25"
      >
        Reset Journey
      </button>
    </div>
  );
}
