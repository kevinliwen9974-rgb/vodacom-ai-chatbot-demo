"use client";

import { useCustomerBehavior } from "@/hooks/useCustomerBehavior";
import { useDemo } from "@/hooks/useDemo";

export default function CustomerDashboard() {
  useCustomerBehavior();
  const { customer, usage } = useDemo();

  if (!customer) {
    return <p className="text-[var(--muted)]">Loading account…</p>;
  }

  const maxGb = Math.max(...usage.map((u) => u.dataGb), 40);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <section>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--blue-deep)]">
          My account
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[var(--ink)]">
          Welcome, {customer.name.split(" ")[0]}
        </h1>
        <p className="mt-1 text-[var(--muted)]">
          Synthetic demo account — not a production Vodacom login.
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-[var(--line)] bg-white p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase text-[var(--muted)]">
            Current plan
          </div>
          <div className="mt-1 text-xl font-semibold">{customer.currentPlanName}</div>
          <div className="text-sm text-[var(--slate)]">
            Data left: {customer.dataBalanceGb}GB
          </div>
        </div>
        <div className="rounded-2xl border border-[var(--line)] bg-white p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase text-[var(--muted)]">
            Avg monthly usage
          </div>
          <div className="mt-1 text-xl font-semibold">
            {customer.averageDataUsageGb}GB
          </div>
          <div className="text-sm text-[var(--slate)]">Last 3 months</div>
        </div>
        <div className="rounded-2xl border border-[var(--line)] bg-white p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase text-[var(--muted)]">
            Out-of-bundle
          </div>
          <div className="mt-1 text-xl font-semibold text-[var(--blue-deep)]">
            R{customer.outOfBundleSpend}
          </div>
          <div className="text-sm text-[var(--slate)]">Average / month</div>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold">Usage history</h2>
        <div className="mt-4 flex items-end gap-4">
          {usage.map((u) => (
            <div key={u.month} className="flex flex-1 flex-col items-center gap-2">
              <div
                className="w-full rounded-t-lg bg-[var(--blue)]"
                style={{ height: `${Math.round((u.dataGb / maxGb) * 140)}px` }}
                title={`${u.dataGb}GB`}
              />
              <div className="text-xs font-medium">{u.month}</div>
              <div className="text-[0.7rem] text-[var(--muted)]">{u.dataGb}GB</div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold">SIM status</h2>
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-[var(--muted)]">Number</dt>
            <dd className="font-medium">{customer.sim.msisdn}</dd>
          </div>
          <div>
            <dt className="text-[var(--muted)]">Status</dt>
            <dd className="font-medium capitalize">{customer.sim.status}</dd>
          </div>
          <div>
            <dt className="text-[var(--muted)]">Network</dt>
            <dd className="font-medium">
              {customer.sim.network} · {customer.sim.radio}
            </dd>
          </div>
          <div>
            <dt className="text-[var(--muted)]">Airtime</dt>
            <dd className="font-medium">R{customer.airtimeBalance.toFixed(2)}</dd>
          </div>
        </dl>
      </section>

      <a
        href="/customer/data-bundles"
        className="inline-flex rounded-full bg-[var(--blue)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:brightness-105"
      >
        Browse data bundles
      </a>
    </div>
  );
}
