"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ASSET } from "@/components/sites/qr-vodacom-co-za-50a80143/shared/catalog";
import {
  QrHeader,
  QrSiteFooter,
} from "@/components/sites/qr-vodacom-co-za-50a80143/shared/QrChrome";
import { useDemo } from "@/hooks/useDemo";
import "@/components/sites/qr-vodacom-co-za-50a80143/shared/qr-vodacom.css";

const TILES = [
  { href: "/qr_portal/top-up/data", label: "Top Up", icon: "topUp.png", demo: true },
  {
    href: "/summer-deals/bundle-select",
    label: "Summer Deals",
    icon: "viewCatalog.png",
    demo: true,
  },
  { href: "#", label: "Pay Account", icon: "IconPay.png" },
  { href: "#", label: "Data", icon: "topUp.png", badge: "New", sub: "Bundles & offers" },
  { href: "#", label: "Airtime", icon: "loadVoucher.png" },
  { href: "#", label: "Transfer", icon: "TransferHome.png" },
  { href: "#", label: "Load Voucher", icon: "loadVoucher.png" },
  { href: "#", label: "View Catalogue", icon: "viewCatalog.png" },
] as const;

export function QrHubPage() {
  const { track } = useDemo();
  useEffect(() => {
    void track("page_view", "/");
  }, [track]);

  return (
    <div className="qr-vodacom flex min-h-full flex-col">
      <QrHeader />
      <div className="container mx-auto mt-8 flex-1 px-6 lg:px-10">
        <p className="mb-6 text-center text-[14px] font-light lg:text-left">
          Please select an option below
        </p>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
          {TILES.map((t) => {
            const inner = (
              <div className="relative cursor-pointer rounded-[10px] bg-white py-5 shadow-[6px_10px_50px_rgba(136,138,155,0.1)] md:p-[30px]">
                {"badge" in t && t.badge && (
                  <div className="absolute right-3 top-8 rounded bg-[var(--qr-green)] px-2 py-1 text-xs font-semibold text-[var(--qr-blue-text)]">
                    {t.badge}
                  </div>
                )}
                <div className="flex items-center px-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`${ASSET}/images/icons/${t.icon}`}
                    alt={t.label}
                    width={56}
                    height={56}
                    className="mr-4"
                  />
                  <div>
                    <h2 className="text-[16px] font-bold text-[var(--qr-blue-deep)]">
                      {t.label}
                    </h2>
                    {"sub" in t && t.sub && (
                      <p className="mt-1 text-sm">{t.sub}</p>
                    )}
                    {"demo" in t && t.demo && (
                      <p className="mt-1 text-xs text-[var(--qr-blue)]">
                        Demo path · chatbot assists
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
            return t.href === "#" ? (
              <div key={t.label} className="opacity-70">
                {inner}
              </div>
            ) : (
              <Link key={t.label} href={t.href}>
                {inner}
              </Link>
            );
          })}
        </div>
        <p className="mt-8 text-sm text-[var(--qr-muted)]">
          Showcase: open <strong>Top Up</strong> or <strong>Summer Deals</strong>,
          browse packages, and let the assistant recommend &amp; complete purchase
          in chat. Legacy mock account:{" "}
          <Link href="/customer" className="text-[var(--qr-blue)] underline">
            /customer
          </Link>
          .
        </p>
      </div>
      <QrSiteFooter />
    </div>
  );
}
