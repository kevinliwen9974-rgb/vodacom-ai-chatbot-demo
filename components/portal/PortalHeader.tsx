"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDemo } from "@/hooks/useDemo";

const NAV = [
  { href: "/customer", label: "Home" },
  { href: "/customer/data-bundles", label: "Bundles" },
  { href: "/customer/recharge", label: "Recharge" },
  { href: "/customer/transfer", label: "Transfer" },
  { href: "/customer/billing", label: "Billing" },
  { href: "/customer/support", label: "Support" },
];

export function PortalHeader() {
  const pathname = usePathname();
  const { customer } = useDemo();

  return (
    <header className="border-b border-[var(--line)] bg-white/90 backdrop-blur">
      <div className="flex items-center justify-between gap-4 px-5 py-3">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/vodacom-logo.svg" alt="Vodacom" className="h-9 w-auto" />
          <span className="hidden text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)] sm:inline">
            Demo self-service
          </span>
        </div>
        <div className="text-right text-sm">
          <div className="font-semibold text-[var(--ink)]">{customer?.name ?? "…"}</div>
          <div className="text-[var(--muted)]">{customer?.msisdnDisplay}</div>
        </div>
      </div>
      <nav className="flex gap-1 overflow-x-auto px-3 pb-2">
        {NAV.map((item) => {
          const active =
            item.href === "/customer"
              ? pathname === "/customer"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition ${
                active
                  ? "bg-[var(--blue)] text-white"
                  : "text-[var(--navy)] hover:bg-[var(--blue-soft)]"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
